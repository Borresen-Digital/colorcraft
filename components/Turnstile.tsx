"use client";

import { useEffect, useRef } from "react";

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

/**
 * Cloudflare Turnstile: sjekker at det er et menneske før en
 * innloggingslenke sendes, så skjemaet ikke kan brukes til å sende e-post
 * til andre i stort omfang. `nonce` tilbakestiller widgeten (et svar kan
 * bare brukes én gang).
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
  const el = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  const tilbake = useRef(onToken);
  useEffect(() => {
    tilbake.current = onToken;
  }, [onToken]);

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
          "error-callback": () => tilbake.current(null),
        });
      })
      .catch(() => tilbake.current(null));
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

  return <div ref={el} className="min-h-[65px]" />;
}
