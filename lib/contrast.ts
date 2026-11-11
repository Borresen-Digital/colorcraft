/**
 * Kontrast etter WCAG 2.2 (suksesskriteriene 1.4.3 og 1.4.6).
 *
 * Formlene er de samme som i WCAG 2.1: relativ luminans fra sRGB, og
 * forholdet (L1 + 0.05) / (L2 + 0.05). Grensene:
 *
 *   - Vanlig tekst: AA 4.5:1, AAA 7:1
 *   - Stor tekst (minst 24px, eller 18.66px fet): AA 3:1, AAA 4.5:1
 *
 * Alt her er rene funksjoner uten DOM, så de kan prøves for seg.
 */

export type Rgb = { r: number; g: number; b: number };

export type ContrastLevel = "AAA" | "AA" | "fail";

export const THRESHOLDS = {
  normal: { AA: 4.5, AAA: 7 },
  large: { AA: 3, AAA: 4.5 },
} as const;

/** Leser #RGB eller #RRGGBB (med eller uten #). Gir null for alt annet. */
export function parseHex(hex: string): Rgb | null {
  const s = hex.trim().replace(/^#/, "");
  const full =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const h = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

/** Relativ luminans, 0 for svart og 1 for hvitt. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const kanal = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
}

/** Kontrastforholdet mellom to farger, fra 1 til 21. Null hvis en er ugyldig. */
export function contrastRatio(a: string, b: string): number | null {
  const ra = parseHex(a);
  const rb = parseHex(b);
  if (!ra || !rb) return null;
  const la = relativeLuminance(ra);
  const lb = relativeLuminance(rb);
  const [lys, mork] = la > lb ? [la, lb] : [lb, la];
  return (lys + 0.05) / (mork + 0.05);
}

export function contrastLevel(ratio: number, large = false): ContrastLevel {
  const t = large ? THRESHOLDS.large : THRESHOLDS.normal;
  if (ratio >= t.AAA) return "AAA";
  if (ratio >= t.AA) return "AA";
  return "fail";
}

/** Viser forholdet som WCAG-verktøy gjør: rundet ned, så 4.499 aldri blir 4.5. */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}

export type Hsl = { h: number; s: number; l: number };

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h / 6, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const kanal = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return {
    r: kanal(h + 1 / 3) * 255,
    g: kanal(h) * 255,
    b: kanal(h - 1 / 3) * 255,
  };
}

/**
 * Nærmeste farge som når `target` mot `fixed`, ved å bare endre lysheten på
 * `adjust`. Fargetone og metning beholdes, så forslaget ser ut som samme
 * farge, bare lysere eller mørkere.
 *
 * Kontrasten vokser jevnt når lysheten flyttes bort fra den faste fargen, så
 * hver retning kan binærsøkes. Begge retninger prøves, og den som trenger
 * minst endring vinner. Gir null hvis fargen allerede består, eller hvis ingen
 * lyshet når målet (for eksempel 7:1 mot en mellomgrå).
 */
export function suggestPassingColor(
  adjust: string,
  fixed: string,
  target: number,
): string | null {
  const start = parseHex(adjust);
  if (!start || !parseHex(fixed)) return null;
  const naa = contrastRatio(adjust, fixed);
  if (naa !== null && naa >= target) return null;

  const hsl = rgbToHsl(start);
  const kandidat = (l: number) => toHex(hslToRgb({ ...hsl, l }));
  const naar = (l: number) =>
    (contrastRatio(kandidat(l), fixed) ?? 0) >= target;

  const sok = (ytterst: number): { l: number; hex: string } | null => {
    if (!naar(ytterst)) return null;
    // Invariant: `inne` når ikke målet, `ute` gjør det.
    let inne = hsl.l;
    let ute = ytterst;
    for (let i = 0; i < 24; i++) {
      const midt = (inne + ute) / 2;
      if (naar(midt)) ute = midt;
      else inne = midt;
    }
    const hex = kandidat(ute);
    // Avrunding til hele RGB-verdier kan dytte forholdet under målet. Da går
    // vi ett hakk lenger ut.
    if ((contrastRatio(hex, fixed) ?? 0) >= target) return { l: ute, hex };
    const steg = ytterst > hsl.l ? 0.004 : -0.004;
    for (let l = ute; ytterst > hsl.l ? l <= 1 : l >= 0; l += steg) {
      const h = kandidat(l);
      if ((contrastRatio(h, fixed) ?? 0) >= target) return { l, hex: h };
    }
    return null;
  };

  const morkere = sok(0);
  const lysere = sok(1);
  if (!morkere) return lysere?.hex ?? null;
  if (!lysere) return morkere.hex;
  return Math.abs(morkere.l - hsl.l) <= Math.abs(lysere.l - hsl.l)
    ? morkere.hex
    : lysere.hex;
}
