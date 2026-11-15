"use client";

import { useEffect, useState } from "react";
import { useLogos } from "@/components/BrandLogo";
import { useI18n } from "@/components/I18nProvider";
import {
  extractColors,
  suggestLogoColors,
  type LogoColor,
} from "@/lib/logoColors";
import { cn } from "@/lib/utils";

export type LogoColorTarget = "logo" | "support" | "highlight";

/** Leser pikslene i et bilde, nedskalert så store logoer går raskt. */
async function lesFarger(src: string): Promise<LogoColor[]> {
  const bilde = new Image();
  bilde.src = src;
  await bilde.decode();
  const nw = bilde.naturalWidth || 300;
  const nh = bilde.naturalHeight || 100;
  const skala = Math.min(1, 400 / Math.max(nw, nh));
  const lerret = document.createElement("canvas");
  lerret.width = Math.max(1, Math.round(nw * skala));
  lerret.height = Math.max(1, Math.round(nh * skala));
  const ctx = lerret.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bilde, 0, 0, lerret.width, lerret.height);
  return extractColors(
    ctx.getImageData(0, 0, lerret.width, lerret.height).data,
  );
}

/**
 * «Farger fra logoen» i «Fra profilmanual»: fargene i logoen som er lastet
 * opp (eller lastes opp her), med knapper som legger dem i listene. Bildet
 * leses bare i nettleseren.
 */
export function LogoColors({
  onUseAsLogo,
  onAdd,
  has,
  full,
}: {
  onUseAsLogo: (hexes: string[]) => void;
  onAdd: (target: LogoColorTarget, hex: string) => void;
  /** Om fargen allerede står i denne listen. */
  has: (hex: string, target: LogoColorTarget) => boolean;
  full: (target: LogoColorTarget) => boolean;
}) {
  const { logos, set } = useLogos();
  const { t } = useI18n();
  const l = t.logoColors;
  const src = logos.color ?? logos.black ?? logos.white;
  const [farger, setFarger] = useState<LogoColor[] | null>(null);
  const [lest, setLest] = useState<string | undefined>(undefined);
  const [feil, setFeil] = useState<string | null>(null);

  // Nullstill når logoen byttes, før den nye er lest.
  if (lest !== src) {
    setLest(src);
    setFarger(null);
  }

  useEffect(() => {
    if (!src) return;
    let aktiv = true;
    lesFarger(src)
      .then((f) => aktiv && setFarger(f))
      .catch(() => aktiv && setFarger([]));
    return () => {
      aktiv = false;
    };
  }, [src]);

  const mål: [LogoColorTarget, string][] = [
    ["logo", l.asLogo],
    ["support", l.asSupport],
    ["highlight", l.asHighlight],
  ];

  return (
    <section
      aria-labelledby="logo-colors-title"
      className="space-y-2 rounded-lg border border-line p-3"
    >
      <h3 id="logo-colors-title" className="text-sm font-semibold text-ink">
        {l.title}
      </h3>
      <p className="text-xs text-subtle">{src ? l.help : l.helpNoLogo}</p>

      {!src && (
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink focus-within:ring-2 focus-within:ring-signal hover:bg-sunken">
          <input
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg"
            className="sr-only"
            onChange={(e) => {
              const fil = e.target.files?.[0];
              e.target.value = "";
              if (!fil) return;
              const f = set("color", fil);
              setFeil(
                f ? (f === "type" ? t.logo.errorType : t.logo.errorSize) : null,
              );
            }}
          />
          {l.upload}
        </label>
      )}
      {feil && (
        <p role="alert" className="text-xs font-medium text-bad">
          {feil}
        </p>
      )}

      {src && farger === null && (
        <p className="text-xs text-subtle" role="status">
          {l.reading}
        </p>
      )}
      {src && farger?.length === 0 && (
        <p className="text-xs text-subtle">{l.none}</p>
      )}

      {farger && farger.length > 0 && (
        <>
          <ul className="grid gap-2 sm:grid-cols-2">
            {farger.map((c) => (
              <li
                key={c.hex}
                className="flex items-center gap-2 rounded-lg border border-line p-2"
              >
                <span
                  className="h-9 w-9 shrink-0 rounded border border-line"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-ink">
                    {c.hex}
                    <span className="ml-1.5 font-sans text-subtle">
                      {l.share(Math.round(c.share * 100))}
                      {c.neutral ? ` · ${l.neutral}` : ""}
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {mål.map(([m, label]) => {
                      const av = has(c.hex, m) || full(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          disabled={av}
                          onClick={() => onAdd(m, c.hex)}
                          aria-label={l.addLabel(label, c.hex)}
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            av
                              ? "border-line text-subtle opacity-50"
                              : "border-line text-ink hover:border-ink",
                          )}
                        >
                          + {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onUseAsLogo(suggestLogoColors(farger))}
              className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-ink/85"
            >
              {l.useAsLogo}
            </button>
            <p className="text-[11px] text-subtle">{l.note}</p>
          </div>
        </>
      )}
    </section>
  );
}
