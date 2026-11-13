"use client";

import { useId, useState } from "react";
import { checkManual } from "@/lib/manualCheck";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";

/**
 * «Sjekk verdiene fra manualen»: HEX, RGB og CMYK for én farge inn, og svar
 * på om de henger sammen. Fanger skrivefeil som RGB 144 153 64 for #9099A3.
 */
export function ManualCheck() {
  const { t } = useI18n();
  const k = t.brand.check;
  const id = useId();
  const [hex, setHex] = useState("");
  const [rgb, setRgb] = useState("");
  const [cmyk, setCmyk] = useState("");
  const r = checkManual({ hex, rgb, cmyk });
  const fylt = [hex, rgb, cmyk].filter((s) => s.trim()).length;

  const linjer: { ok: boolean; text: string; swatch?: string }[] = [];
  if (r.rgbMatchesHex === true) linjer.push({ ok: true, text: k.rgbOk });
  if (r.rgbMatchesHex === false)
    linjer.push({
      ok: false,
      text: k.rgbMismatch(r.rgbHex!, r.hex!),
      swatch: r.rgbHex!,
    });
  if (r.cmyk) {
    const tekst =
      r.cmyk.verdict === "like"
        ? k.cmykLike
        : r.cmyk.verdict === "nær"
          ? k.cmykNear
          : k.cmykOff;
    linjer.push({
      ok: r.cmyk.verdict !== "avvik",
      text: tekst(r.cmykHex!),
      swatch: r.cmykHex!,
    });
  }

  const felt = (
    navn: "hex" | "rgb" | "cmyk",
    label: string,
    value: string,
    sett: (v: string) => void,
    placeholder: string,
  ) => (
    <div className="min-w-0">
      <label
        htmlFor={`${id}-${navn}`}
        className="mb-0.5 block text-xs font-medium text-subtle"
      >
        {label}
      </label>
      <input
        id={`${id}-${navn}`}
        type="text"
        value={value}
        onChange={(e) => sett(e.target.value)}
        placeholder={placeholder}
        aria-invalid={r.invalid.includes(navn)}
        className="w-full rounded border border-field bg-panel px-2 py-1 font-mono text-xs text-ink placeholder:text-subtle focus:border-accent focus:outline-none aria-[invalid=true]:border-bad"
      />
    </div>
  );

  return (
    <details className="rounded-lg border border-line p-3">
      <summary className="cursor-pointer text-sm font-semibold text-ink">
        {k.title}
      </summary>
      <div className="mt-2 space-y-2">
        <p className="text-xs text-subtle">{k.help}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {felt("hex", "HEX", hex, setHex, "#RRGGBB")}
          {felt("rgb", "RGB", rgb, setRgb, "R G B")}
          {felt("cmyk", "CMYK", cmyk, setCmyk, "C M Y K")}
        </div>
        <div role="status" aria-live="polite" className="space-y-1 text-xs">
          {r.invalid.length > 0 && (
            <p className="text-bad">
              {k.invalid}: {r.invalid.map((f) => f.toUpperCase()).join(", ")}
            </p>
          )}
          {fylt < 2 && r.invalid.length === 0 && (
            <p className="text-subtle">{k.empty}</p>
          )}
          {linjer.map((l) => (
            <p
              key={l.text}
              className={cn(
                "flex items-center gap-2",
                l.ok ? "text-ok" : "text-bad",
              )}
            >
              {l.swatch && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 rounded border border-line"
                  style={{ backgroundColor: l.swatch }}
                />
              )}
              {l.text}
            </p>
          ))}
        </div>
      </div>
    </details>
  );
}
