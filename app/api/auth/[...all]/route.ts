import { getAuth } from "@/lib/auth";

/**
 * Better Auth sine endepunkter (/api/auth/*). Er kontoene ikke satt opp,
 * svarer alt 503.
 */
async function handler(req: Request): Promise<Response> {
  const a = await getAuth();
  if (!a) {
    return Response.json(
      { error: "Kontoer er ikke slått på ennå." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return a.auth.handler(req);
}

export const GET = handler;
export const POST = handler;
