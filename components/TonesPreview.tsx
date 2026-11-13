"use client";

import { useState } from "react";
import type { ExtendedColorPalette } from "@/data/palettes";
import { contrastRatio } from "@/lib/contrast";
import { COLOR_ROLES } from "@/lib/share";
import { valorScale, variants } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import type { ColorPalette } from "@/types/palette";

type Role = keyof ColorPalette["colors"];
type ApplyFn = (role: Role, color: string) => void;

interface Source {
  key: string;
  label: string;
  color: string;
  /** Rollen et klikk bruker fargen som, til brukeren velger en annen. */
  role: Role;
}

/** Fargene vi viser valører for: merkefargene, eller palettens hovedroller. */
function sourcesFor(
  palette: ColorPalette,
  brand: ExtendedColorPalette["brand"],
  t: ReturnType<typeof useI18n>["t"],
): Source[] {
  if (brand && brand.logo.length > 0) {
    const logoRoller: Role[] = ["primary", "accent", "warm"];
    const navn = brand.names ?? {};
    return [
      ...brand.logo.map((c, i) => ({
        key: `logo-${i}`,
        label: navn[c] || t.tones.logo(i + 1),
        color: c,
        role: logoRoller[i] ?? "accent",
      })),
      ...(brand.highlight ?? []).map((c, i) => ({
        key: `highlight-${i}`,
        label: navn[c] || t.tones.highlight(i + 1),
        color: c,
        role: "accent" as Role,
      })),
      ...brand.support.map((c, i) => ({
        key: `support-${i}`,
        label: navn[c] || t.tones.support(i + 1),
        color: c,
        role: (i === 0 ? "secondary" : "surface") as Role,
      })),
    ];
  }
  return (["primary", "accent", "secondary"] as const).map((role) => ({
    key: role,
    label: t.roles[role],
    color: palette.colors[role],
    role,
  }));
}

function Chip({
  hex,
  label,
  textOk,
  original,
  onClick,
  title,
}: {
  hex: string;
  label?: string;
  textOk: boolean;
  original?: boolean;
  onClick?: () => void;
  title: string;
}) {
  const lys =
    (contrastRatio(hex, "#000000") ?? 0) > (contrastRatio(hex, "#FFFFFF") ?? 0);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-end rounded-md px-1 pb-1 pt-2 font-mono text-[10px] transition-transform enabled:hover:scale-105 enabled:focus-visible:scale-105",
        original && "ring-2 ring-ink ring-offset-2",
      )}
      style={{ backgroundColor: hex, color: lys ? "#111111" : "#FFFFFF" }}
    >
      {textOk && <span className="font-sans text-xs font-semibold">Aa</span>}
      {label && <span className="font-sans">{label}</span>}
      {/* I valørskalaen er rutene for smale til hex. Den står i tipset. */}
      {label && <span>{hex}</span>}
    </button>
  );
}

/**
 * Fanen «Valør og varme»: for hver merkefarge (eller hovedrolle) en
 * valørskala og varmere, kaldere, mer og mindre mettet variant med samme
 * lyshet. Et klikk bruker fargen i paletten, i rollen som er valgt.
 */
export function TonesPreview({
  palette,
  brand,
  onApply,
}: {
  palette: ColorPalette;
  brand?: ExtendedColorPalette["brand"];
  onApply?: ApplyFn;
}) {
  const { t } = useI18n();
  const k = t.tones;
  const kilder = sourcesFor(palette, brand, t);
  const [roller, setRoller] = useState<Record<string, Role>>({});
  const [melding, setMelding] = useState("");
  const bg = palette.colors.background;
  const tekstOk = (hex: string) => (contrastRatio(hex, bg) ?? 0) >= 4.5;

  const bruk = (role: Role, hex: string) => {
    if (!onApply) return;
    onApply(role, hex);
    setMelding(k.applied(hex, t.roles[role]));
  };

  return (
    <div
      className="space-y-6 p-4 sm:p-6"
      style={{ backgroundColor: bg, color: palette.colors.foreground }}
    >
      <div className="space-y-1">
        <p className="text-sm" style={{ color: palette.colors.muted }}>
          {k.intro}
        </p>
        <p className="text-xs" style={{ color: palette.colors.muted }}>
          {k.textOk}
        </p>
      </div>
      <p
        role="status"
        aria-live="polite"
        className="min-h-5 text-sm font-medium"
      >
        {melding}
      </p>

      {kilder.map((kilde) => {
        const rolle = roller[kilde.key] ?? kilde.role;
        const skala = valorScale(kilde.color);
        const v = variants(kilde.color);
        const selectId = `rolle-${kilde.key}`;
        return (
          <section
            key={kilde.key}
            aria-label={`${kilde.label} ${kilde.color}`}
            className="space-y-3 rounded-xl border p-4"
            style={{
              borderColor: palette.colors.border,
              backgroundColor: palette.colors.surface,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-semibold">
                <span
                  className="h-5 w-5 rounded border"
                  style={{
                    backgroundColor: kilde.color,
                    borderColor: palette.colors.border,
                  }}
                  aria-hidden="true"
                />
                {kilde.label}
                <span className="font-mono text-xs font-normal opacity-75">
                  {kilde.color}
                </span>
              </h3>
              {onApply && (
                <label
                  htmlFor={selectId}
                  className="flex items-center gap-2 text-xs"
                >
                  {k.applyAs}
                  <select
                    id={selectId}
                    value={rolle}
                    onChange={(e) =>
                      setRoller((r) => ({
                        ...r,
                        [kilde.key]: e.target.value as Role,
                      }))
                    }
                    className="rounded border border-line bg-panel px-2 py-1 text-xs text-ink"
                  >
                    {COLOR_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t.roles[r]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div>
              <p className="mb-1 text-xs font-medium opacity-80">{k.valor}</p>
              <div className="grid grid-cols-5 gap-1 sm:grid-cols-11">
                {skala.map((tone) => (
                  <Chip
                    key={tone.hex + (tone.original ? "-o" : "")}
                    hex={tone.hex}
                    textOk={tekstOk(tone.hex)}
                    original={tone.original}
                    title={
                      onApply ? k.apply(tone.hex, t.roles[rolle]) : tone.hex
                    }
                    onClick={onApply ? () => bruk(rolle, tone.hex) : undefined}
                  />
                ))}
              </div>
            </div>

            {v && (
              <div>
                <p className="mb-1 text-xs font-medium opacity-80">
                  {k.variants}
                </p>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  {(
                    [
                      [k.warmer, v.warmer],
                      [k.cooler, v.cooler],
                      [k.more, v.moreSaturated],
                      [k.less, v.lessSaturated],
                    ] as const
                  ).map(([label, hex]) => (
                    <Chip
                      key={label}
                      hex={hex}
                      label={label}
                      textOk={tekstOk(hex)}
                      title={onApply ? k.apply(hex, t.roles[rolle]) : hex}
                      onClick={onApply ? () => bruk(rolle, hex) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
