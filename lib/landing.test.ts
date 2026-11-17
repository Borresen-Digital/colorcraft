import { describe, expect, it } from "vitest";
import { legacyRedirectScript, toolPath } from "./i18n";

/** Kjører skriptet med en tenkt adresse og gir det det sendte videre til. */
function kjør(hash: string, locale: "nb" | "en" = "nb"): string | null {
  let til: string | null = null;
  const location = { hash, replace: (u: string) => (til = u) };
  new Function("location", "addEventListener", legacyRedirectScript(locale))(
    location,
    () => {},
  );
  return til;
}

describe("forsiden og verktøyet", () => {
  it("har verktøyet på /verktoy", () => {
    expect(toolPath("nb")).toBe("/verktoy");
    expect(toolPath("en")).toBe("/en/verktoy");
  });

  it("sender gamle delte lenker videre til verktøyet", () => {
    expect(kjør("#p=havet")).toBe("/verktoy#p=havet");
    expect(kjør("#v=1&n=Lardal&l=abc")).toBe("/verktoy#v=1&n=Lardal&l=abc");
    expect(kjør("#m=dark&p=havet", "en")).toBe("/en/verktoy#m=dark&p=havet");
  });

  it("lar ankere og tom adresse være", () => {
    expect(kjør("")).toBeNull();
    expect(kjør("#slik")).toBeNull();
    expect(kjør("#personvern")).toBeNull();
  });
});
