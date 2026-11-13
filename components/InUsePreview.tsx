"use client";

import type { ReactNode } from "react";
import type { ExtendedColorPalette } from "@/data/palettes";
import { formatRatio } from "@/lib/contrast";
import { localizeRatio } from "@/lib/i18n";
import { inUseColors, type InUseColors } from "@/lib/inUse";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import type { ColorPalette } from "@/types/palette";

/** Logomerket fra Flater, i én farge og valgfri størrelse. */
function Logo({
  color,
  name,
  size = "md",
}: {
  color: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const px = { sm: 14, md: 20, lg: 26 }[size];
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 font-bold tracking-tight",
        size === "sm" && "text-[10px]",
        size === "md" && "text-sm",
        size === "lg" && "text-lg",
      )}
      style={{ color }}
    >
      <svg width={px} height={px} viewBox="0 0 28 28" aria-hidden="true">
        <circle
          cx="14"
          cy="14"
          r="11"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        />
        <circle cx="14" cy="14" r="4" fill="currentColor" />
      </svg>
      <span className="min-w-0 truncate">{name}</span>
    </div>
  );
}

/** Et nøytralt bildefelt: en svak overgang mellom stripen og hovedflaten. */
function Bilde({ c, label }: { c: InUseColors; label: string }) {
  return (
    <div
      className="flex flex-1 items-center justify-center text-[10px] font-medium uppercase tracking-widest"
      style={{
        background: `linear-gradient(135deg, ${c.band}55, ${c.hero}22), repeating-linear-gradient(45deg, #00000008 0 6px, #ffffff10 6px 12px), #8a8f96`,
        color: "#FFFFFFCC",
      }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

function Mockup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-1 items-end justify-center">{children}</div>
      <figcaption className="text-center text-xs font-medium opacity-80">
        {title}
      </figcaption>
    </figure>
  );
}

/**
 * Fanen «I bruk»: paletten på trykksaker og en presentasjon, slik en
 * designer viser kunden hvordan profilen tar seg ut. Rollup, displayannonse,
 * visittkort og lysbilde, med kontrasten for teksten og logoen på hver flate.
 */
export function InUsePreview({
  palette,
  brand,
}: {
  palette: ColorPalette;
  brand?: ExtendedColorPalette["brand"];
}) {
  const { locale, t } = useI18n();
  const k = t.inUse;
  const c = inUseColors(palette, brand);
  const navn = palette.name.replace(/\s+(mørk|dark)$/i, "");
  const bg = palette.colors.background;
  const fg = palette.colors.foreground;

  return (
    <div
      className="space-y-6 p-4 sm:p-6"
      style={{ backgroundColor: bg, color: fg }}
    >
      <p className="text-sm" style={{ color: palette.colors.muted }}>
        {brand ? k.intro : k.introNoBrand}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
        {/* Rollup: hovedflaten, bilde og stripe med tjenester. */}
        <Mockup title={k.rollup}>
          <div
            className="flex aspect-[1/2.4] w-full max-w-36 flex-col overflow-hidden rounded-sm shadow-md"
            style={{ backgroundColor: c.hero, color: c.heroText }}
            aria-hidden="true"
          >
            <div className="space-y-2 p-3">
              <Logo color={c.heroText} name={navn} size="sm" />
              <p className="pt-2 text-sm font-bold leading-tight">
                {k.headline}
              </p>
              <p className="text-[9px] leading-snug opacity-90">{k.body}</p>
            </div>
            <Bilde c={c} label={k.image} />
            <div
              className="px-2 py-1.5 text-center text-[8px] font-semibold"
              style={{ backgroundColor: c.band, color: c.bandText }}
            >
              {k.services}
            </div>
            <p className="py-2 text-center text-[9px] font-semibold">{k.url}</p>
          </div>
        </Mockup>

        {/* Displayannonse: overskrift, bilde og knapp på hovedflaten. */}
        <Mockup title={k.ad}>
          <div
            className="flex aspect-[1/2] w-full max-w-36 flex-col overflow-hidden rounded-sm shadow-md"
            style={{ backgroundColor: c.hero, color: c.heroText }}
            aria-hidden="true"
          >
            <div className="space-y-1 p-3 text-center">
              <p className="text-base font-bold leading-tight">
                {k.adHeadline}
              </p>
              <p className="text-[10px] opacity-90">{k.adSub}</p>
            </div>
            <Bilde c={c} label={k.image} />
            <div className="flex flex-col items-center gap-3 p-3">
              <span
                className="rounded-full px-4 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: c.button, color: c.buttonText }}
              >
                {k.cta}
              </span>
              <Logo color={c.heroText} name={navn} size="sm" />
            </div>
          </div>
        </Mockup>

        {/* Visittkort: forside i hovedflaten, bakside på papir. */}
        <Mockup title={k.card}>
          <div
            className="flex w-full max-w-44 flex-col gap-2"
            aria-hidden="true"
          >
            <div
              className="flex aspect-[85/55] flex-col items-center justify-center rounded-sm shadow-md"
              style={{ backgroundColor: c.hero }}
            >
              <Logo color={c.heroText} name={navn} />
            </div>
            <div
              className="relative flex aspect-[85/55] flex-col justify-between overflow-hidden rounded-sm p-2.5 shadow-md"
              style={{ backgroundColor: c.paper, color: c.paperText }}
            >
              <Logo color={c.logo} name={navn} size="sm" />
              <div>
                <p className="text-[10px] font-bold">{k.person}</p>
                <p className="text-[8px] opacity-80">{k.role}</p>
                <p className="pt-1 text-[8px]">{k.url}</p>
              </div>
              <span
                className="absolute bottom-0 right-0 top-0 w-1.5"
                style={{ backgroundColor: c.band }}
              />
            </div>
          </div>
        </Mockup>

        {/* Lysbilde: forsiden av en presentasjon, 16:9. */}
        <Mockup title={k.slide}>
          <div
            className="flex aspect-video w-full overflow-hidden rounded-sm shadow-md"
            style={{ backgroundColor: c.paper, color: c.paperText }}
            aria-hidden="true"
          >
            <div className="w-1/3" style={{ backgroundColor: c.hero }}>
              <div className="flex h-full items-end p-2">
                <Logo color={c.heroText} name="" size="sm" />
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 p-3">
              <p className="text-xs font-bold leading-tight">{k.slideTitle}</p>
              <span
                className="h-1 w-8 rounded"
                style={{ backgroundColor: c.band }}
              />
              <p className="text-[8px] opacity-80">{k.slideSub}</p>
            </div>
          </div>
        </Mockup>
      </div>

      <section aria-label={k.checksTitle} className="space-y-2">
        <h3 className="text-sm font-semibold">{k.checksTitle}</h3>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {c.checks.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs"
              style={{
                borderColor: palette.colors.border,
                backgroundColor: palette.colors.surface,
              }}
            >
              <span>{k.checks[s.id]}</span>
              <span
                className={cn(
                  "shrink-0 rounded px-2 py-0.5 font-semibold",
                  s.ok ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad",
                )}
              >
                {localizeRatio(formatRatio(s.ratio), locale)}{" "}
                {s.ok ? t.surfaces.ok : t.surfaces.fail}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
