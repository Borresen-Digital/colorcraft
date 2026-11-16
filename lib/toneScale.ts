import { contrastRatio } from "./contrast";
import { hexToOklch, oklchToHex } from "./tones";

/**
 * Tonetrapp 50–950: én farge i elleve trinn, fra nesten hvit til nesten
 * svart, med de samme trinnene som Tailwind og de fleste designsystemer.
 *
 * Trinnene regnes i OKLCH med fast lyshet per trinn, så 500 i to ulike
 * farger ser like lyse ut. Metningen er størst i midten og lavere i endene,
 * der skjermen ikke kan vise sterke farger. Fargen selv settes inn på det
 * trinnet som har nærmest lyshet, så merkefargen står i trappen uendret.
 */

export const TONE_STEPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
export type ToneStepName = (typeof TONE_STEPS)[number];

/** Lysheten (OKLCH L) per trinn. */
const LYSHET: Record<ToneStepName, number> = {
  50: 0.975,
  100: 0.94,
  200: 0.885,
  300: 0.81,
  400: 0.71,
  500: 0.62,
  600: 0.54,
  700: 0.46,
  800: 0.39,
  900: 0.33,
  950: 0.26,
};

/** Andelen av fargens metning per trinn. */
const METNING: Record<ToneStepName, number> = {
  50: 0.15,
  100: 0.3,
  200: 0.55,
  300: 0.8,
  400: 0.95,
  500: 1,
  600: 1,
  700: 0.95,
  800: 0.85,
  900: 0.75,
  950: 0.6,
};

export interface ToneStep {
  step: ToneStepName;
  hex: string;
  /** Fargen selv, uendret. */
  base: boolean;
  /** Hvit eller svart, den som står best på trinnet. */
  text: "#FFFFFF" | "#000000";
}

function tekstPå(hex: string): ToneStep["text"] {
  const hvit = contrastRatio("#FFFFFF", hex) ?? 0;
  const svart = contrastRatio("#000000", hex) ?? 0;
  return hvit >= svart ? "#FFFFFF" : "#000000";
}

/** Tonetrappen for en farge, eller tom liste for en ugyldig farge. */
export function toneScale(hex: string): ToneStep[] {
  const o = hexToOklch(hex);
  if (!o) return [];
  const nærmest = TONE_STEPS.reduce((a, b) =>
    Math.abs(LYSHET[b] - o.l) < Math.abs(LYSHET[a] - o.l) ? b : a,
  );
  // Metningen regnes fra trinnet fargen står på. En lys farge som Mel står
  // på 100, der trappen bare har 30 % metning, så trinnene ellers ville
  // blitt grå. Ganges opp høyst tre ganger, så nesten grå farger forblir grå.
  // Bare for lyse farger: mørke farger har nok metning i trinnene fra før.
  const faktor = nærmest < 500 ? Math.min(3, 1 / METNING[nærmest]) : 1;
  return TONE_STEPS.map((step) => {
    const base = step === nærmest;
    const farge = base
      ? hex.toUpperCase()
      : oklchToHex({
          l: LYSHET[step],
          c: o.c * METNING[step] * faktor,
          h: o.h,
        });
    return { step, hex: farge, base, text: tekstPå(farge) };
  });
}

/** Et navn som kan stå i en CSS-variabel: «Varm rørfarge» blir varm-rorfarge. */
export function cssSlug(label: string): string {
  const s = label
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
  // Bindestreker i endene tas bort uten regex med ankre og gjentakelse.
  let start = 0;
  let slutt = s.length;
  while (start < slutt && s[start] === "-") start++;
  while (slutt > start && s[slutt - 1] === "-") slutt--;
  return s.slice(start, slutt) || "farge";
}

/**
 * Trappen som CSS-variabler. Navnene (--color-navn-500) virker både i vanlig
 * CSS og i `@theme` i Tailwind 4, der de gir klasser som bg-navn-500.
 */
export function toneCss(label: string, skala: ToneStep[]): string {
  const navn = cssSlug(label);
  return skala
    .map((t) => `--color-${navn}-${t.step}: ${t.hex.toLowerCase()};`)
    .join("\n");
}
