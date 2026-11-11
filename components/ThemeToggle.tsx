"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  isThemeChoice,
  nextTheme,
  THEME_KEY,
  type ThemeChoice,
} from "@/lib/theme";
import { btn } from "@/lib/ui";
import { useI18n } from "@/components/I18nProvider";

function Ikon({ t }: { t: ThemeChoice }) {
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
  if (t === "dark")
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
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" />
    </svg>
  );
}

/** Bryter for rammen: system → lys → mørk. Valget huskes i nettleseren. */
export function ThemeToggle() {
  const { t } = useI18n();
  const [valg, setValg] = useState<ThemeChoice>("system");

  // Det lagrede valget finnes bare i nettleseren, så det leses etter
  // hydrering. Skriptet i <head> har alt satt data-theme før første tegning.
  useEffect(() => {
    try {
      const lagret = localStorage.getItem(THEME_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isThemeChoice(lagret)) setValg(lagret);
    } catch {
      // Lagring sperret: følg systemet.
    }
  }, []);

  const bytt = () => {
    const neste = nextTheme(valg);
    setValg(neste);
    applyTheme(neste);
    try {
      if (neste === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, neste);
    } catch {
      // Lagring sperret: valget gjelder til siden lastes på nytt.
    }
  };

  const navn = t.app.theme[valg];
  return (
    <button
      type="button"
      onClick={bytt}
      className={btn("ghost", "sm")}
      aria-label={t.app.themeLabel(navn)}
      title={t.app.themeLabel(navn)}
    >
      <Ikon t={valg} />
      <span className="hidden sm:inline">{navn}</span>
    </button>
  );
}
