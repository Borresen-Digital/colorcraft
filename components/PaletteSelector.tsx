"use client";

import { useState } from "react";
import { ExtendedColorPalette } from "@/data/palettes";
import { useI18n } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";
import { field } from "@/lib/ui";

interface PaginatedPaletteSelectorProps {
  palettes: ExtendedColorPalette[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Fargene som vises i stripen på hver palett, lys og eventuelt mørk. */
function stripe(p: ExtendedColorPalette): string[] {
  const c = p.colors;
  return [c.primary, c.accent, c.secondary, c.warm, c.cool, c.background];
}

/**
 * Listen over paletter. Kompakt, med en fargestripe per palett, og søk i
 * navn og beskrivelse. Listen ruller i panelet i stedet for å deles i sider.
 */
export function PaginatedPaletteSelector({
  palettes,
  selectedId,
  onSelect,
}: PaginatedPaletteSelectorProps) {
  const { t } = useI18n();
  const [søk, setSøk] = useState("");

  const treff = palettes.filter((p) => {
    const q = søk.trim().toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold">{t.selector.title}</h2>
        <span className="text-xs text-subtle" aria-live="polite">
          {t.selector.showing(treff.length, palettes.length)}
        </span>
      </div>

      <input
        type="search"
        placeholder={t.selector.search}
        aria-label={t.selector.searchLabel}
        value={søk}
        onChange={(e) => setSøk(e.target.value)}
        className={cn(field, "mb-3 w-full")}
      />

      <ul className="-mx-1 max-h-[60vh] flex-1 space-y-1 overflow-y-auto px-1 py-0.5 lg:max-h-none">
        {treff.map((p) => {
          const valgt = selectedId === p.id || selectedId === p.darkVariant?.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                aria-current={valgt ? "true" : undefined}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                  valgt ? "bg-sunken ring-2 ring-accent" : "hover:bg-sunken",
                )}
              >
                <span
                  className="flex h-9 w-14 shrink-0 overflow-hidden rounded-lg border border-line"
                  aria-hidden="true"
                >
                  {stripe(p).map((c, i) => (
                    <span
                      key={i}
                      className="h-full flex-1"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {p.name}
                  </span>
                  <span className="block truncate text-xs text-subtle">
                    {p.description}
                  </span>
                </span>
                {p.darkVariant && (
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border border-line"
                    style={{
                      background: `linear-gradient(135deg, ${p.colors.background} 50%, ${p.darkVariant.colors.background} 50%)`,
                    }}
                    title={t.selector.darkAvailable}
                    aria-label={t.selector.darkAvailable}
                    role="img"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
