/**
 * Lys og mørk ramme.
 *
 * Fra start følger rammen systemet. Bryteren i toppen bytter mellom lys og
 * mørk, og valget huskes i nettleseren (localStorage). Det er en
 * bekvemmelighet for den som bruker siden, ikke noe som må overleve: får vi
 * ikke lest det, følger siden systemet.
 */

export type Theme = "light" | "dark";

export const THEME_KEY = "colorcraft-theme";

export function isTheme(v: unknown): v is Theme {
  return v === "light" || v === "dark";
}

/** Det motsatte valget: det bryteren bytter til. */
export function otherTheme(t: Theme): Theme {
  return t === "light" ? "dark" : "light";
}

/** Rammen som vises nå: det lagrede valget, ellers systemets. */
export function currentTheme(lagret: unknown, systemMørk: boolean): Theme {
  if (isTheme(lagret)) return lagret;
  return systemMørk ? "dark" : "light";
}

/** Setter data-theme på <html>. */
export function applyTheme(t: Theme): void {
  document.documentElement.setAttribute("data-theme", t);
}

/**
 * Kjøres i <head> før første tegning. Holdes kort og uten avhengigheter, og
 * tåler at localStorage er sperret.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
