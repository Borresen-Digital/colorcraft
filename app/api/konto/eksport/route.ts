import { getAuth } from "@/lib/auth";

type D1 = {
  prepare: (sql: string) => {
    bind: (...v: unknown[]) => { all: () => Promise<{ results: unknown[] }> };
  };
};

/**
 * Alt vi har lagret om kontoen, som JSON (retten til innsyn og
 * dataportabilitet). Uten hemmeligheter: ingen økt-tokens og ingen
 * offentlige nøkler fra passkeys.
 */
export async function GET(req: Request): Promise<Response> {
  const a = await getAuth();
  if (!a) return new Response(null, { status: 503 });
  const økt = await a.auth.api.getSession({ headers: req.headers });
  if (!økt) return new Response(null, { status: 401 });
  const db = a.env.DB as unknown as D1;
  const id = økt.user.id;
  const rader = async (sql: string) =>
    (await db.prepare(sql).bind(id).all()).results;
  const data = {
    format: "colorcraft-account-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    user: (
      await rader(
        'select "id", "email", "name", "emailVerified", "createdAt", "updatedAt" from "user" where "id" = ?',
      )
    )[0],
    sessions: await rader(
      'select "createdAt", "updatedAt", "expiresAt", "ipAddress", "userAgent" from "session" where "userId" = ?',
    ),
    passkeys: await rader(
      'select "name", "deviceType", "backedUp", "createdAt", "aaguid" from "passkey" where "userId" = ?',
    ),
  };
  return new Response(JSON.stringify(data, null, 2) + "\n", {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="colorcraft-konto.json"',
      "Cache-Control": "no-store",
    },
  });
}
