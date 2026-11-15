import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { colorPalettes } from "@/data/palettes";
import { DIRECTIONS } from "./brand";
import { COLOR_ROLES } from "./share";
import { RULE_PARAMS } from "./profile";
import { renderProfile } from "./profileExport";
import { toneScale } from "./toneScale";
import { parseProfileJson } from "./profileImport";

/**
 * llms.txt og skjemaet beskriver formatene for andre verktøy og AI. Prøvene
 * passer på at beskrivelsen ikke glir fra koden.
 */

const les = (fil: string) =>
  readFileSync(join(process.cwd(), "public", fil), "utf8");
const llms = les("llms.txt");
const skjema = JSON.parse(les("schema/colorcraft-profile-1.schema.json"));

const eksport = JSON.parse(
  renderProfile("profile", {
    title: "Prøve",
    credit: "Laget med ColorCraft",
    maker: "Test",
    direction: "tonal",
    link: "https://farger.borresendigital.no/profil#p=havet",
    colors: [
      {
        group: "Logofarger",
        role: "logo",
        label: "Navy",
        hex: "#002245",
        cmykNumbers: "100 80 30 40",
        cmykFromManual: true,
        pantone: "2945 C",
      },
    ],
    tones: [{ label: "Navy", scale: toneScale("#002245") }],
    typography: [
      {
        role: "H",
        font: "Inter",
        weight: 700,
        size: "1",
        fallback: "Arial",
        note: "n",
      },
    ],
    rules: [{ group: "Logofarger", role: "logo", text: "Regel" }],
    figmaNames: {
      colors: "",
      tones: "",
      typography: "",
      font: "",
      fallback: "",
      weight: "",
      size: "",
      note: "",
    },
  }),
);

describe("llms.txt og skjemaet", () => {
  it("nevner alle innebygde paletter", () => {
    for (const p of colorPalettes) expect(llms).toContain(`\`${p.id}\``);
  });

  it("har fargerollene i riktig rekkefølge", () => {
    expect(llms).toContain(COLOR_ROLES.join(", "));
  });

  it("har alle retningene og regelparameterne", () => {
    for (const d of DIRECTIONS) expect(llms).toContain(`\`${d}\``);
    for (const p of Object.values(RULE_PARAMS))
      expect(llms).toContain(`\`${p}\``);
    expect(skjema.properties.direction.enum).toEqual(DIRECTIONS);
  });

  it("skjemaet dekker alt eksporten skriver", () => {
    const p = skjema.properties;
    for (const k of Object.keys(eksport)) expect(p).toHaveProperty(k);
    for (const k of Object.keys(eksport.colors[0])) {
      expect(p.colors.items.properties).toHaveProperty(k);
    }
    for (const k of Object.keys(eksport.typography[0])) {
      expect(p.typography.items.properties).toHaveProperty(k);
    }
    for (const k of Object.keys(eksport.rules[0])) {
      expect(p.rules.items.properties).toHaveProperty(k);
    }
    expect(p.format.const).toBe(eksport.format);
    expect(p.version.const).toBe(eksport.version);
  });

  it("eksempelfilen i llms.txt kan importeres", () => {
    const start = llms.indexOf("```json") + "```json".length;
    const slutt = llms.indexOf("```", start);
    const r = parseProfileJson(llms.slice(start, slutt));
    if (!r.ok) throw new Error(r.error);
    expect(r.profile.brand.logo).toEqual(["#002245"]);
    expect(r.profile.brand.cmyk).toEqual({ "#002245": "100 80 30 40" });
    expect(r.profile.extras.typography).toHaveLength(1);
    expect(Object.keys(r.profile.extras.rules)).toEqual(["logo", "general"]);
  });

  it("regelrollene i skjemaet er de importen godtar", () => {
    expect(
      [...skjema.properties.rules.items.properties.role.enum].sort(),
    ).toEqual(Object.keys(RULE_PARAMS).sort());
  });
});
