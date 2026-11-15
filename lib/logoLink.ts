/**
 * Logoen i lenken til profilsiden.
 *
 * Det finnes ingen database, så logoen må ligge i selve lenken, som resten
 * av profilen. Bildet komprimeres (deflate) og skrives som base64url i
 * fragmentet:
 *
 *   lg=<type><data>   type: s = SVG, w = WebP, p = PNG
 *
 * Fragmentet sendes aldri til serveren. Lenken blir likevel lengre, så det
 * er en grense: en logo som ikke kan bli liten nok, legges ikke i lenken.
 * Profilsiden gjør bildefiler om til en liten WebP eller PNG før de legges
 * inn. SVG legges inn som den er, uten kommentarer og ekstra mellomrom.
 *
 * Bildet vises bare som <img>, så skript i en SVG kjører ikke.
 */

export const LOGO_PARAM = "lg";

/** Lengste logo i lenken, i tegn. Rundt 12 kB etter komprimering. */
export const MAX_LOGO_CHARS = 16_000;

/** Største bilde vi pakker ut, så en lenke ikke kan fylle minnet. */
export const MAX_LOGO_UNPACKED = 512 * 1024;

const TYPER = {
  s: "image/svg+xml",
  w: "image/webp",
  p: "image/png",
} as const;
type Kode = keyof typeof TYPER;

function kodeFor(mime: string): Kode | null {
  const funnet = (Object.keys(TYPER) as Kode[]).find((k) => TYPER[k] === mime);
  return funnet ?? null;
}

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const ut = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) ut[i] = bin.charCodeAt(i);
    return ut;
  } catch {
    return null;
  }
}

async function strøm(
  data: Uint8Array,
  stream: CompressionStream | DecompressionStream,
  maks = Infinity,
): Promise<Uint8Array | null> {
  const leser = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(stream)
    .getReader();
  const biter: Uint8Array[] = [];
  let lengde = 0;
  for (;;) {
    const { done, value } = await leser.read();
    if (done) break;
    lengde += value.length;
    if (lengde > maks) {
      await leser.cancel();
      return null;
    }
    biter.push(value);
  }
  const ut = new Uint8Array(lengde);
  let i = 0;
  for (const b of biter) {
    ut.set(b, i);
    i += b.length;
  }
  return ut;
}

/**
 * Fjerner det en nettleser ikke trenger for å vise en SVG, så lenken blir
 * kortere. Dette er ikke rensing: sikkerheten kommer av at logoen bare vises
 * som <img>. Fjerningen gjentas til teksten står stille, så en kommentar som
 * dukker opp når en annen fjernes («<!<!---->--»), også blir borte.
 */
export function minifySvg(svg: string): string {
  let forrige: string;
  let s = svg;
  do {
    forrige = s;
    s = s
      .replace(/<\?xml[\s\S]*?\?>/g, "")
      .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
  } while (s !== forrige);
  return s
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Logoen som verdien til `lg`, eller null hvis typen ikke støttes eller den
 * blir for lang. SVG minifiseres først.
 */
export async function encodeLogo(
  data: Uint8Array,
  mime: string,
): Promise<string | null> {
  const kode = kodeFor(mime);
  if (!kode) return null;
  const bytes =
    kode === "s"
      ? new TextEncoder().encode(minifySvg(new TextDecoder().decode(data)))
      : data;
  const pakket = await strøm(bytes, new CompressionStream("deflate-raw"));
  if (!pakket) return null;
  const verdi = kode + toBase64Url(pakket);
  return verdi.length <= MAX_LOGO_CHARS ? verdi : null;
}

/** Logoen fra `lg`, eller null hvis verdien er ødelagt eller for stor. */
export async function decodeLogo(
  verdi: string | null,
): Promise<{ bytes: Uint8Array; mime: string } | null> {
  if (!verdi || verdi.length > MAX_LOGO_CHARS + 1) return null;
  const kode = verdi[0] as Kode;
  if (!(kode in TYPER)) return null;
  const pakket = fromBase64Url(verdi.slice(1));
  if (!pakket || pakket.length === 0) return null;
  try {
    const bytes = await strøm(
      pakket,
      new DecompressionStream("deflate-raw"),
      MAX_LOGO_UNPACKED,
    );
    return bytes ? { bytes, mime: TYPER[kode] } : null;
  } catch {
    return null;
  }
}

/** Fragmentet med logoen satt, eller fjernet når verdien er tom. */
export function withLogo(hash: string, verdi: string | null): string {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  if (verdi) q.set(LOGO_PARAM, verdi);
  else q.delete(LOGO_PARAM);
  return q.toString().replace(/\+/g, "%20");
}

export function readLogoParam(hash: string): string | null {
  return new URLSearchParams(hash.replace(/^#/, "")).get(LOGO_PARAM);
}
