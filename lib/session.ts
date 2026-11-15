import { getAuth } from "./auth";
import type { D1 } from "./savedProfiles";

const JSON_NO_STORE = { "Cache-Control": "no-store" };

export function svar(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: JSON_NO_STORE });
}

/**
 * Innlogget bruker og databasen for en forespørsel til våre egne API-er.
 * Endringer (alt annet enn GET) må komme fra vår egen side (Origin), i
 * tillegg til at informasjonskapselen er SameSite=Lax.
 */
export async function requireUser(
  req: Request,
): Promise<{ userId: string; db: D1 } | Response> {
  const a = await getAuth();
  if (!a) return svar({ error: "disabled" }, 503);
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    if (origin !== new URL(a.env.BETTER_AUTH_URL!).origin) {
      return svar({ error: "origin" }, 403);
    }
  }
  const økt = await a.auth.api.getSession({ headers: req.headers });
  if (!økt) return svar({ error: "unauthorized" }, 401);
  return { userId: økt.user.id, db: a.env.DB as unknown as D1 };
}
