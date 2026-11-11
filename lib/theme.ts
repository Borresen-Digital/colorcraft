/**
 * Lys og mørk ramme.
 *
 * Standard er systemvalget. Bryteren i toppen kan låse lys eller mørk, og
 * valget huskes i nettleseren (localStorage). Det er en bekvemmelighet for den
 * som bruker siden, ikke noe som må overleve: får vi ikke lest det, følger
 * siden systemet.
 */

export type ThemeChoice = "system" | "light" | "dark";

export const THEME_KEY = "colorcraft-theme";

export const THEME_ORDER: ThemeChoice[] = ["system", "light", "dark"];

export function nextTheme(t: ThemeChoice): ThemeChoice {
  return THEME_ORDER[(THEME_ORDER.indexOf(t) + 1) % THEME_ORDER.length];
}

export function isThemeChoice(v: unknown): v is ThemeChoice {
  return v === "system" || v === "light" || v === "dark";
}

/** Setter eller fjerner data-theme på <html>. */
export function applyTheme(t: ThemeChoice): void {
  const html = document.documentElement;
  if (t === "system") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", t);
}

/**
 * Kjøres i <head> før første tegning. Holdes kort og uten avhengigheter, og
 * tåler at localStorage er sperret.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
