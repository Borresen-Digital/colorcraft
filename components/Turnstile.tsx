"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      language?: string;
      theme?: "light" | "dark" | "auto";
    },
  ) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SKRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let lasting: Promise<void> | null = null;
function lastTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!lasting) {
    lasting = new Promise((ok, feil) => {
      const s = document.createElement("script");
      s.src = SKRIPT;
      s.async = true;
      s.onload = () => ok();
      s.onerror = () => {
        lasting = null;
        feil(new Error("Turnstile lastet ikke"));
      };
      document.head.appendChild(s);
    });
  }
  return lasting;
}

/** Så lenge uten svar før vi forklarer hva som kan stoppe boksen. */
const TREG_MS = 10_000;

/**
 * Cloudflare Turnstile: sjekker at det er et menneske før en
 * innloggingslenke sendes, så skjemaet ikke kan brukes til å sende e-post
 * til andre i stort omfang. `nonce` tilbakestiller widgeten (et svar kan
 * bare brukes én gang).
 *
 * Blokkerer nettleseren Cloudflare, står det ellers bare et tomt felt og en
 * grå knapp. Derfor vises en forklaring når skriptet eller widgeten feiler,
 * og et hint når det ikke har kommet noe svar etter en stund.
 */
export function Turnstile({
  siteKey,
  locale,
  onToken,
  nonce,
}: {
  siteKey: string;
  locale: string;
  onToken: (token: string | null) => void;
  nonce: number;
}) {
  const { t } = useI18n();
  const el = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  const [status, setStatus] = useState<"venter" | "ok" | "treg" | "feil">(
    "venter",
  );
  const tilbake = useRef((token: string | null) => {
    onToken(token);
  });
  useEffect(() => {
    tilbake.current = (token) => {
      if (token) setStatus("ok");
      onToken(token);
    };
  }, [onToken]);

  useEffect(() => {
    if (status !== "venter") return;
    const tid = setTimeout(() => setStatus("treg"), TREG_MS);
    return () => clearTimeout(tid);
  }, [status]);

  useEffect(() => {
    let avbrutt = false;
    lastTurnstile()
      .then(() => {
        if (avbrutt || !el.current || !window.turnstile) return;
        id.current = window.turnstile.render(el.current, {
          sitekey: siteKey,
          language: locale === "en" ? "en" : "nb",
          theme: "light",
          callback: (t) => tilbake.current(t),
          "expired-callback": () => tilbake.current(null),
          "error-callback": () => {
            setStatus("feil");
            tilbake.current(null);
          },
        });
      })
      .catch(() => {
        setStatus("feil");
        tilbake.current(null);
      });
    return () => {
      avbrutt = true;
      if (id.current && window.turnstile) window.turnstile.remove(id.current);
      id.current = null;
    };
  }, [siteKey, locale]);

  useEffect(() => {
    if (nonce > 0 && id.current && window.turnstile) {
      window.turnstile.reset(id.current);
      tilbake.current(null);
    }
  }, [nonce]);

  const k = t.account;
  return (
    <div className="space-y-2">
      <div ref={el} className={status === "feil" ? "" : "min-h-[65px]"} />
      {status === "feil" && (
        <div role="alert" className="space-y-2 text-sm font-medium text-bad">
          <p>{k.captchaFailed}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="underline underline-offset-4 hover:text-ink"
          >
            {k.captchaReload}
          </button>
        </div>
      )}
      {status === "treg" && (
        <p role="status" className="text-sm text-subtle">
          {k.captchaSlow}
        </p>
      )}
    </div>
  );
}
