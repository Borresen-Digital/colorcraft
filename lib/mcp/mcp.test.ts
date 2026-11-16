import { describe, expect, it } from "vitest";
import { handleMessage, TOOLS, type ToolRunner } from "./rpc";
import { bearerToken, generateToken, hashToken, tokenLabel } from "./token";
import { parseProfileJson } from "../profileImport";
import { exportInputFromHash, hashFromImported } from "../profileModel";
import { renderProfile } from "../profileExport";
import { readMaker, readRules } from "../profile";
import { readPantone } from "../pantone";

const ekko: ToolRunner = async (name, args) => ({
  ok: true,
  data: { name, args },
});

describe("MCP-protokollen", () => {
  it("initialize gir versjon, verktøy og instruksjoner", async () => {
    const r = await handleMessage(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-03-26" },
      },
      ekko,
    );
    const res = r?.result as Record<string, unknown>;
    expect(res.protocolVersion).toBe("2025-03-26");
    expect(String(res.instructions)).toContain("Never invent CMYK");
  });

  it("lister verktøyene, uten sletting", async () => {
    const r = await handleMessage(
      { jsonrpc: "2.0", id: 2, method: "tools/list" },
      ekko,
    );
    const navn = (r?.result as { tools: { name: string }[] }).tools.map(
      (t) => t.name,
    );
    expect(navn).toEqual(TOOLS.map((t) => t.name));
    expect(navn.some((n) => n.includes("delete"))).toBe(false);
  });

  it("kaller verktøy og avviser ukjente", async () => {
    const ok = await handleMessage(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "tone_scale", arguments: { hex: "#002245" } },
      },
      ekko,
    );
    expect((ok?.result as { isError?: boolean }).isError).toBeUndefined();
    const ukjent = await handleMessage(
      {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "delete_everything" },
      },
      ekko,
    );
    expect(ukjent?.error?.code).toBe(-32602);
    expect(
      await handleMessage(
        { jsonrpc: "2.0", method: "notifications/initialized" },
        ekko,
      ),
    ).toBeNull();
    expect((await handleMessage({ id: 5 }, ekko))?.error?.code).toBe(-32600);
  });
});

describe("MCP-tokens", () => {
  it("lager, hasher og leser tokens", async () => {
    const t = generateToken();
    expect(t).toMatch(/^ccmcp_[A-Za-z0-9_-]{43}$/);
    expect(await hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashToken(t)).not.toBe(await hashToken(generateToken()));
    expect(bearerToken(`Bearer ${t}`)).toBe(t);
    expect(bearerToken(`bearer ${t}`)).toBe(t);
    expect(bearerToken("Bearer bdmcp_" + "x".repeat(43))).toBeNull();
    expect(bearerToken(null)).toBeNull();
    expect(tokenLabel(t)).toBe(`${t.slice(0, 12)}…`);
  });
});

describe("profil fra fil og tilbake", () => {
  const fil = {
    format: "colorcraft-profile",
    version: 1,
    title: "Erling Olsen",
    maker: "Testdesign",
    direction: "exclusive",
    colors: [
      {
        role: "logo",
        name: "Dark blue",
        hex: "#002245",
        cmyk: "100 80 30 40",
        cmykSource: "manual",
        pantone: "2945 C",
      },
      { role: "support", name: "Varm rørfarge", hex: "#C1B694" },
      { role: "highlight", name: "Fresh water", hex: "#59A8BD" },
    ],
    rules: [{ role: "general", text: "Luft rundt logoen" }],
  };

  it("lager en lenke med paletten og tilleggene", () => {
    const r = parseProfileJson(JSON.stringify(fil));
    if (!r.ok) throw new Error(r.error);
    const { hash, title } = hashFromImported(r.profile, "nb");
    expect(title).toBe("Erling Olsen");
    expect(readMaker(hash)).toBe("Testdesign");
    expect(readRules(hash).general).toBe("Luft rundt logoen");
    expect(readPantone(hash)).toEqual({ "002245": "2945 C" });
  });

  it("leser den samme profilen tilbake som profilfil", () => {
    const r = parseProfileJson(JSON.stringify(fil));
    if (!r.ok) throw new Error(r.error);
    const { hash } = hashFromImported(r.profile, "nb");
    const input = exportInputFromHash(hash, "nb", "https://x/p/abc");
    if (!input) throw new Error("ingen profil");
    const ut = JSON.parse(renderProfile("profile", input));
    expect(ut.title).toBe("Erling Olsen");
    expect(ut.direction).toBe("exclusive");
    expect(ut.colors[0]).toMatchObject({
      role: "logo",
      name: "Dark blue",
      hex: "#002245",
      cmyk: "100 80 30 40",
      cmykSource: "manual",
      pantone: "2945 C",
    });
    expect(ut.colors.map((c: { role: string }) => c.role)).toEqual([
      "logo",
      "support",
      "highlight",
    ]);
    // Og den kan importeres igjen uten tap.
    const igjen = parseProfileJson(JSON.stringify(ut));
    expect(igjen.ok && igjen.profile.brand).toMatchObject(r.profile.brand);
  });
});
