"use client";

import { formatCmyk, hexToCmyk } from "@/lib/cmyk";
import { parseHex } from "@/lib/contrast";
import { COLOR_ROLES } from "@/lib/share";
import { useI18n } from "@/components/I18nProvider";
import type { ColorPalette } from "@/types/palette";

/**
 * Alle fargene i varianten som vises, med HEX, RGB og omtrentlig CMYK. Står
 * sammenfoldet, så panelet ikke blir langt for de som ikke trenger det.
 */
export function ColorValues({ palette }: { palette: ColorPalette }) {
  const { t } = useI18n();
  const v = t.values;
  return (
    <details className="group rounded-lg border border-gray-200">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-gray-900">
        {v.title}
      </summary>
      <div className="space-y-2 border-t border-gray-200 px-3 py-3">
        <ul className="space-y-2">
          {COLOR_ROLES.map((role) => {
            const hex = palette.colors[role];
            const rgb = parseHex(hex);
            const cmyk = hexToCmyk(hex);
            return (
              <li key={role} className="flex items-start gap-2">
                <span
                  className="mt-0.5 h-6 w-6 shrink-0 rounded border border-gray-300"
                  style={{ backgroundColor: hex }}
                  aria-hidden="true"
                />
                <div className="min-w-0 text-xs">
                  <p className="font-medium text-gray-900">{t.roles[role]}</p>
                  <p className="font-mono text-gray-700">
                    {hex}
                    {rgb && ` · ${rgb.r} ${rgb.g} ${rgb.b}`}
                  </p>
                  {cmyk && (
                    <p className="font-mono text-gray-700">
                      CMYK ≈ {formatCmyk(cmyk.cmyk)}
                      {cmyk.outOfGamut && (
                        <span className="ml-1 font-sans font-semibold text-amber-800">
                          {v.outOfGamut}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] leading-snug text-gray-600">{v.note}</p>
      </div>
    </details>
  );
}
