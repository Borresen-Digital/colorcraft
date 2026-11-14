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
    <details className="group rounded-lg border border-line">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-ink">
        {v.title}
      </summary>
      <div className="space-y-2 border-t border-line px-3 py-3">
        <ul className="space-y-2">
          {COLOR_ROLES.map((role) => {
            const hex = palette.colors[role];
            const rgb = parseHex(hex);
            const cmyk = hexToCmyk(hex);
            return (
              <li key={role} className="flex items-start gap-2">
                <span
                  className="mt-0.5 h-6 w-6 shrink-0 rounded border border-line"
                  style={{ backgroundColor: hex }}
                  aria-hidden="true"
                />
                <div className="min-w-0 text-xs">
                  <p className="font-medium text-ink">
                    {t.roles[role]}{" "}
                    <span className="font-mono text-[10px] font-normal text-subtle">
                      {role}
                    </span>
                  </p>
                  <p className="font-mono text-subtle">
                    {hex}
                    {rgb && ` · ${rgb.r} ${rgb.g} ${rgb.b}`}
                  </p>
                  {cmyk && (
                    <p className="font-mono text-subtle">
                      CMYK ≈ {formatCmyk(cmyk.cmyk)}
                      {cmyk.outOfGamut && (
                        <span className="ml-1 font-sans font-semibold text-warn">
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
        <p className="text-[11px] leading-snug text-subtle">{v.note}</p>
      </div>
    </details>
  );
}
