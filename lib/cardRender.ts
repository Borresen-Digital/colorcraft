import { parseHex } from "./contrast";
import { PAGE, type Op } from "./colorCard";

/**
 * Tegner fargekortet. Begge tegnerne får de samme operasjonene fra
 * `layoutCard`, så PDF og PNG blir like.
 */

/**
 * PDF i vektor (pdf-lib, lastet først når noen trykker). Farger som er
 * skrevet inn i CMYK fra manualen, legges inn som CMYK i PDF-en, så et
 * utskrevet kort bruker manualens egne tall. Resten er RGB.
 *
 * Standardfontene i PDF (Helvetica) kan bare skrive tegnene i WinAnsi. Æ, ø,
 * å og · går fint, men et navn med for eksempel emoji ville fått pdf-lib til
 * å feile. Slike tegn byttes med «?».
 */
export async function renderPdf(ops: Op[], title: string): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb, cmyk } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setCreator("ColorCraft (farger.borresendigital.no)");
  const side = doc.addPage([PAGE.width, PAGE.height]);
  const vanlig = await doc.embedFont(StandardFonts.Helvetica);
  const fet = await doc.embedFont(StandardFonts.HelveticaBold);

  const trygg = (font: typeof vanlig, tekst: string) =>
    [...tekst]
      .map((tegn) => {
        try {
          font.encodeText(tegn);
          return tegn;
        } catch {
          return "?";
        }
      })
      .join("");

  const rgbAv = (hex: string) => {
    const { r, g, b } = parseHex(hex)!;
    return rgb(r / 255, g / 255, b / 255);
  };

  for (const op of ops) {
    if (op.kind === "rect") {
      const farge = !op.fill
        ? undefined
        : op.fill.cmyk
          ? cmyk(
              op.fill.cmyk.c / 100,
              op.fill.cmyk.m / 100,
              op.fill.cmyk.y / 100,
              op.fill.cmyk.k / 100,
            )
          : rgbAv(op.fill.hex);
      side.drawRectangle({
        x: op.x,
        // PDF måler fra bunnen, oppsettet fra toppen.
        y: PAGE.height - op.y - op.h,
        width: op.w,
        height: op.h,
        color: farge,
        ...(op.stroke && { borderColor: rgbAv(op.stroke), borderWidth: 0.75 }),
      });
    } else {
      const font = op.bold ? fet : vanlig;
      side.drawText(trygg(font, op.text), {
        x: op.x,
        y: PAGE.height - op.y,
        size: op.size,
        font,
        color: rgbAv(op.color),
      });
    }
  }
  return doc.save();
}

/** PNG i dobbel oppløsning (A4 i 144 dpi), tegnet på et lerret. */
export async function renderPng(ops: Op[]): Promise<Blob> {
  const skala = 2;
  const lerret = document.createElement("canvas");
  lerret.width = Math.round(PAGE.width * skala);
  lerret.height = Math.round(PAGE.height * skala);
  const ctx = lerret.getContext("2d");
  if (!ctx) throw new Error("Canvas er ikke tilgjengelig.");
  ctx.scale(skala, skala);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, PAGE.width, PAGE.height);
  ctx.textBaseline = "alphabetic";

  for (const op of ops) {
    if (op.kind === "rect") {
      if (op.fill) {
        ctx.fillStyle = op.fill.hex;
        ctx.fillRect(op.x, op.y, op.w, op.h);
      }
      if (op.stroke) {
        ctx.strokeStyle = op.stroke;
        ctx.lineWidth = 0.75;
        ctx.strokeRect(op.x, op.y, op.w, op.h);
      }
    } else {
      ctx.fillStyle = op.color;
      ctx.font = `${op.bold ? "bold " : ""}${op.size}px Helvetica, Arial, sans-serif`;
      ctx.fillText(op.text, op.x, op.y);
    }
  }

  return new Promise((resolve, reject) =>
    lerret.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Kunne ikke lage PNG."))),
      "image/png",
    ),
  );
}
