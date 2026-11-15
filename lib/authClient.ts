"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

/** Klienten mot /api/auth på samme domene. */
export const authClient = createAuthClient({
  plugins: [magicLinkClient(), passkeyClient()],
});

export interface KontoStatus {
  enabled: boolean;
  turnstileSiteKey: string | null;
}

/** Om kontoene er slått på. Feil regnes som av. */
export async function hentKontoStatus(): Promise<KontoStatus> {
  try {
    const r = await fetch("/api/konto/status", { cache: "no-store" });
    if (!r.ok) return { enabled: false, turnstileSiteKey: null };
    return (await r.json()) as KontoStatus;
  } catch {
    return { enabled: false, turnstileSiteKey: null };
  }
}
