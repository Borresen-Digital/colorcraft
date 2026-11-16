import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuth } from "@/lib/auth";
import { cleanupAuth, shouldCleanup } from "@/lib/cleanup";
import type { D1 } from "@/lib/savedProfiles";

/**
 * Better Auth sine endepunkter (/api/auth/*). Er kontoene ikke satt opp,
 * svarer alt 503. Av og til ryddes utløpte rader i bakgrunnen.
 */
async function handler(req: Request): Promise<Response> {
  const a = await getAuth();
  if (!a) {
    return Response.json(
      { error: "Kontoer er ikke slått på ennå." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (shouldCleanup()) {
    const rydd = cleanupAuth(a.env.DB as unknown as D1).catch((e) =>
      console.error("Rydding i kontodatabasen feilet", e),
    );
    try {
      (await getCloudflareContext({ async: true })).ctx.waitUntil(rydd);
    } catch {
      // Uten Cloudflare-kontekst (lokalt): ryddingen går ferdig av seg selv.
    }
  }
  return a.auth.handler(req);
}

export const GET = handler;
export const POST = handler;
