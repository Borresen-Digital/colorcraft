import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

/**
 * Rammen rundt verktøyet skal selv bestå kontrastkravene den sjekker for
 * andre. Prøven leser tokens fra app/globals.css, for både lys og mørk.
 */
const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

function tokens(blokk: string): Record<string, string> {
  return Object.fromEntries(
    [...blokk.matchAll(/--cc-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
}

const lys = tokens(css.slice(css.indexOf(":root {"), css.indexOf("}")));
const mørkStart = css.indexOf('[data-theme="dark"] {');
const mørk = tokens(css.slice(mørkStart, css.indexOf("}", mørkStart)));
const medieStart = css.indexOf("@media (prefers-color-scheme: dark)");
const medie = tokens(css.slice(medieStart, css.indexOf("@theme")));

const TEKST: [string, string][] = [
  ["ink", "paper"],
  ["ink", "panel"],
  ["ink", "sunken"],
  ["subtle", "paper"],
  ["subtle", "panel"],
  ["subtle", "sunken"],
  ["accent", "panel"],
  ["accent", "paper"],
  ["accent-ink", "accent"],
  ["paper", "ink"],
  ["ok", "ok-soft"],
  ["warn", "warn-soft"],
  ["bad", "bad-soft"],
  ["bad", "panel"],
  ["accent", "accent-soft"],
];

describe("designtokens", () => {
  it("har de samme tokenene i lys, mørk og systemvalget", () => {
    expect(Object.keys(lys).length).toBeGreaterThan(10);
    expect(Object.keys(mørk).sort()).toEqual(Object.keys(lys).sort());
    expect(medie).toEqual(mørk);
  });

  for (const [navn, t] of [
    ["lys", lys],
    ["mørk", mørk],
  ] as const) {
    it(`${navn}: all tekst består AA (4,5:1)`, () => {
      for (const [fg, bg] of TEKST) {
        const r = contrastRatio(t[fg], t[bg])!;
        expect(r, `${fg} på ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`${navn}: feltkanter består 3:1 mot panel og papir`, () => {
      for (const bg of ["panel", "paper"]) {
        expect(
          contrastRatio(t.field, t[bg])!,
          `field på ${bg}`,
        ).toBeGreaterThanOrEqual(3);
      }
    });
  }
});
