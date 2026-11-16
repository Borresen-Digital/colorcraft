import type { BrandNote } from "../brand";
import { contrastLevel, contrastRatio, formatRatio } from "../contrast";
import type { Locale } from "../i18n";
import { profilePath } from "../profile";
import { renderProfile } from "../profileExport";
import { parseProfileJson } from "../profileImport";
import { exportInputFromHash, hashFromImported } from "../profileModel";
import {
  cleanLocale,
  countProfiles,
  createProfile,
  getOwnProfile,
  isProfileId,
  listProfiles,
  MAX_PROFILES,
  shortPath,
  updateProfile,
  validProfileHash,
  withSaved,
  type D1,
} from "../savedProfiles";
import { toneScale } from "../toneScale";
import type { ToolOutcome, ToolRunner } from "./rpc";

/** Flest verktøykall per token per minutt. */
export const RATE_LIMIT_PER_MINUTE = 60;

export interface McpTokenRow {
  id: string;
  userId: string;
  name: string;
}

export async function authenticate(
  db: D1,
  hash: string,
): Promise<McpTokenRow | null> {
  const row = await db
    .prepare('select "id", "userId", "name" from "mcpToken" where "hash" = ?')
    .bind(hash)
    .first<McpTokenRow>();
  if (row) {
    await db
      .prepare('update "mcpToken" set "lastUsedAt" = ? where "id" = ?')
      .bind(Date.now(), row.id)
      .run();
  }
  return row;
}

export async function isRateLimited(db: D1, tokenId: string) {
  const r = await db
    .prepare(
      'select count(*) as n from "mcpCall" where "tokenId" = ? and "createdAt" >= ?',
    )
    .bind(tokenId, Date.now() - 60_000)
    .first<{ n: number }>();
  return (r?.n ?? 0) >= RATE_LIMIT_PER_MINUTE;
}

function noteText(n: BrandNote): string {
  switch (n.kind) {
    case "adjusted-dark":
      return `${n.role}: lightened in dark mode from ${n.from} to ${n.to} to keep text contrast.`;
    case "low-contrast-light":
      return `${n.role}: ${n.color} is too light for text on the background (${formatRatio(n.ratio)}), best used as a surface or graphic.`;
    case "logo-background":
      return `Dark mode: the dark logo color ${n.from} becomes the background, with ${n.to} as the main color on top.`;
  }
}

class ToolError extends Error {}
const feil = (msg: string): never => {
  throw new ToolError(msg);
};

/**
 * Verktøyene for ett token. Hvert kall logges med verktøy og utfall, aldri
 * argumentene, så profiler og tekst ikke kopieres inn i loggen.
 */
export function toolRunner(
  db: D1,
  token: McpTokenRow,
  origin: string,
): ToolRunner {
  const lenker = (id: string, slug: string, locale: Locale, hash: string) => ({
    shortLink: `${origin}${shortPath(slug, locale)}`,
    profilePage: `${origin}${profilePath(locale)}#${withSaved(hash, id)}`,
  });

  const fraProfil = (profile: unknown, locale: Locale) => {
    if (!profile || typeof profile !== "object")
      feil("profile must be an object");
    const r = parseProfileJson(JSON.stringify(profile));
    if (!r.ok)
      feil(
        `Invalid profile: ${r.error}. See https://farger.borresendigital.no/llms.txt`,
      );
    if (!r.ok) throw new ToolError("unreachable");
    const ut = hashFromImported(r.profile, locale);
    const hash =
      validProfileHash(ut.hash) ??
      feil("The profile did not give a valid palette.");
    return {
      hash,
      title: ut.title,
      notes: ut.notes.map(noteText),
      dropped: r.profile.dropped,
    };
  };

  const kjør = async (
    name: string,
    a: Record<string, unknown>,
  ): Promise<unknown> => {
    switch (name) {
      case "list_profiles": {
        const liste = await listProfiles(db, token.userId);
        return {
          profiles: liste.map((p) => ({
            id: p.id,
            title: p.title,
            locale: p.locale,
            shortLink: `${origin}${shortPath(p.slug, cleanLocale(p.locale))}`,
            updatedAt: new Date(p.updatedAt).toISOString(),
          })),
        };
      }
      case "get_profile": {
        const id = String(a.id ?? "");
        if (!isProfileId(id)) feil("Unknown profile id.");
        const p =
          (await getOwnProfile(db, token.userId, id)) ??
          feil("Unknown profile id.");
        const locale = cleanLocale(p.locale);
        const l = lenker(p.id, p.slug, locale, p.hash);
        const input =
          exportInputFromHash(p.hash, locale, l.shortLink) ??
          feil("The saved profile could not be read.");
        return {
          id: p.id,
          ...l,
          profile: JSON.parse(renderProfile("profile", input)),
        };
      }
      case "create_profile": {
        const locale = cleanLocale(a.locale);
        if ((await countProfiles(db, token.userId)) >= MAX_PROFILES) {
          feil(
            `The account has reached the limit of ${MAX_PROFILES} profiles.`,
          );
        }
        const p = fraProfil(a.profile, locale);
        const ny = await createProfile(db, token.userId, {
          title: p.title,
          hash: p.hash,
          locale,
        });
        return {
          id: ny.id,
          title: p.title,
          ...lenker(ny.id, ny.slug, locale, p.hash),
          notes: p.notes,
          droppedColors: p.dropped,
        };
      }
      case "update_profile": {
        const id = String(a.id ?? "");
        const locale = cleanLocale(a.locale);
        if (!isProfileId(id)) feil("Unknown profile id.");
        const p = fraProfil(a.profile, locale);
        const ok = await updateProfile(db, token.userId, id, {
          title: p.title,
          hash: p.hash,
          locale,
        });
        if (!ok) feil("Unknown profile id.");
        const rad = (await getOwnProfile(db, token.userId, id))!;
        return {
          id,
          title: p.title,
          ...lenker(id, rad.slug, locale, p.hash),
          notes: p.notes,
          droppedColors: p.dropped,
        };
      }
      case "check_contrast": {
        const r = contrastRatio(
          String(a.foreground ?? ""),
          String(a.background ?? ""),
        );
        if (r === null) feil("foreground and background must be HEX colors.");
        const ratio = r!;
        return {
          ratio: Math.round(ratio * 100) / 100,
          text: formatRatio(ratio),
          normalText: contrastLevel(ratio),
          largeText: contrastLevel(ratio, true),
        };
      }
      case "tone_scale": {
        const steps = toneScale(String(a.hex ?? ""));
        if (steps.length === 0) feil("hex must be a HEX color.");
        return {
          steps: steps.map((s) => ({
            step: s.step,
            hex: s.hex,
            base: s.base,
            text: s.text,
          })),
        };
      }
      default:
        return feil(`Unknown tool: ${name}`);
    }
  };

  return async (name, args): Promise<ToolOutcome> => {
    let utfall: ToolOutcome;
    try {
      utfall = { ok: true, data: await kjør(name, args) };
    } catch (e) {
      utfall = {
        ok: false,
        error: e instanceof ToolError ? e.message : "The tool failed.",
      };
      if (!(e instanceof ToolError))
        console.error("MCP-verktøy feilet", name, e);
    }
    try {
      await db
        .prepare(
          'insert into "mcpCall" ("tokenId", "tool", "ok", "createdAt") values (?, ?, ?, ?)',
        )
        .bind(token.id, name, utfall.ok ? 1 : 0, Date.now())
        .run();
      // Kallene trengs bare for fartsgrensen. Eldre enn et døgn ryddes.
      await db
        .prepare('delete from "mcpCall" where "createdAt" < ?')
        .bind(Date.now() - 86_400_000)
        .run();
    } catch {
      // Loggen skal aldri stoppe verktøyet.
    }
    return utfall;
  };
}
