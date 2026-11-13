"use client";

import type { ExtendedColorPalette } from "@/data/palettes";
import { contrastRatio, formatRatio } from "@/lib/contrast";
import { textOn } from "@/lib/contrastPairs";
import { localizeRatio } from "@/lib/i18n";
import { LOGO_MIN, surfacesFor, TEXT_MIN, type Surface } from "@/lib/surfaces";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import type { ColorPalette } from "@/types/palette";

interface SurfacesPreviewProps {
  palette: ColorPalette;
  brand?: ExtendedColorPalette["brand"];
}

/** Et enkelt logomerke: en sirkel og navnet, i én farge. */
function LogoMark({ color, name }: { color: string; name: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color }}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle
          cx="14"
          cy="14"
          r="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        />
        <circle cx="14" cy="14" r="4" fill="currentColor" />
      </svg>
      <span className="text-lg font-bold tracking-tight">{name}</span>
    </div>
  );
}

function Badge({
  label,
  ratio,
  min,
  extra,
}: {
  label: string;
  ratio: number;
  min: number;
  extra?: string;
}) {
  const { locale, t } = useI18n();
  const ok = ratio >= min;
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-[11px] font-semibold",
        ok ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad",
      )}
    >
      {label}
      {extra ? ` (${extra})` : ""}: {localizeRatio(formatRatio(ratio), locale)}{" "}
      {ok ? t.surfaces.ok : t.surfaces.fail}
    </span>
  );
}

/**
 * Eget navn fra manualen, ellers «Støttefarge 2», «Logofargen som flate»,
 * eller rollen («Sekundær»).
 */
function surfaceTitle(
  s: Surface,
  t: ReturnType<typeof useI18n>["t"],
  names?: Record<string, string>,
): string {
  if (s.kind === "logo") return t.surfaces.logoSurface;
  if (s.role) return t.roles[s.role];
  return names?.[s.color] || t.surfaces.support(s.index);
}

function SurfaceSection({
  s,
  palette,
  name,
  brand,
}: {
  s: Surface;
  palette: ColorPalette;
  name: string;
  brand?: ExtendedColorPalette["brand"];
}) {
  const { locale, t } = useI18n();
  const f = t.surfaces;
  const tittel = surfaceTitle(s, t, brand?.names);
  // Markert tekst i highlightfargen (aksenten) hvis manualen har en, ellers i
  // logofargen. På selve logofargen markeres det da i negativ.
  const harHighlight = (brand?.highlight?.length ?? 0) > 0;
  const markBg = harHighlight
    ? palette.colors.accent
    : s.kind === "logo"
      ? s.logo
      : palette.colors.primary;
  const markText = textOn(palette, markBg);
  return (
    <section
      className="space-y-3 px-5 py-6 sm:px-8"
      style={{ backgroundColor: s.color, color: s.text }}
      aria-label={`${tittel} ${s.color}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <LogoMark color={s.logo} name={name} />
        <span className="font-mono text-xs opacity-80">
          {tittel} · {s.color}
        </span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
        {f.chapter(s.kind === "logo" ? 9 : s.index)}
      </p>
      <h3 className="text-2xl font-bold sm:text-3xl">{f.heading}</h3>
      <p className="max-w-prose text-sm leading-relaxed">
        {f.body}{" "}
        <mark
          className="rounded px-1"
          style={{ backgroundColor: markBg, color: markText }}
        >
          {f.highlight}
        </mark>{" "}
        {harHighlight ? f.bodyEndHighlight : f.bodyEnd}
      </p>
      {s.tints.length > 0 && (
        <div className="pt-1">
          <p className="mb-1 text-[11px] font-semibold opacity-80">{f.tints}</p>
          <ul className="grid grid-cols-4 gap-1">
            {s.tints.map((tt) => (
              <li
                key={tt.percent}
                className="flex flex-col items-center gap-0.5 rounded px-1 py-1.5 text-[10px]"
                style={{
                  backgroundColor: tt.hex,
                  // Prosenten er tekst og trenger lesbar farge. Logoen vises
                  // som merket ved siden av, i sin egen farge.
                  color:
                    (contrastRatio("#111111", tt.hex) ?? 0) >=
                    (contrastRatio("#FFFFFF", tt.hex) ?? 0)
                      ? "#111111"
                      : "#FFFFFF",
                }}
                aria-label={`${f.tintLabel(tt.percent)} ${tt.hex}: ${f.logo} ${localizeRatio(formatRatio(tt.logoRatio), locale)} ${tt.logoOk ? f.ok : f.fail}`}
              >
                <span
                  aria-hidden="true"
                  className="flex items-center gap-1 font-semibold"
                >
                  <svg width="12" height="12" viewBox="0 0 28 28">
                    <circle
                      cx="14"
                      cy="14"
                      r="11"
                      fill="none"
                      stroke={s.logo}
                      strokeWidth="5"
                    />
                    <circle cx="14" cy="14" r="4" fill={s.logo} />
                  </svg>
                  {f.tintLabel(tt.percent)}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "rounded px-1 font-semibold",
                    tt.logoOk ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad",
                  )}
                >
                  {localizeRatio(formatRatio(tt.logoRatio), locale)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Badge label={f.text} ratio={s.textRatio} min={TEXT_MIN} />
        <Badge
          label={f.logo}
          ratio={s.logoRatio}
          min={LOGO_MIN}
          extra={s.logoInverted ? f.logoInverted : undefined}
        />
      </div>
    </section>
  );
}

/**
 * Fanen «Flater»: støttefargene som heldekkende seksjoner og som infobokser
 * på siden, med logo, overskrift, brødtekst og markert tekst, og kontrasten
 * for tekst og logo på hver flate.
 */
export function SurfacesPreview({ palette, brand }: SurfacesPreviewProps) {
  const { t } = useI18n();
  const f = t.surfaces;
  const flater = surfacesFor(palette, brand);
  const støtte = flater.filter((s) => s.kind === "support");
  const navn = palette.name.replace(/\s+(mørk|dark)$/i, "");

  return (
    <div
      style={{
        backgroundColor: palette.colors.background,
        color: palette.colors.foreground,
      }}
    >
      <p
        className="px-5 py-4 text-sm sm:px-8"
        style={{ color: palette.colors.muted }}
      >
        {brand ? f.intro : f.introNoBrand}
      </p>

      {flater.map((s) => (
        <SurfaceSection
          key={`${s.kind}-${s.index}`}
          s={s}
          palette={palette}
          name={navn}
          brand={brand}
        />
      ))}

      <section className="space-y-3 px-5 py-6 sm:px-8" aria-label={f.infoboxes}>
        <h3 className="text-lg font-semibold">{f.infoboxes}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {støtte.map((s) => (
            <div
              key={s.index}
              className="space-y-2 rounded-lg p-4"
              style={{ backgroundColor: s.color, color: s.text }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {surfaceTitle(s, t, brand?.names)}
              </p>
              <p className="text-sm">{f.infobox}</p>
              <Badge label={f.text} ratio={s.textRatio} min={TEXT_MIN} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
