/**
 * MCP over Streamable HTTP, uten tilstand: hver POST har én JSON-RPC-melding
 * (eller en liste), og svaret er vanlig JSON. Ingen SDK, samme oppsett som
 * hovedsiden. Rene funksjoner her; database og token ligger i ruten og i
 * tools.ts.
 */

export const SUPPORTED_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
export const SERVER_INFO = { name: "colorcraft", version: "1.0.0" };

export const INSTRUCTIONS = [
  "ColorCraft (farger.borresendigital.no) turns the colors from a brand guide into a color profile for a client: brand colors with HEX, RGB, CMYK and Pantone, tone scales, contrast, typography and usage rules, shown on a profile page with a short link.",
  "Profiles use the colorcraft-profile format, version 1 (see https://farger.borresendigital.no/llms.txt and the JSON Schema linked there). Roles: logo (1-3, the first is the main color), support (0-4, surface colors), highlight (0-2, small doses only, never surfaces), internal (0-6, internal use only).",
  'Never invent CMYK or Pantone values. Only include cmyk with cmykSource "manual" and pantone when the designer gives you the numbers from their brand guide. ColorCraft never converts to Pantone.',
  "A saved profile is visible to anyone who has its short link. After create_profile or update_profile, give the designer both links: profilePage to review and edit, shortLink to share. The designer decides; you suggest.",
  "Profiles cannot be deleted through MCP; the designer deletes them on the account page. Reply in the language the designer uses.",
].join("\n");

export const TOOLS = [
  {
    name: "list_profiles",
    description:
      "Lists the profiles saved in the account, newest first, with title, short link and when they were updated.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_profile",
    description:
      "Gets one saved profile as a colorcraft-profile object (colors with role, CMYK and Pantone, tone scales, typography, usage rules), with its links.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "create_profile",
    description:
      "Saves a new profile from a colorcraft-profile object. ColorCraft computes the screen palette from the brand colors exactly as the tool does. Returns the short link, a link to review it on the profile page, and notes on what was adjusted.",
    inputSchema: {
      type: "object",
      properties: {
        profile: {
          type: "object",
          description:
            'A colorcraft-profile object: { "format": "colorcraft-profile", "version": 1, "title", "colors": [{ "role", "name", "hex", ... }], ... }',
        },
        locale: { type: "string", enum: ["nb", "en"] },
      },
      required: ["profile"],
    },
    annotations: { destructiveHint: false },
  },
  {
    name: "update_profile",
    description:
      "Replaces a saved profile with a new colorcraft-profile object. The short link stays the same and shows the new version.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        profile: { type: "object" },
        locale: { type: "string", enum: ["nb", "en"] },
      },
      required: ["id", "profile"],
    },
    annotations: { destructiveHint: true, idempotentHint: true },
  },
  {
    name: "check_contrast",
    description:
      "Contrast ratio between two HEX colors under WCAG 2.2, with the level for normal and large text (AA needs 4.5:1, or 3:1 for large text and graphics).",
    inputSchema: {
      type: "object",
      properties: {
        foreground: { type: "string" },
        background: { type: "string" },
      },
      required: ["foreground", "background"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "tone_scale",
    description:
      "Tone scale 50-950 for a HEX color, in OKLCH with fixed lightness per step. The color itself is placed unchanged at the closest step.",
    inputSchema: {
      type: "object",
      properties: { hex: { type: "string" } },
      required: ["hex"],
    },
    annotations: { readOnlyHint: true },
  },
] as const;

export type ToolName = (typeof TOOLS)[number]["name"];
export const TOOL_NAMES = TOOLS.map((t) => t.name) as string[];

export type RpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: unknown;
  params?: unknown;
};

export type RpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
};

export type ToolOutcome =
  { ok: true; data: unknown } | { ok: false; error: string };

export type ToolRunner = (
  name: string,
  args: Record<string, unknown>,
) => Promise<ToolOutcome>;

const reply = (id: RpcRequest["id"], result: unknown): RpcResponse => ({
  jsonrpc: "2.0",
  id: id ?? null,
  result,
});
const fail = (
  id: RpcRequest["id"],
  code: number,
  message: string,
): RpcResponse => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
});

export function toolResult(outcome: ToolOutcome) {
  if (!outcome.ok) {
    return { content: [{ type: "text", text: outcome.error }], isError: true };
  }
  return {
    content: [{ type: "text", text: JSON.stringify(outcome.data, null, 2) }],
    structuredContent:
      outcome.data &&
      typeof outcome.data === "object" &&
      !Array.isArray(outcome.data)
        ? outcome.data
        : { items: outcome.data },
  };
}

/** Én melding. Null for notifikasjoner (uten id), som ikke skal ha svar. */
export async function handleMessage(
  message: RpcRequest,
  runTool: ToolRunner,
): Promise<RpcResponse | null> {
  if (!message || typeof message !== "object" || message.jsonrpc !== "2.0") {
    return fail(null, -32600, "Invalid JSON-RPC message");
  }
  const varsel = message.id === undefined;
  const method = message.method;
  if (typeof method !== "string") {
    return varsel ? null : fail(message.id, -32600, "method is missing");
  }
  if (varsel) return null;
  const params = (message.params ?? {}) as Record<string, unknown>;
  switch (method) {
    case "initialize": {
      const ønsket = String(params.protocolVersion ?? "");
      return reply(message.id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(ønsket)
          ? ønsket
          : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return reply(message.id, {});
    case "tools/list":
      return reply(message.id, { tools: TOOLS });
    case "tools/call": {
      const name = params.name;
      if (typeof name !== "string" || !TOOL_NAMES.includes(name)) {
        return fail(message.id, -32602, `Unknown tool: ${String(name)}`);
      }
      const args =
        params.arguments && typeof params.arguments === "object"
          ? (params.arguments as Record<string, unknown>)
          : {};
      return reply(message.id, toolResult(await runTool(name, args)));
    }
    default:
      return fail(message.id, -32601, `Method not supported: ${method}`);
  }
}
