import { describe, expect, it } from "vitest";
import { MAX_PROFILE_BYTES, parseProfileJson } from "./profileImport";
import { renderProfile, type ProfileExportInput } from "./profileExport";
import { withProfileExtras } from "./profileExtras";
import { readMaker, readRules } from "./profile";
import { readTypography } from "./typography";
import { readPantone } from "./pantone";
import { toneScale } from "./toneScale";

const NAMES = {
  colors: "Farger",
  tones: "Tonetrapp",
  typography: "Typografi",
  font: "Font",
  fallback: "Reservefont",
  weight: "Vekt",
  size: "Størrelse",
  note: "Merknad",
};

const INPUT: ProfileExportInput = {
  title: "Erling Olsen",
  credit: "Laget med ColorCraft",
  maker: "Testdesign",
  direction: "exclusive",
  colors: [
    {
      group: "Logofarger",
      role: "logo",
      label: "Dark blue",
      hex: "#002245",
      cmykNumbers: "100 80 30 40",
      cmykFromManual: true,
      pantone: "2945 C",
    },
    {
      group: "Flatefarger",
      role: "support",
      label: "Varm rørfarge",
      hex: "#C1B694",
      cmykNumbers: "25 22 45 3",
      cmykFromManual: false,
    },
    {
      group: "Highlight",
      role: "highlight",
      label: "Fresh water",
      hex: "#59A8BD",
    },
    { group: "Intern profil", role: "internal", label: "Rød", hex: "#C0392B" },
  ],
  tones: [{ label: "Dark blue", scale: toneScale("#002245") }],
  typography: [
    {
      role: "Overskrifter",
      font: "Montserrat",
      weight: 700,
      size: "32 pt",
      fallback: "Arial",
      note: "",
    },
  ],
  rules: [
    { group: "Logofarger", role: "logo", text: "Alltid på hvit" },
    { group: "Bruksregler", role: "general", text: "Luft rundt logoen" },
  ],
  figmaNames: NAMES,
};

const json = () => renderProfile("profile", INPUT);
const fil = (o: Record<string, unknown>) =>
  JSON.stringify({ format: "colorcraft-profile", version: 1, ...o });

describe("import av profil-JSON", () => {
  it("leser inn det profilsiden eksporterer", () => {
    const r = parseProfileJson(json());
    if (!r.ok) throw new Error(r.error);
    const p = r.profile;
    expect(p.name).toBe("Erling Olsen");
    expect(p.brand).toMatchObject({
      logo: ["#002245"],
      support: ["#C1B694"],
      highlight: ["#59A8BD"],
      internal: ["#C0392B"],
      direction: "exclusive",
    });
    expect(p.brand.names?.["#C1B694"]).toBe("Varm rørfarge");
    // Bare CMYK fra manualen blir med. Omregnet CMYK regnes ut på nytt.
    expect(p.brand.cmyk).toEqual({ "#002245": "100 80 30 40" });
    expect(p.extras.maker).toBe("Testdesign");
    expect(p.extras.typography[0]).toMatchObject({
      font: "Montserrat",
      weight: 700,
    });
    expect(p.extras.rules).toEqual({
      logo: "Alltid på hvit",
      general: "Luft rundt logoen",
    });
    expect(p.extras.pantone).toEqual({ "002245": "2945 C" });
    expect(p.dropped).toBe(0);
  });

  it("tilleggene havner i lenken til profilsiden", () => {
    const r = parseProfileJson(json());
    if (!r.ok) throw new Error(r.error);
    const h = withProfileExtras("p=havet", r.profile.extras);
    expect(readMaker(h)).toBe("Testdesign");
    expect(readTypography(h)[0].font).toBe("Montserrat");
    expect(readRules(h).general).toBe("Luft rundt logoen");
    expect(readPantone(h)).toEqual({ "002245": "2945 C" });
  });

  it("leser filer uten rolle fra gruppenavnet, på begge språk", () => {
    const r = parseProfileJson(
      fil({
        title: "Uten rolle",
        colors: [
          { group: "Logo colors", name: "Navy", hex: "#002245" },
          { group: "Flatefarger", name: "Beige", hex: "#c1b694" },
        ],
      }),
    );
    if (!r.ok) throw new Error(r.error);
    expect(r.profile.brand.logo).toEqual(["#002245"]);
    expect(r.profile.brand.support).toEqual(["#C1B694"]);
  });

  it("gjør hovedfargene til en profil", () => {
    const r = parseProfileJson(
      fil({
        title: "Lardal",
        colors: [
          "#8BC34A",
          "#FF7043",
          "#D7CCC8",
          "#F3E5AB",
          "#3E2723",
          "#6D4C41",
        ].map((hex) => ({ role: "main", group: "Hovedfarger", hex })),
        rules: [{ role: "main", text: "Grønt først" }],
      }),
    );
    if (!r.ok) throw new Error(r.error);
    expect(r.profile.brand.logo).toEqual(["#8BC34A"]);
    expect(r.profile.brand.highlight).toEqual(["#FF7043"]);
    expect(r.profile.brand.support).toEqual(["#D7CCC8", "#F3E5AB"]);
    expect(r.profile.extras.rules).toEqual({ logo: "Grønt først" });
  });

  it("kutter for mange farger og hopper over dubletter og ugyldige", () => {
    const r = parseProfileJson(
      fil({
        title: "Mange",
        colors: [
          ...["#111111", "#222222", "#333333", "#444444"].map((hex) => ({
            role: "logo",
            hex,
          })),
          { role: "logo", hex: "#111111" },
          { role: "support", hex: "tull" },
          { role: "support", hex: "#555555" },
        ],
      }),
    );
    if (!r.ok) throw new Error(r.error);
    expect(r.profile.brand.logo).toHaveLength(3);
    expect(r.profile.brand.support).toEqual(["#555555"]);
    expect(r.profile.dropped).toBe(1);
  });

  it("sier fra om feil fil", () => {
    expect(parseProfileJson("ikke json")).toEqual({ ok: false, error: "json" });
    expect(parseProfileJson("[]")).toEqual({ ok: false, error: "format" });
    expect(parseProfileJson('{"format":"annet"}')).toEqual({
      ok: false,
      error: "format",
    });
    expect(parseProfileJson(fil({ version: 2, colors: [] }))).toEqual({
      ok: false,
      error: "version",
    });
    expect(parseProfileJson(fil({ colors: [] }))).toEqual({
      ok: false,
      error: "colors",
    });
    expect(parseProfileJson(" ".repeat(MAX_PROFILE_BYTES + 1))).toEqual({
      ok: false,
      error: "size",
    });
  });

  it("renser tekst og ignorerer ukjente felt", () => {
    const r = parseProfileJson(
      fil({
        title: "Navn\u0000med\nkontrolltegn " + "x".repeat(100),
        direction: "rakett",
        colors: [{ role: "logo", hex: "#002245", name: 42, ekstra: { a: 1 } }],
        typography: [{ role: "x", font: 'Evil"; }', weight: "tung" }],
        rules: [
          { role: "__proto__", text: "nei" },
          { role: "toString", text: "nei" },
          { role: "general", text: 5 },
        ],
      }),
    );
    if (!r.ok) throw new Error(r.error);
    expect(r.profile.name).not.toMatch(/[\u0000\n]/);
    expect(r.profile.name.length).toBeLessThanOrEqual(60);
    expect(r.profile.brand.direction).toBe("neutral");
    expect(r.profile.brand.names).toEqual({});
    expect(r.profile.extras.typography[0]).toMatchObject({
      font: "Evil",
      weight: 400,
    });
    expect(r.profile.extras.rules).toEqual({});
  });
});
