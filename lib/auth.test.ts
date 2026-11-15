import { describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => {
    throw new Error("ingen kontekst i prøvene");
  },
}));

import { authReady, devAuth, RATE_RULES, type AuthEnv } from "./auth";
import { loginMail } from "./authMail";

const FULL: AuthEnv = {
  DB: {} as AuthEnv["DB"],
  BETTER_AUTH_URL: "https://farger.borresendigital.no",
  AUTH_FROM_EMAIL: "ColorCraft <farger@borresendigital.no>",
  BETTER_AUTH_SECRET: "x".repeat(43),
  RESEND_API_KEY: "re_test",
  TURNSTILE_SITE_KEY: "0x4AAA",
  TURNSTILE_SECRET_KEY: "0x4BBB",
};

describe("kontoene er stengt til alt er satt opp", () => {
  it("er på når alt finnes", () => {
    expect(authReady(FULL)).toBe(true);
  });

  it("er av når noe mangler", () => {
    for (const k of [
      "DB",
      "BETTER_AUTH_URL",
      "AUTH_FROM_EMAIL",
      "BETTER_AUTH_SECRET",
      "RESEND_API_KEY",
      "TURNSTILE_SITE_KEY",
      "TURNSTILE_SECRET_KEY",
    ] as const) {
      expect(authReady({ ...FULL, [k]: undefined }), k).toBe(false);
    }
    expect(authReady({ ...FULL, BETTER_AUTH_SECRET: "kort" })).toBe(false);
  });

  it("testmodus virker bare på localhost", () => {
    const lokal: AuthEnv = {
      DB: FULL.DB,
      BETTER_AUTH_URL: "http://localhost:3200",
      BETTER_AUTH_SECRET: FULL.BETTER_AUTH_SECRET,
      DEV_AUTH: "1",
    };
    expect(devAuth(lokal)).toBe(true);
    expect(authReady(lokal)).toBe(true);
    const prod = { ...lokal, BETTER_AUTH_URL: FULL.BETTER_AUTH_URL };
    expect(devAuth(prod)).toBe(false);
    expect(authReady(prod)).toBe(false);
    expect(
      devAuth({ ...lokal, BETTER_AUTH_URL: "http://localhost.evil.no" }),
    ).toBe(false);
  });

  it("innloggingslenker har streng fartsgrense", () => {
    expect(RATE_RULES["/sign-in/magic-link"].max).toBeLessThanOrEqual(3);
  });
});

describe("e-posten med lenken", () => {
  it("har lenken i tekst og HTML, escapet", () => {
    const url =
      'https://farger.borresendigital.no/api/auth/magic-link/verify?token=a&b="<x>';
    const m = loginMail("nb", url);
    expect(m.subject).toBe("Logg inn i ColorCraft");
    expect(m.text).toContain(url);
    expect(m.html).not.toContain('"<x>');
    expect(m.html).toContain("&amp;b=&quot;&lt;x&gt;");
    expect(loginMail("en", url).subject).toBe("Sign in to ColorCraft");
  });
});
