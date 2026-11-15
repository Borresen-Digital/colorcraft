/**
 * Typografien på profilsiden: fontene i profilen, med rolle, vekt, størrelse,
 * reservefont og en merknad.
 *
 * Som resten av profilen ligger typografien i lenken, én font per parameter:
 *
 *   ty1=Overskrifter|Montserrat|700|32–48 pt|Arial|Bare i store titler
 *
 * Feltene er skilt med |, så | tas ut av teksten. Parameterne starter ikke
 * med «b», så de ikke blir en del av palettens id.
 *
 * Fonter lastes ikke ned fra noe sted (CSP: font-src 'self'). Prøven vises
 * med fonten hvis den er installert på maskinen, ellers med reservefonten.
 */

export const TYPE_PARAMS = ["ty1", "ty2", "ty3", "ty4"] as const;
export const MAX_TYPES = TYPE_PARAMS.length;
export const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

const MAX_FONT = 60;
const MAX_FIELD = 60;
const MAX_NOTE = 160;

export interface TypeSpec {
  /** Hva fonten brukes til, for eksempel «Overskrifter». */
  role: string;
  font: string;
  weight: number;
  /** Fri tekst, for eksempel «32–48 pt». */
  size: string;
  /** Fonten som brukes der fonten mangler, for eksempel Arial i Office. */
  fallback: string;
  note: string;
}

/**
 * Et fontnavn som kan stå trygt i CSS: bokstaver, tall, mellomrom, punktum,
 * bindestrek og understrek.
 */
export function cleanFont(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/[^\p{L}\p{N} ._-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_FONT);
}

function cleanField(s: string | null | undefined, max: number): string {
  return (s ?? "")
    .replace(/[\u0000-\u001f\u007f|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Nærmeste gyldige vekt, 400 hvis tallet ikke er et tall. */
export function cleanWeight(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 400;
  return WEIGHTS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
}

export function cleanType(t: Partial<TypeSpec>): TypeSpec {
  return {
    role: cleanField(t.role, MAX_FIELD),
    font: cleanFont(t.font),
    weight: cleanWeight(t.weight),
    size: cleanField(t.size, MAX_FIELD),
    fallback: cleanFont(t.fallback),
    note: cleanField(t.note, MAX_NOTE),
  };
}

export function encodeType(t: TypeSpec): string {
  const c = cleanType(t);
  const felt = [c.role, c.font, String(c.weight), c.size, c.fallback, c.note];
  // Tomme felt i slutten tas ikke med, så lenken blir kortere.
  while (felt.length > 3 && !felt[felt.length - 1]) felt.pop();
  return felt.join("|");
}

/** En font fra lenken, eller null uten fontnavn. */
export function decodeType(s: string | null): TypeSpec | null {
  if (!s) return null;
  const [role, font, weight, size, fallback, note] = s.split("|");
  const t = cleanType({
    role,
    font,
    weight: Number(weight),
    size,
    fallback,
    note,
  });
  return t.font ? t : null;
}

export function readTypography(hash: string): TypeSpec[] {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  return TYPE_PARAMS.map((p) => decodeType(q.get(p))).filter(
    (t): t is TypeSpec => t !== null,
  );
}

/**
 * Fragmentet med typografien satt. Fonter uten navn tas ikke med, og listen
 * får ikke hull.
 */
export function withTypography(hash: string, liste: TypeSpec[]): string {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  for (const p of TYPE_PARAMS) q.delete(p);
  liste
    .map(cleanType)
    .filter((t) => t.font)
    .slice(0, MAX_TYPES)
    .forEach((t, i) => q.set(TYPE_PARAMS[i], encodeType(t)));
  return q.toString().replace(/\+/g, "%20");
}

export function withoutTypography(hash: string): string {
  return withTypography(hash, []);
}

/** font-family for prøven: fonten, reservefonten og sans-serif til slutt. */
export function fontStack(t: Pick<TypeSpec, "font" | "fallback">): string {
  return [cleanFont(t.font), cleanFont(t.fallback)]
    .filter(Boolean)
    .map((f) => `"${f}"`)
    .concat("sans-serif")
    .join(", ");
}
