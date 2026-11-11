import { describe, expect, it } from "vitest";
import { colorPalettes, type ExtendedColorPalette } from "@/data/palettes";
import { fileSlug, toCss, toJson, toTailwind } from "./export";

const havet = colorPalettes.find((p) => p.id === "havet")!;
const utenMork: ExtendedColorPalette = { ...havet, darkVariant: undefined };

describe("toCss", () => {
  const css = toCss(havet);

  it("har lys modus på :root og mørk både med data-theme og systemvalg", () => {
    expect(css).toContain(":root {\n  color-scheme: light;");
    expect(css).toContain('[data-theme="dark"] {\n  color-scheme: dark;');
    expect(css).toContain(
      '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {',
    );
  });

  it("tar med alle rollene og tekstfargen på knapper", () => {
    expect(css).toContain("--color-primary: #0284C7;");
    expect(css).toContain("--color-foreground: #1E293B;");
    expect(css).toMatch(/--color-on-primary: #[0-9A-F]{6};/);
    expect(css).toMatch(/--color-on-accent: #[0-9A-F]{6};/);
  });

  it("har bare :root når paletten mangler mørk variant", () => {
    const enkel = toCss(utenMork);
    expect(enkel).toContain(":root {");
    expect(enkel).not.toContain("data-theme");
    expect(enkel).not.toContain("color-scheme");
  });

  it("lar ikke et palettnavn lukke kommentaren", () => {
    const farlig = toCss({ ...utenMork, name: "x */ body{display:none} /*" });
    expect(farlig.split("*/").length).toBe(2);
  });
});

describe("toTailwind", () => {
  const tw = toTailwind(havet);

  it("gjør variablene til klasser med @theme inline", () => {
    expect(tw).toContain('@import "tailwindcss";');
    expect(tw).toContain("@theme inline {");
    expect(tw).toContain("--color-primary: var(--palette-primary);");
    expect(tw).toContain("--palette-primary: #0284C7;");
  });

  it("har en dark-variant som følger data-theme", () => {
    expect(tw).toContain("@custom-variant dark");
    expect(toTailwind(utenMork)).not.toContain("@custom-variant");
  });

  it("refererer aldri til seg selv (ingen sirkulær variabel)", () => {
    expect(tw).not.toMatch(/--color-(\S+): var\(--color-\1\)/);
  });
});

describe("toJson", () => {
  const json = JSON.parse(toJson(havet));

  it("følger DTCG med $type og $value", () => {
    expect(json.light.color.primary).toEqual({
      $type: "color",
      $value: "#0284C7",
    });
    expect(json.dark.color.background.$value).toBe("#0F172A");
  });

  it("utelater dark uten mørk variant", () => {
    expect(JSON.parse(toJson(utenMork)).dark).toBeUndefined();
  });
});

describe("fileSlug", () => {
  it("gjør norske navn om til trygge filnavn", () => {
    expect(fileSlug("Bøkeskogen mørk")).toBe("bokeskogen-mork");
    expect(fileSlug("Verdens Ende")).toBe("verdens-ende");
    expect(fileSlug("Æ Å")).toBe("ae-a");
    expect(fileSlug("../..")).toBe("palett");
  });
});
