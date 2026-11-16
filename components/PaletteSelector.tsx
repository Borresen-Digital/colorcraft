"use client";

import { useState } from "react";
import { ExtendedColorPalette } from "@/data/palettes";
import { useI18n } from "@/components/I18nProvider";
import { useSimple } from "@/components/SimpleMode";
import { cn } from "@/lib/utils";
import { btn, field } from "@/lib/ui";

interface PaginatedPaletteSelectorProps {
  palettes: ExtendedColorPalette[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** «Ny fra profilmanual» øverst i listen. */
  onNew?: () => void;
  /** «Ny tom palett», bare for utviklere. */
  onNewEmpty?: () => void;
}

/** Fargene som vises i stripen på hver palett, lys og eventuelt mørk. */
function stripe(p: ExtendedColorPalette): string[] {
  const c = p.colors;
  return [c.primary, c.accent, c.secondary, c.warm, c.cool, c.background];
}

/** Egne paletter (laget, importert eller lagret fra en lenke) har custom-id. */
export function isOwnPalette(p: { id: string }): boolean {
  return p.id.startsWith("custom-");
}

/**
 * Listen over paletter, delt i «Mine paletter» øverst og «Eksempler» under.
 * For designere er eksemplene lukket, så egne paletter er det man ser. Søk
 * i navn og beskrivelse viser treff i begge gruppene.
 */
export function PaginatedPaletteSelector({
  palettes,
  selectedId,
  onSelect,
  onNew,
  onNewEmpty,
}: PaginatedPaletteSelectorProps) {
  const { t } = useI18n();
  const { simple } = useSimple();
  const s = t.selector;
  const [søk, setSøk] = useState("");
  const q = søk.trim().toLowerCase();

  const treff = palettes.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );
  const egne = treff.filter(isOwnPalette);
  const eksempler = treff.filter((p) => !isOwnPalette(p));
  const harEgne = palettes.some(isOwnPalette);
  const valgtEksempel = eksempler.some(
    (p) => p.id === selectedId || p.darkVariant?.id === selectedId,
  );
  // Eksemplene står åpne når man søker, når et eksempel er valgt, når det
  // ikke finnes egne paletter, og alltid for utviklere.
  const eksemplerÅpne = !simple || !!q || valgtEksempel || !harEgne;

  const liste = (ps: ExtendedColorPalette[]) => (
    <ul className="-mx-1 space-y-1 px-1 py-0.5">
      {ps.map((p) => {
        const valgt = selectedId === p.id || selectedId === p.darkVariant?.id;
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              aria-current={valgt ? "true" : undefined}
              title={p.name}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                valgt ? "bg-sunken ring-2 ring-accent" : "hover:bg-sunken",
              )}
            >
              <span
                className="flex h-9 w-12 shrink-0 overflow-hidden rounded-lg border border-line"
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
                {/* Navnet får to linjer i stedet for å kuttes. */}
                <span className="line-clamp-2 text-sm leading-snug font-semibold break-words text-ink">
                  {p.name}
                </span>
                <span className="block truncate text-xs text-subtle">
                  {p.description}
                </span>
              </span>
              {p.darkVariant && !simple && (
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-line"
                  style={{
                    background: `linear-gradient(135deg, ${p.colors.background} 50%, ${p.darkVariant.colors.background} 50%)`,
                  }}
                  title={s.darkAvailable}
                  aria-label={s.darkAvailable}
                  role="img"
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const overskrift =
    "mb-1.5 text-xs font-semibold uppercase tracking-widest text-subtle";

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-3 font-display text-lg font-bold">{s.title}</h2>

      {onNew && (
        <button
          type="button"
          onClick={onNew}
          className={cn(btn("primary", "sm"), "mb-3 w-full justify-center")}
        >
          {s.newFromManual}
        </button>
      )}
      {onNewEmpty && !simple && (
        <button
          type="button"
          onClick={onNewEmpty}
          className={cn(
            btn("outline", "sm"),
            "-mt-1 mb-3 w-full justify-center",
          )}
        >
          {t.app.newPalette}
        </button>
      )}

      <input
        type="search"
        placeholder={s.search}
        aria-label={s.searchLabel}
        value={søk}
        onChange={(e) => setSøk(e.target.value)}
        className={cn(field, "mb-1 w-full")}
      />
      <p className="mb-3 min-h-4 text-xs text-subtle" aria-live="polite">
        {q && s.showing(treff.length, palettes.length)}
      </p>

      <div className="-mx-1 max-h-[60vh] flex-1 space-y-4 overflow-y-auto px-1 lg:max-h-none">
        <section aria-labelledby="mine-paletter">
          <h3 id="mine-paletter" className={overskrift}>
            {s.mine}
          </h3>
          {egne.length > 0 ? (
            liste(egne)
          ) : (
            <p className="text-xs text-subtle">{q ? s.noMatches : s.noneYet}</p>
          )}
        </section>

        {eksempler.length > 0 && (
          <details
            // Ny nøkkel når standarden endres, så åpen eller lukket følger med.
            key={eksemplerÅpne ? "apen" : "lukket"}
            open={eksemplerÅpne}
          >
            <summary
              className={cn(overskrift, "cursor-pointer hover:text-ink")}
            >
              {s.examples(eksempler.length)}
            </summary>
            <p className="mb-2 text-xs text-subtle">{s.examplesHelp}</p>
            {liste(eksempler)}
          </details>
        )}
      </div>
    </div>
  );
}
