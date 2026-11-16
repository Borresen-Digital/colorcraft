import type { D1 } from "./savedProfiles";

/**
 * Rydding i kontodatabasen: utløpte innloggingslenker og økter, og
 * fartsgrenser eldre enn et døgn. Better Auth sletter dem ikke selv, og IP-
 * adresser skal ikke ligge lenger enn de trengs.
 *
 * Kjøres i bakgrunnen på en liten andel av kallene til /api/auth, så det
 * trengs ingen egen cron-jobb.
 */

/** Andelen kall som rydder. Med jevn trafikk holder det tabellene små. */
export const CLEANUP_RATE = 0.02;

export function shouldCleanup(tilfeldig = Math.random()): boolean {
  return tilfeldig < CLEANUP_RATE;
}

export async function cleanupAuth(db: D1, nå = Date.now()): Promise<void> {
  // Better Auth lagrer datoer som ISO-tekst, som kan sammenlignes direkte.
  const iso = new Date(nå).toISOString();
  await db
    .prepare('delete from "verification" where "expiresAt" < ?')
    .bind(iso)
    .run();
  await db
    .prepare('delete from "session" where "expiresAt" < ?')
    .bind(iso)
    .run();
  await db
    .prepare('delete from "rateLimit" where "lastRequest" < ?')
    .bind(nå - 86_400_000)
    .run();
}
