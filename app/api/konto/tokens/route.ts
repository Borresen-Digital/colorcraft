import { requireUser, svar } from "@/lib/session";
import {
  cleanTokenName,
  generateToken,
  hashToken,
  MAX_TOKENS,
  tokenLabel,
} from "@/lib/mcp/token";
import { randomId } from "@/lib/savedProfiles";

/** MCP-tokenene i kontoen, uten selve tokenet (det finnes bare som hash). */
export async function GET(req: Request): Promise<Response> {
  const u = await requireUser(req);
  if (u instanceof Response) return u;
  const r = await u.db
    .prepare(
      'select "id", "name", "label", "createdAt", "lastUsedAt" from "mcpToken" where "userId" = ? order by "createdAt" desc',
    )
    .bind(u.userId)
    .all<{
      id: string;
      name: string;
      label: string;
      createdAt: number;
      lastUsedAt: number | null;
    }>();
  return svar({ tokens: r.results });
}

/** Nytt token. Svaret er den eneste gangen tokenet vises. */
export async function POST(req: Request): Promise<Response> {
  const u = await requireUser(req);
  if (u instanceof Response) return u;
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse((await req.text()).slice(0, 2_000));
  } catch {
    // Navnet er valgfritt.
  }
  const antall = await u.db
    .prepare('select count(*) as n from "mcpToken" where "userId" = ?')
    .bind(u.userId)
    .first<{ n: number }>();
  if ((antall?.n ?? 0) >= MAX_TOKENS) return svar({ error: "limit" }, 409);
  const token = generateToken();
  const id = randomId(16);
  const navn = cleanTokenName(body.name) || "MCP";
  await u.db
    .prepare(
      'insert into "mcpToken" ("id", "userId", "name", "label", "hash", "createdAt") values (?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      u.userId,
      navn,
      tokenLabel(token),
      await hashToken(token),
      Date.now(),
    )
    .run();
  return svar({ id, name: navn, token }, 201);
}
