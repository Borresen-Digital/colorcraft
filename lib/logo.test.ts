import { describe, expect, it } from "vitest";
import { checkLogoFile, LOGO_MAX_BYTES, monoFor, pickLogo } from "./logo";

const alle = { color: "blob:farge", black: "blob:sort", white: "blob:hvit" };

describe("pickLogo", () => {
  it("bruker fargeversjonen der logoen står i logofargen", () => {
    expect(pickLogo(alle, "#F5EFE0", true)?.variant).toBe("color");
  });

  it("bruker hvit på mørke flater og sort på lyse når logoen er i én farge", () => {
    expect(pickLogo(alle, "#002245", false)?.variant).toBe("white");
    expect(pickLogo(alle, "#C8AD78", false)?.variant).toBe("black");
  });

  it("faller tilbake til fargeversjonen, og så den andre i én farge", () => {
    expect(pickLogo({ color: "blob:farge" }, "#002245", false)?.variant).toBe(
      "color",
    );
    expect(pickLogo({ black: "blob:sort" }, "#002245", false)?.variant).toBe(
      "black",
    );
    expect(pickLogo({ white: "blob:hvit" }, "#FFFFFF", true)?.variant).toBe(
      "white",
    );
  });

  it("gir ingenting uten opplastet logo, så plassholderen vises", () => {
    expect(pickLogo({}, "#FFFFFF", true)).toBeNull();
  });
});

describe("monoFor", () => {
  it("velger etter kontrast", () => {
    expect(monoFor("#7E1961")).toBe("white");
    expect(monoFor("#EFE6CA")).toBe("black");
  });
});

describe("checkLogoFile", () => {
  it("tar SVG, PNG, JPG og WebP, også SVG uten MIME-type", () => {
    expect(
      checkLogoFile({ name: "a.svg", type: "image/svg+xml", size: 10 }),
    ).toBeNull();
    expect(checkLogoFile({ name: "a.svg", type: "", size: 10 })).toBeNull();
    expect(
      checkLogoFile({ name: "a.webp", type: "image/webp", size: 10 }),
    ).toBeNull();
  });

  it("avviser andre filtyper og for store filer", () => {
    expect(
      checkLogoFile({ name: "a.pdf", type: "application/pdf", size: 10 }),
    ).toBe("type");
    expect(checkLogoFile({ name: "a.ai", type: "", size: 10 })).toBe("type");
    expect(
      checkLogoFile({
        name: "a.png",
        type: "image/png",
        size: LOGO_MAX_BYTES + 1,
      }),
    ).toBe("size");
  });
});
