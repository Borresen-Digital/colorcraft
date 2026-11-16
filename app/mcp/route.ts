import { getAuth } from "@/lib/auth";
import { handleMessage, type RpcRequest } from "@/lib/mcp/rpc";
import { bearerToken, hashToken } from "@/lib/mcp/token";
import { authenticate, isRateLimited, toolRunner } from "@/lib/mcp/tools";
import type { D1 } from "@/lib/savedProfiles";

/**
 * MCP-serveren: en AI (for eksempel Claude) leser, lager og oppdaterer
 * profiler i kontoen. Streamable HTTP uten sesjoner: én POST per
 * JSON-RPC-melding (eller liste). Krever `Authorization: Bearer ccmcp_…`
 * fra kontosiden; uten gyldig token 401.
 */
export const dynamic = "force-dynamic";

const HODER = { "Cache-Control": "no-store" };
const MAX_BODY = 200_000;

const rpcFeil = (status: number, code: number, message: string, ekstra = {}) =>
  Response.json(
    { jsonrpc: "2.0", id: null, error: { code, message } },
    { status, headers: { ...HODER, ...ekstra } },
  );

const uautorisert = () =>
  rpcFeil(401, -32001, "Missing or invalid MCP token", {
    "WWW-Authenticate": 'Bearer realm="colorcraft-mcp"',
  });

export async function POST(req: Request): Promise<Response> {
  const token = bearerToken(req.headers.get("authorization"));
  if (!token) return uautorisert();
  const a = await getAuth();
  if (!a) return rpcFeil(503, -32002, "Accounts are not enabled");
  const origin = new URL(a.env.BETTER_AUTH_URL!).origin;
  // Mot DNS-rebinding: kommer kallet fra en nettside, må det være vår.
  const fra = req.headers.get("origin");
  if (fra && fra !== origin) return rpcFeil(403, -32003, "Invalid origin");

  const tekst = await req.text();
  if (tekst.length > MAX_BODY) return rpcFeil(413, -32600, "Request too large");
  let body: unknown;
  try {
    body = JSON.parse(tekst);
  } catch {
    return rpcFeil(400, -32700, "Invalid JSON");
  }

  const db = a.env.DB as unknown as D1;
  const rad = await authenticate(db, await hashToken(token));
  if (!rad) return uautorisert();
  const meldinger = (Array.isArray(body) ? body : [body]) as RpcRequest[];
  if (meldinger.length > 20) return rpcFeil(400, -32600, "Too many messages");
  if (
    meldinger.some((m) => m?.method === "tools/call") &&
    (await isRateLimited(db, rad.id))
  ) {
    return rpcFeil(429, -32004, "Too many calls; wait a minute", {
      "Retry-After": "60",
    });
  }

  const kjør = toolRunner(db, rad, origin);
  const svar = [];
  for (const m of meldinger) {
    const s = await handleMessage(m, kjør);
    if (s) svar.push(s);
  }
  if (svar.length === 0)
    return new Response(null, { status: 202, headers: HODER });
  return Response.json(Array.isArray(body) ? svar : svar[0], {
    headers: HODER,
  });
}

/** Ingen SSE-strøm: serveren svarer bare på POST. */
export function GET(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
