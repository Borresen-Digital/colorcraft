import { describe, expect, it } from "vitest";
import { cleanupAuth, shouldCleanup } from "./cleanup";
import type { D1 } from "./savedProfiles";

describe("rydding i kontodatabasen", () => {
  it("sletter utløpte lenker og økter, og gamle fartsgrenser", async () => {
    const kjørt: { sql: string; verdier: unknown[] }[] = [];
    const db = {
      prepare: (sql: string) => {
        const stmt = {
          bind: (...verdier: unknown[]) => {
            kjørt.push({ sql, verdier });
            return stmt;
          },
          run: async () => ({}),
          first: async () => null,
          all: async () => ({ results: [] }),
        };
        return stmt;
      },
    } as unknown as D1;
    const nå = Date.UTC(2026, 10, 16, 12);
    await cleanupAuth(db, nå);
    expect(kjørt.map((k) => k.sql.match(/from "(\w+)"/)?.[1])).toEqual([
      "verification",
      "session",
      "rateLimit",
    ]);
    expect(kjørt[0].verdier).toEqual(["2026-11-16T12:00:00.000Z"]);
    expect(kjørt[2].verdier).toEqual([nå - 86_400_000]);
    expect(kjørt.every((k) => k.sql.startsWith("delete from"))).toBe(true);
  });

  it("rydder bare på en liten andel av kallene", () => {
    expect(shouldCleanup(0.01)).toBe(true);
    expect(shouldCleanup(0.5)).toBe(false);
  });
});
