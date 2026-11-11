"use client";

import { ColorPalette } from "@/types/palette";

import { ColorSwatch } from "./ColorSwatch";
import { useI18n } from "./I18nProvider";
import { ContrastPanel } from "./ContrastPanel";
import { ExportPanel } from "./ExportPanel";
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

export function ColorDetails({
  palette,
  exportPalette,
  onApplySuggestion,
}: ColorDetailsProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t.details.swatches}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <ColorSwatch label={t.roles.primary} color={palette.colors.primary} />
          <ColorSwatch
            label={t.roles.secondary}
            color={palette.colors.secondary}
          />
          <ColorSwatch label={t.roles.accent} color={palette.colors.accent} />
          <ColorSwatch label={t.roles.warm} color={palette.colors.warm} />
          <ColorSwatch label={t.roles.cool} color={palette.colors.cool} />
          <ColorSwatch label={t.roles.surface} color={palette.colors.surface} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {t.details.semantic}
        </h3>
        <div className="grid grid-cols-4 gap-3 lg:grid-cols-2">
          <ColorSwatch
            label={t.roles.success}
            color={palette.colors.success}
            size="sm"
          />
          <ColorSwatch
            label={t.roles.warning}
            color={palette.colors.warning}
            size="sm"
          />
          <ColorSwatch
            label={t.roles.error}
            color={palette.colors.error}
            size="sm"
          />
          <ColorSwatch
            label={t.roles.info}
            color={palette.colors.info}
            size="sm"
          />
        </div>
      </div>

      <ContrastPanel palette={palette} onApply={onApplySuggestion} />

      <ExportPanel palette={exportPalette} />
    </div>
  );
}
