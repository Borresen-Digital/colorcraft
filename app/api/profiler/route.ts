import { requireUser, svar } from "@/lib/session";
import {
  cleanLocale,
  cleanTitle,
  countProfiles,
  createProfile,
  isProfileId,
  listProfiles,
  MAX_HASH,
  MAX_PROFILES,
  updateProfile,
  validProfileHash,
} from "@/lib/savedProfiles";

/** Profilene i kontoen, nyeste først. */
export async function GET(req: Request): Promise<Response> {
  const u = await requireUser(req);
  if (u instanceof Response) return u;
  return svar({ profiles: await listProfiles(u.db, u.userId) });
}

/**
 * Lagre en profil. Med `id` oppdateres den lagrede profilen (samme korte
 * lenke), ellers lages en ny.
 */
export async function POST(req: Request): Promise<Response> {
  const u = await requireUser(req);
  if (u instanceof Response) return u;
  const tekst = await req.text();
  if (tekst.length > MAX_HASH + 2_000) return svar({ error: "too-large" }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(tekst);
  } catch {
    return svar({ error: "json" }, 400);
  }
  const hash = validProfileHash(body.hash);
  if (!hash) return svar({ error: "invalid" }, 400);
  const data = {
    hash,
    title: cleanTitle(body.title) || "ColorCraft",
    locale: cleanLocale(body.locale),
  };
  if (typeof body.id === "string" && isProfileId(body.id)) {
    const ok = await updateProfile(u.db, u.userId, body.id, data);
    if (!ok) return svar({ error: "not-found" }, 404);
    const rad = (await listProfiles(u.db, u.userId)).find(
      (p) => p.id === body.id,
    );
    return svar({ id: body.id, slug: rad?.slug, locale: data.locale });
  }
  if ((await countProfiles(u.db, u.userId)) >= MAX_PROFILES) {
    return svar({ error: "limit" }, 409);
  }
  return svar(await createProfile(u.db, u.userId, data), 201);
}
