import { describe, expect, it } from "vitest";
import {
  cleanTitle,
  isProfileId,
  isSlug,
  MAX_HASH,
  randomId,
  readSaved,
  shortPath,
  SLUG_LENGTH,
  validProfileHash,
  withoutSaved,
  withSaved,
} from "./savedProfiles";
import { withMaker } from "./profile";

describe("lagrede profiler", () => {
  it("lager tilfeldige id-er og slugs som ikke kan gjettes", () => {
    const sett = new Set(
      Array.from({ length: 500 }, () => randomId(SLUG_LENGTH)),
    );
    expect(sett.size).toBe(500);
    for (const s of sett) expect(isSlug(s)).toBe(true);
    expect(isProfileId(randomId(16))).toBe(true);
    expect(isSlug("abc")).toBe(false);
    expect(isSlug("../../etc/p")).toBe(false);
    expect(isProfileId("x".repeat(16) + "'")).toBe(false);
  });

  it("godtar bare fragmenter som gir en palett", () => {
    const h = withMaker("p=havet", "Test");
    expect(validProfileHash(h)).toBe(h);
    expect(validProfileHash(`#${h}`)).toBe(h);
    expect(validProfileHash("tull=1")).toBeNull();
    expect(validProfileHash("")).toBeNull();
    expect(validProfileHash(42)).toBeNull();
    expect(validProfileHash(`p=havet&x=${"a".repeat(MAX_HASH)}`)).toBeNull();
  });

  it("lagrer aldri sid i profilen", () => {
    const med = withSaved("p=havet", "A".repeat(16));
    expect(readSaved(med)).toBe("A".repeat(16));
    expect(withoutSaved(med)).toBe("p=havet");
    expect(validProfileHash(med)).toBe("p=havet");
    expect(readSaved("p=havet&sid=kort")).toBeNull();
  });

  it("renser tittel og lager korte stier", () => {
    expect(cleanTitle(" Erling\u0000 Olsen\n ")).toBe("Erling Olsen");
    expect(cleanTitle(5)).toBe("");
    expect(cleanTitle("x".repeat(100))).toHaveLength(60);
    expect(shortPath("abcDEF1234", "nb")).toBe("/p/abcDEF1234");
    expect(shortPath("abcDEF1234", "en")).toBe("/en/p/abcDEF1234");
  });
});
