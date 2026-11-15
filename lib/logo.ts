import { contrastRatio } from "@/lib/contrast";

/**
 * Logoen kunden har i profilmanualen, i tre versjoner. Bildene lastes bare inn
 * i nettleseren (som blob-adresser) og forsvinner når siden lukkes. De lagres
 * ikke. Bare profilsiden kan legge fargeversjonen i lenken (lib/logoLink.ts).
 */
export type LogoVariant = "color" | "black" | "white";
export const LOGO_VARIANTS: LogoVariant[] = ["color", "black", "white"];
export type UploadedLogos = Partial<Record<LogoVariant, string>>;

export const LOGO_TYPES = [
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
const LOGO_EXT = /\.(svg|png|jpe?g|webp)$/i;
/** Store nok til en logo i høy oppløsning, men ikke et helt trykkoriginal. */
export const LOGO_MAX_BYTES = 5 * 1024 * 1024;

export type LogoFileError = "type" | "size";

/** Sjekker en fil før den vises. Noen systemer gir SVG uten MIME-type. */
export function checkLogoFile(file: {
  name: string;
  type: string;
  size: number;
}): LogoFileError | null {
  const typeOk = file.type
    ? (LOGO_TYPES as readonly string[]).includes(file.type)
    : LOGO_EXT.test(file.name);
  if (!typeOk) return "type";
  if (file.size > LOGO_MAX_BYTES) return "size";
  return null;
}

/** Versjonen i én farge (sort eller hvit) som står best på flaten. */
export function monoFor(bg: string): "black" | "white" {
  return (contrastRatio("#FFFFFF", bg) ?? 0) >=
    (contrastRatio("#000000", bg) ?? 0)
    ? "white"
    : "black";
}

/**
 * Hvilken opplastet versjon som skal stå på en flate, slik en designer ville
 * valgt: fargeversjonen der logoen står i logofargen, ellers sort eller hvit
 * etter hva flaten tåler. Mangler versjonen, brukes den nest beste.
 */
export function pickVariant(
  available: Partial<Record<LogoVariant, unknown>>,
  bg: string,
  wantColor: boolean,
): LogoVariant | null {
  const mono = monoFor(bg);
  const annen = mono === "white" ? "black" : "white";
  const rekkefølge: LogoVariant[] = wantColor
    ? ["color", mono, annen]
    : [mono, "color", annen];
  return rekkefølge.find((v) => available[v]) ?? null;
}

export function pickLogo(
  logos: UploadedLogos,
  bg: string,
  wantColor: boolean,
): { src: string; variant: LogoVariant } | null {
  const v = pickVariant(logos, bg, wantColor);
  return v ? { src: logos[v]!, variant: v } : null;
}

/**
 * Forholdet mellom bredde og høyde for hver opplastet versjon. Fargekortet
 * trenger bare dette for å plassere logoen. Selve bildet legges inn når
 * kortet tegnes.
 */
export type LogoSizes = Partial<Record<LogoVariant, { aspect: number }>>;
