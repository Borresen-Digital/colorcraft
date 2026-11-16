/**
 * MCP-tokens: «ccmcp_» + 32 tilfeldige byte i base64url, samme mønster som
 * hovedsiden. Bare SHA-256-hashen lagres; selve tokenet vises én gang.
 */

export const TOKEN_PREFIX = "ccmcp_";
export const MAX_TOKENS = 10;

function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateToken(): string {
  return `${TOKEN_PREFIX}${base64url(crypto.getRandomValues(new Uint8Array(32)))}`;
}

export async function hashToken(token: string): Promise<string> {
  const d = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return [...new Uint8Array(d)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Bearer-token fra Authorization-headeren, eller null. */
export function bearerToken(header: string | null): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(header ?? "");
  if (!m) return null;
  const t = m[1];
  return t.startsWith(TOKEN_PREFIX) && t.length >= 40 && t.length <= 80
    ? t
    : null;
}

/** Synlig del på kontosiden, for eksempel «ccmcp_a1B2c3…». */
export function tokenLabel(token: string): string {
  return `${token.slice(0, TOKEN_PREFIX.length + 6)}…`;
}

export function cleanTokenName(s: unknown): string {
  return typeof s === "string"
    ? s
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 40)
    : "";
}
