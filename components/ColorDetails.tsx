"use client";

import { ColorPalette } from "@/types/palette";

import { ColorSwatch } from "./ColorSwatch";
import { useI18n } from "./I18nProvider";
import { ContrastPanel } from "./ContrastPanel";
import { ExportPanel } from "./ExportPanel";
import { ColorValues } from "./ColorValues";
import { ColorCardPanel } from "./ColorCardPanel";
import { Glossary } from "./Glossary";
import type { ExtendedColorPalette } from "@/data/palettes";

interface ColorDetailsProps {
  /** Varianten som vises nå (lys eller mørk). */
  palette: ColorPalette;
  /** Hele paletten, så eksporten får med både lys og mørk. */
  exportPalette: ExtendedColorPalette;
  /** Bytter én farge i varianten som vises (forslag fra kontrastsjekken). */
  onApplySuggestion?: (
    role: keyof ColorPalette["colors"],
    color: string,
  ) => void;
}

/**
 * Høyre kolonne i to lag. Øverst det designeren trenger: merkefargene (eller
 * hovedfargene), kontrasten og fargekortet. Under, sammenfoldet for paletter
 * fra en profilmanual, det utvikleren trenger: alle rollene, verdiene og
 * eksporten.
 */
export function ColorDetails({
  palette,
  exportPalette,
  onApplySuggestion,
}: ColorDetailsProps) {
  const { t } = useI18n();
  const brand = exportPalette.brand;
  const c = palette.colors;

  const roller = (
    <>
      <div className="grid grid-cols-3 gap-3">
        <ColorSwatch label={t.roles.primary} color={c.primary} />
        <ColorSwatch label={t.roles.secondary} color={c.secondary} />
        <ColorSwatch label={t.roles.accent} color={c.accent} />
        <ColorSwatch label={t.roles.warm} color={c.warm} />
        <ColorSwatch label={t.roles.cool} color={c.cool} />
        <ColorSwatch label={t.roles.surface} color={c.surface} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">
          {t.details.semantic}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <ColorSwatch label={t.roles.success} color={c.success} size="sm" />
          <ColorSwatch label={t.roles.warning} color={c.warning} size="sm" />
          <ColorSwatch label={t.roles.error} color={c.error} size="sm" />
          <ColorSwatch label={t.roles.info} color={c.info} size="sm" />
        </div>
      </div>
    </>
  );

  // Uten eget navn får fargen standardnavnet fra Valør og varme.
  const grupper = brand
    ? (
        [
          [t.card.logoColors, brand.logo, t.tones.logo],
          [t.card.supportColors, brand.support, t.tones.support],
          [t.card.highlightColors, brand.highlight ?? [], t.tones.highlight],
          [t.card.internalColors, brand.internal ?? [], t.tones.internal],
        ] as const
      ).filter(([, farger]) => farger.length > 0)
    : [];
  const navn = (hex: string, standard: string) =>
    brand?.names?.[hex] ?? brand?.names?.[hex.toUpperCase()] ?? standard;

  return (
    <div className="space-y-6">
      {brand ? (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {t.details.brandTitle}
            </h2>
            <p className="text-xs text-subtle">{t.details.brandHelp}</p>
          </div>
          {grupper.map(([tittel, farger, standard]) => (
            <div key={tittel}>
              <h3 className="mb-2 text-sm font-semibold text-ink">{tittel}</h3>
              <div className="grid grid-cols-3 gap-3">
                {farger.map((hex, i) => (
                  <ColorSwatch
                    key={`${hex}-${i}`}
                    label={navn(hex, standard(i + 1))}
                    color={hex}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-ink">
            {t.details.swatches}
          </h2>
          {roller}
        </section>
      )}

      <Glossary />

      <ContrastPanel palette={palette} onApply={onApplySuggestion} />

      <ColorCardPanel palette={exportPalette} />

      <details
        // Paletter fra en manual er for designere, så utviklerdelen står
        // sammenfoldet. Andre paletter viser den åpen, som før.
        key={brand ? "manual" : "rolle"}
        open={!brand}
        className="space-y-4 rounded-xl border border-line p-3"
      >
        <summary className="cursor-pointer select-none font-display text-lg font-bold text-ink">
          {t.details.developer}
        </summary>
        <div className="mt-3 space-y-4">
          <p className="text-xs text-subtle">{t.details.developerHelp}</p>
          {brand && <div className="space-y-3">{roller}</div>}
          <ColorValues palette={palette} />
          <ExportPanel palette={exportPalette} />
        </div>
      </details>
    </div>
  );
}
