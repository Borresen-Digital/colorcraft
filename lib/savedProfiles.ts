import { DEFAULT_LOCALE, isLocale, MESSAGES, type Locale } from "./i18n";
import { decodeShare } from "./share";

/**
 * Profiler lagret i kontoen (K2). En profil lagres som fragmentet den
 * allerede er (#…), med logoen, så alt profilsiden kan vise, kan også
 * lagres. Den korte lenken /p/<slug> viser den lagrede profilen.
 *
 * Slug og id er tilfeldige, så lenken ikke kan gjettes. Eieren sjekkes på
 * serveren for alt som endrer eller sletter.
 */

/** Flest profiler per konto. */
export const MAX_PROFILES = 100;
/** Lengste fragment. En profil med logo er under 20 000 tegn. */
export const MAX_HASH = 40_000;
const MAX_TITLE = 60;
export const SLUG_LENGTH = 10;

/** Fragmentet viser til en lagret profil med `sid`. Ikke en del av profilen. */
export const SAVED_PARAM = "sid";

const ALFABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** Tilfeldig tekst fra ALFABET, uten skjevhet (avviser bytes over 247). */
export function randomId(lengde: number): string {
  let ut = "";
  while (ut.length < lengde) {
    for (const b of crypto.getRandomValues(new Uint8Array(lengde * 2))) {
      if (b < 248 && ut.length < lengde) ut += ALFABET[b % 62];
    }
  }
  return ut;
}

export function isSlug(s: string): boolean {
  return new RegExp(`^[0-9A-Za-z]{${SLUG_LENGTH}}$`).test(s);
}

export function isProfileId(s: string): boolean {
  return /^[0-9A-Za-z]{16}$/.test(s);
}

export function cleanTitle(s: unknown): string {
  return typeof s === "string"
    ? s
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_TITLE)
    : "";
}

/** Fragmentet uten `sid`. */
export function withoutSaved(hash: string): string {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  q.delete(SAVED_PARAM);
  return q.toString().replace(/\+/g, "%20");
}

/** Fragmentet med `sid` satt. */
export function withSaved(hash: string, id: string): string {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  q.set(SAVED_PARAM, id);
  return q.toString().replace(/\+/g, "%20");
}

export function readSaved(hash: string): string | null {
  const v = new URLSearchParams(hash.replace(/^#/, "")).get(SAVED_PARAM);
  return v && isProfileId(v) ? v : null;
}

/**
 * Fragmentet renset og sjekket: uten `sid`, ikke for langt, og det må gi en
 * palett. Null når det ikke er en profil.
 */
export function validProfileHash(hash: unknown): string | null {
  if (typeof hash !== "string") return null;
  const h = withoutSaved(hash.replace(/^#/, ""));
  if (h.length === 0 || h.length > MAX_HASH) return null;
  return decodeShare(h, MESSAGES[DEFAULT_LOCALE].palette) ? h : null;
}

export function cleanLocale(s: unknown): Locale {
  return typeof s === "string" && isLocale(s) ? s : DEFAULT_LOCALE;
}

/** Stien til den korte lenken. Norsk har ikke prefiks. */
export function shortPath(slug: string, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? `/p/${slug}` : `/${locale}/p/${slug}`;
}

// ---------- D1 ----------

type Stmt = {
  bind: (...v: unknown[]) => Stmt;
  first: <T>() => Promise<T | null>;
  all: <T>() => Promise<{ results: T[] }>;
  run: () => Promise<{ meta?: { changes?: number } }>;
};
export type D1 = { prepare: (sql: string) => Stmt };

export interface SavedProfileRow {
  id: string;
  slug: string;
  locale: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export async function listProfiles(db: D1, userId: string) {
  return (
    await db
      .prepare(
        'select "id", "slug", "locale", "title", "createdAt", "updatedAt" from "savedProfile" where "userId" = ? order by "updatedAt" desc',
      )
      .bind(userId)
      .all<SavedProfileRow>()
  ).results;
}

export async function getOwnProfile(db: D1, userId: string, id: string) {
  return db
    .prepare(
      'select "id", "slug", "locale", "title", "hash", "createdAt", "updatedAt" from "savedProfile" where "id" = ? and "userId" = ?',
    )
    .bind(id, userId)
    .first<SavedProfileRow & { hash: string }>();
}

export async function getBySlug(db: D1, slug: string) {
  return db
    .prepare(
      'select "slug", "locale", "title", "hash", "updatedAt" from "savedProfile" where "slug" = ?',
    )
    .bind(slug)
    .first<{
      slug: string;
      locale: string;
      title: string;
      hash: string;
      updatedAt: number;
    }>();
}

export async function countProfiles(db: D1, userId: string): Promise<number> {
  const r = await db
    .prepare('select count(*) as n from "savedProfile" where "userId" = ?')
    .bind(userId)
    .first<{ n: number }>();
  return r?.n ?? 0;
}

/** Ny profil med ny slug. Prøver på nytt i det usannsynlige tilfellet av lik slug. */
export async function createProfile(
  db: D1,
  userId: string,
  data: { title: string; hash: string; locale: Locale },
) {
  const nå = Date.now();
  for (let forsøk = 0; forsøk < 3; forsøk++) {
    const id = randomId(16);
    const slug = randomId(SLUG_LENGTH);
    try {
      await db
        .prepare(
          'insert into "savedProfile" ("id", "userId", "slug", "locale", "title", "hash", "createdAt", "updatedAt") values (?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(id, userId, slug, data.locale, data.title, data.hash, nå, nå)
        .run();
      return { id, slug, locale: data.locale };
    } catch (e) {
      if (forsøk === 2) throw e;
    }
  }
  throw new Error("Kunne ikke lage profil");
}

/** Oppdaterer en profil eieren har. Lenken (slug) er den samme. */
export async function updateProfile(
  db: D1,
  userId: string,
  id: string,
  data: { title: string; hash: string; locale: Locale },
): Promise<boolean> {
  const r = await db
    .prepare(
      'update "savedProfile" set "title" = ?, "hash" = ?, "locale" = ?, "updatedAt" = ? where "id" = ? and "userId" = ?',
    )
    .bind(data.title, data.hash, data.locale, Date.now(), id, userId)
    .run();
  return (r.meta?.changes ?? 0) > 0;
}

export async function deleteProfile(
  db: D1,
  userId: string,
  id: string,
): Promise<boolean> {
  const r = await db
    .prepare('delete from "savedProfile" where "id" = ? and "userId" = ?')
    .bind(id, userId)
    .run();
  return (r.meta?.changes ?? 0) > 0;
}
