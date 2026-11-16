"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  currentTheme,
  otherTheme,
  THEME_KEY,
  type Theme,
} from "@/lib/theme";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";

function Ikon({ t }: { t: Theme }) {
  if (t === "light")
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      </svg>
    );
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
  );
}

/**
 * Bryter for rammen: lys eller mørk. Fra start følger den systemet, og et
 * trykk bytter til det andre. Valget huskes i nettleseren.
 *
 * `locked`: profilsiden er et dokument på lyst papir, så der står bryteren
 * som «Alltid lys» og kan ikke trykkes.
 */
export function ThemeToggle({ locked = false }: { locked?: boolean }) {
  const { t } = useI18n();
  // null til valget er lest. Det finnes bare i nettleseren.
  const [tema, setTema] = useState<Theme | null>(null);

  useEffect(() => {
    const medie = window.matchMedia("(prefers-color-scheme: dark)");
    const les = () => {
      let lagret: string | null = null;
      try {
        lagret = localStorage.getItem(THEME_KEY);
      } catch {
        // Lagring sperret: følg systemet.
      }
      setTema(currentTheme(lagret, medie.matches));
    };
    les();
    // Uten eget valg følger bryteren systemet også når det endres.
    medie.addEventListener("change", les);
    return () => medie.removeEventListener("change", les);
  }, []);

  if (locked) {
    return (
      <span
        className={cn(btn("ghost", "sm"), "cursor-default opacity-70")}
        title={t.app.themeLockedHelp}
      >
        <Ikon t="light" />
        <span className="hidden sm:inline">{t.app.themeLocked}</span>
      </span>
    );
  }

  const vis = tema ?? "light";
  const bytt = () => {
    const neste = otherTheme(vis);
    setTema(neste);
    applyTheme(neste);
    try {
      localStorage.setItem(THEME_KEY, neste);
    } catch {
      // Lagring sperret: valget gjelder til siden lastes på nytt.
    }
  };

  const navn = t.app.theme[vis];
  return (
    <button
      type="button"
      onClick={bytt}
      className={cn(btn("ghost", "sm"), !tema && "invisible")}
      aria-label={t.app.themeLabel(navn, t.app.theme[otherTheme(vis)])}
      title={t.app.themeLabel(navn, t.app.theme[otherTheme(vis)])}
    >
      <Ikon t={vis} />
      <span className="hidden sm:inline">{navn}</span>
    </button>
  );
}
