import { describe, expect, it } from "vitest";
import { colorPalettes, type ExtendedColorPalette } from "@/data/palettes";
import { decodeShare, encodeShare } from "./share";

const larvikitt = colorPalettes.find((p) => p.id === "larvikitt")!;

const egen: ExtendedColorPalette = {
  id: "custom-123",
  name: "Min palett",
  description: "test",
  colors: { ...larvikitt.colors, primary: "#123456" },
  darkVariant: {
    ...larvikitt.darkVariant!,
    id: "custom-123-dark",
    colors: { ...larvikitt.darkVariant!.colors, primary: "#ABCDEF" },
  },
};

describe("innebygde paletter", () => {
  it("deles med id, og mørk modus følger med", () => {
    expect(encodeShare(larvikitt, false)).toBe("p=larvikitt");
    expect(encodeShare(larvikitt, true)).toBe("p=larvikitt&m=dark");
    expect(decodeShare("#p=larvikitt&m=dark")).toEqual({
      kind: "builtin",
      id: "larvikitt",
      dark: true,
    });
  });

  it("forstår id-er fra V1", () => {
    expect(decodeShare("#p=erebor")).toEqual({
      kind: "builtin",
      id: "larvikitt",
      dark: false,
    });
    expect(decodeShare("#p=shire-dark")).toEqual({
      kind: "builtin",
      id: "sande",
      dark: true,
    });
  });

  it("deles med fargene når en innebygd palett er endret", () => {
    const endret = {
      ...larvikitt,
      colors: { ...larvikitt.colors, primary: "#000000" },
    };
    const lenke = encodeShare(endret, false);
    expect(lenke).toContain("l=");
    const s = decodeShare(lenke)!;
    expect(s.kind).toBe("custom");
    if (s.kind === "custom") expect(s.palette.colors.primary).toBe("#000000");
  });

  it("avviser ukjent id", () => {
    expect(decodeShare("#p=finnes-ikke")).toBeNull();
  });
});

describe("egne paletter", () => {
  it("går rundt uten tap: navn, alle farger, mørk variant og modus", () => {
    const s = decodeShare(encodeShare(egen, true))!;
    expect(s.kind).toBe("custom");
    if (s.kind !== "custom") return;
    expect(s.dark).toBe(true);
    expect(s.palette.name).toBe("Min palett");
    expect(s.palette.colors).toEqual(
      Object.fromEntries(
        Object.entries(egen.colors).map(([k, v]) => [k, v.toUpperCase()]),
      ),
    );
    expect(s.palette.darkVariant?.colors.primary).toBe("#ABCDEF");
    expect(s.palette.id).toMatch(/^shared-[0-9a-z]+$/);
    expect(s.palette.darkVariant?.id).toBe(`${s.palette.id}-dark`);
  });

  it("gir samme id for samme lenke", () => {
    const lenke = encodeShare(egen, false);
    const a = decodeShare(lenke);
    const b = decodeShare(lenke);
    expect(
      a?.kind === "custom" &&
        b?.kind === "custom" &&
        a.palette.id === b.palette.id,
    ).toBe(true);
  });

  it("bruker %20 og ikke + for mellomrom", () => {
    expect(encodeShare(egen, false)).toContain("n=Min%20palett");
  });

  it("virker uten mørk variant, og ignorerer m=dark da", () => {
    const bareLys = { ...egen, darkVariant: undefined };
    const lenke = encodeShare(bareLys, true);
    expect(lenke).not.toContain("d=");
    const s = decodeShare(lenke + "&m=dark")!;
    expect(s.kind === "custom" && s.dark).toBe(false);
  });
});

describe("ugyldig innhold", () => {
  it("avviser feil lengde, ikke-hex og ukjent versjon", () => {
    expect(decodeShare("#l=abc")).toBeNull();
    expect(decodeShare(`#l=${"z".repeat(84)}`)).toBeNull();
    expect(decodeShare(`#v=2&l=${"a".repeat(84)}`)).toBeNull();
    expect(decodeShare("")).toBeNull();
    expect(decodeShare("#tilfeldig")).toBeNull();
  });

  it("vasker navnet og begrenser lengden", () => {
    const s = decodeShare(
      `#n=${encodeURIComponent("a\u0000b\n" + "x".repeat(200))}&l=${"a".repeat(84)}`,
    )!;
    expect(s.kind).toBe("custom");
    if (s.kind !== "custom") return;
    expect(s.palette.name).not.toMatch(/[\u0000-\u001f]/);
    expect(s.palette.name.length).toBeLessThanOrEqual(60);
  });

  it("gir et navn når det mangler", () => {
    const s = decodeShare(`#l=${"a".repeat(84)}`)!;
    expect(s.kind === "custom" && s.palette.name).toBe("Shared palette");
  });
});

describe("palett fra profilmanualen", () => {
  const merke: ExtendedColorPalette = {
    ...egen,
    brand: {
      logo: ["#6B8E23"],
      support: ["#F5F5DC", "#2F4F4F"],
      highlight: ["#DAA520"],
      internal: ["#E07A5F", "#3D405B"],
      direction: "exclusive",
      names: { "#6B8E23": "Gressgrønn", "#DAA520": "Gull | glans" },
      cmyk: { "#6B8E23": "45, 0, 100, 30", "#E07A5F": "tull" },
    },
  };

  it("tar med merkefargene, highlight, intern profil, navn og CMYK", () => {
    const s = decodeShare(encodeShare(merke, false))!;
    expect(s.kind).toBe("custom");
    if (s.kind !== "custom") return;
    expect(s.palette.brand).toEqual({
      logo: ["#6B8E23"],
      support: ["#F5F5DC", "#2F4F4F"],
      highlight: ["#DAA520"],
      internal: ["#E07A5F", "#3D405B"],
      direction: "exclusive",
      names: { "#6B8E23": "Gressgrønn", "#DAA520": "Gull / glans" },
      cmyk: { "#6B8E23": "45 0 100 30" },
    });
  });

  it("gir en annen id når bare merkefargene er forskjellige", () => {
    const a = decodeShare(encodeShare(merke, false))!;
    const b = decodeShare(encodeShare(egen, false))!;
    if (a.kind === "custom" && b.kind === "custom") {
      expect(a.palette.id).not.toBe(b.palette.id);
      expect(b.palette.brand).toBeUndefined();
    }
  });

  it("dropper merket hvis fargene er ødelagt, men beholder paletten", () => {
    const lenke = encodeShare(merke, false).replace(/bl=[0-9a-f]+/, "bl=zz");
    const s = decodeShare(lenke)!;
    expect(s.kind).toBe("custom");
    if (s.kind === "custom") expect(s.palette.brand).toBeUndefined();
  });

  it("ukjent retning blir nøytral", () => {
    const lenke = encodeShare(merke, false).replace(
      "br=exclusive",
      "br=hacker",
    );
    const s = decodeShare(lenke)!;
    if (s.kind === "custom") expect(s.palette.brand?.direction).toBe("neutral");
  });
});
