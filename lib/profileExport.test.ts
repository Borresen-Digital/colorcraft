import { describe, expect, it } from "vitest";
import {
  FORMAT_INFO,
  PROFILE_FORMATS,
  profileFilename,
  renderProfile,
  type ProfileExportInput,
} from "./profileExport";
import { toneScale } from "./toneScale";

const INPUT: ProfileExportInput = {
  title: "Erling Olsen */ <!-- -->",
  credit: "Laget med ColorCraft (farger.borresendigital.no)",
  maker: "Testdesign",
  colors: [
    {
      group: "Logofarger",
      label: "Dark blue",
      hex: "#002245",
      cmyk: "100 80 30 40 fra manualen",
      pantone: "2945 C",
    },
    { group: "Flatefarger", label: "Varm rørfarge", hex: "#C1B694" },
    { group: "Flatefarger", label: "Varm rørfarge", hex: "#9099A3" },
    { group: "Highlight", label: "1 Fresh water", hex: "#59A8BD" },
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
    { role: "Tom", font: "", weight: 400, size: "", fallback: "", note: "" },
  ],
  rules: [
    { group: "Logofarger", text: "Alltid på hvit" },
    { group: "Generelt", text: "" },
  ],
  link: "https://farger.borresendigital.no/profil#p=havet",
  figmaNames: {
    colors: "Farger",
    tones: "Tonetrapp",
    typography: "Typografi",
    font: "Font",
    fallback: "Reservefont",
    weight: "Vekt",
    size: "Størrelse",
    note: "Merknad",
  },
};

const r = (f: (typeof PROFILE_FORMATS)[number]) => renderProfile(f, INPUT);

describe("eksport av profilen", () => {
  it("lager alle formatene, og kommentarer kan ikke lukkes av navnet", () => {
    for (const f of PROFILE_FORMATS) {
      const ut = r(f);
      expect(ut.length).toBeGreaterThan(50);
      // JSON er trygt med navnet som det er. Kode og XML må renses.
      if (!["tokens", "figma", "profile"].includes(f)) {
        expect(ut).not.toContain("*/ <!--");
      }
    }
    expect(r("css").split("*/").length - 1).toBe(1);
    // Navnet kan ikke avslutte XML-kommentaren: «--» tas ut av navnet.
    const xml = r("android");
    expect(xml.split("--").length - 1).toBe(2);
  });

  it("CSS og Tailwind har farger, tonetrapp og fonter", () => {
    const css = r("css");
    expect(css).toContain("--color-dark-blue: #002245;");
    expect(css).toContain("--color-varm-rorfarge: #c1b694;");
    expect(css).toContain("--color-varm-rorfarge-2: #9099a3;");
    expect(css).toContain("--color-dark-blue-950: #002245;");
    expect(css).toContain(
      '--font-overskrifter: "Montserrat", "Arial", sans-serif;',
    );
    expect(css).toContain("--font-weight-overskrifter: 700;");
    expect(css).not.toContain("font-tom");
    const tw = r("tailwind");
    expect(tw).toContain("@theme {");
    expect(tw).toContain("--color-dark-blue-500:");
  });

  it("SCSS har variabler og kart", () => {
    const s = r("scss");
    expect(s).toContain("$color-dark-blue: #002245;");
    expect(s).toContain("$color-dark-blue-tones: (");
    expect(s).toContain("  950: #002245,");
  });

  it("design tokens og Figma er gyldig JSON", () => {
    const t = JSON.parse(r("tokens"));
    expect(t.color["dark-blue"]).toEqual({ $type: "color", $value: "#002245" });
    expect(t.color["dark-blue-tones"]["950"].$value).toBe("#002245");
    expect(t.font.overskrifter.family.$value).toEqual([
      "Montserrat",
      "Arial",
      "sans-serif",
    ]);
    const f = JSON.parse(r("figma"));
    expect(f.Farger.Logofarger["Dark blue"].$description).toBe(
      "CMYK 100 80 30 40 fra manualen · Pantone 2945 C",
    );
  });

  it("Swift, Flutter og Android har gyldige navn", () => {
    const swift = r("swift");
    expect(swift).toContain(
      "static let darkBlue = Color(.sRGB, red: 0, green: 0.1333, blue: 0.2706)",
    );
    expect(swift).toContain("static let c1FreshWater =");
    expect(swift).toContain("static let darkBlue950 =");
    expect(swift).toContain('static let overskrifter = "Montserrat"');
    const dart = r("flutter");
    expect(dart).toContain("static const darkBlue = Color(0xFF002245);");
    expect(dart).toContain(
      "static const overskrifterWeight = FontWeight.w700;",
    );
    const xml = r("android");
    expect(xml).toContain('<color name="dark_blue">#FF002245</color>');
    expect(xml).toContain('<color name="c_1_fresh_water">');
    expect(xml).toContain('<color name="dark_blue_950">#FF002245</color>');
  });

  it("hele profilen har format, versjon, regler og Pantone", () => {
    const p = JSON.parse(r("profile"));
    expect(p.format).toBe("colorcraft-profile");
    expect(p.version).toBe(1);
    expect(p.maker).toBe("Testdesign");
    expect(p.colors[0]).toMatchObject({ name: "Dark blue", pantone: "2945 C" });
    expect(p.tones[0].steps["950"]).toBe("#002245");
    expect(p.typography).toHaveLength(1);
    expect(p.rules).toEqual([{ group: "Logofarger", text: "Alltid på hvit" }]);
  });

  it("gir filnavn per format", () => {
    expect(profileFilename("Erling Olsen", "android")).toBe("erling-olsen.xml");
    expect(Object.keys(FORMAT_INFO)).toEqual([...PROFILE_FORMATS]);
  });
});
