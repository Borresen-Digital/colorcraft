import { describe, expect, it } from "vitest";
import {
  cleanPantone,
  PANTONE_PARAM,
  pantoneKey,
  readPantone,
  withoutPantone,
  withPantone,
} from "./pantone";
import { decodeShare } from "./share";
import { readMaker, withMaker } from "./profile";

describe("Pantone i lenken", () => {
  it("går fram og tilbake uten å endre paletten", () => {
    const hash = withMaker("p=havet", "Testdesign");
    const med = withPantone(hash, {
      "#002245": "2945 C",
      c1b694: "7535 C",
    });
    expect(readPantone(med)).toEqual({ "002245": "2945 C", C1B694: "7535 C" });
    expect(decodeShare(med)).toEqual(decodeShare(hash));
    expect(readMaker(med)).toBe("Testdesign");
    expect(withoutPantone(med)).toBe(hash);
  });

  it("tar ikke med tomme numre", () => {
    expect(withPantone("p=havet", { "#002245": "  " })).not.toContain(
      `${PANTONE_PARAM}=`,
    );
  });

  it("renser numre så de ikke kan bryte formatet", () => {
    expect(cleanPantone("2945 C|x~y")).toBe("2945 C x y");
    expect(cleanPantone("Cool Gray 11 C")).toBe("Cool Gray 11 C");
    expect(cleanPantone("P 100-8 U")).toBe("P 100-8 U");
    expect(cleanPantone("x".repeat(50))).toHaveLength(30);
    expect(pantoneKey("#c1b694")).toBe("C1B694");
  });

  it("tåler ødelagte verdier", () => {
    expect(readPantone("pn=tull|ZZZZZZ~1|002245~")).toEqual({});
    expect(readPantone("")).toEqual({});
  });
});
