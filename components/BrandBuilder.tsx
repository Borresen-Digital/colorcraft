"use client";

import { useId, useMemo, useState } from "react";
import type { ExtendedColorPalette } from "@/data/palettes";
import {
  generateFromBrand,
  MAX_LOGO,
  MAX_SUPPORT,
  normalizeHex,
  type BrandNote,
  type BrandResult,
} from "@/lib/brand";
import { cmykToHex, formatCmyk, hexToCmyk, parseCmyk } from "@/lib/cmyk";
import { formatRatio } from "@/lib/contrast";
import { checkPalette } from "@/lib/contrastPairs";
import { localizeRatio } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";
import type { ColorPalette } from "@/types/palette";

interface BrandBuilderProps {
  onClose: () => void;
  /** Får paletten uten id. Forelderen gir den en custom-id og lagrer den. */
  onCreate: (palette: Omit<ExtendedColorPalette, "id">) => void;
}

/**
 * Én rad med fargevelger, HEX-felt og CMYK-felt. CMYK kan skrives inn fra
 * profilmanualen, og blir omregnet til HEX (omtrentlig). Det som er skrevet,
 * blir stående så lenge HEX-verdien er den det ga, så tallene ikke hopper
 * mens man skriver.
 */
function ColorRow({
  value,
  onChange,
  onCmyk,
  onRemove,
  removeLabel,
  invalidText,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Får CMYK-teksten fra manualen og HEX-en den ga, når den er gyldig. */
  onCmyk: (hex: string, cmyk: string) => void;
  onRemove?: () => void;
  removeLabel: string;
  invalidText: string;
}) {
  const { t } = useI18n();
  const id = useId();
  const gyldig = normalizeHex(value);
  const [skrevet, setSkrevet] = useState<{ text: string; hex: string } | null>(
    null,
  );
  const avledet = gyldig ? formatCmyk(hexToCmyk(gyldig)!.cmyk) : "";
  // Det som er skrevet, vises så lenge HEX er den det hørte til. Endres HEX
  // et annet sted (fargevelger eller HEX-feltet), følger CMYK etter.
  const cmykTekst = skrevet && skrevet.hex === gyldig ? skrevet.text : avledet;
  const cmykGyldig = cmykTekst === "" || !!parseCmyk(cmykTekst);
  const handleCmyk = (text: string) => {
    const cmyk = parseCmyk(text);
    const hex = cmyk ? cmykToHex(cmyk) : (gyldig ?? "");
    setSkrevet({ text, hex });
    if (cmyk) {
      onChange(hex);
      onCmyk(hex, formatCmyk(cmyk));
    }
  };
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input
          type="color"
          value={gyldig ?? "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          aria-label={value}
          className="h-10 w-12 shrink-0 cursor-pointer rounded border border-field"
        />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!gyldig}
          aria-describedby={gyldig ? undefined : `${id}-feil`}
          className="min-w-0 flex-1 rounded border border-field bg-panel p-2 font-mono text-sm text-ink focus:border-accent focus:outline-none aria-[invalid=true]:border-bad"
          placeholder="#000000"
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="shrink-0 rounded border border-field px-3 text-subtle hover:bg-sunken"
          >
            ×
          </button>
        )}
      </div>
      {!gyldig && (
        <p id={`${id}-feil`} className="text-xs text-bad">
          {invalidText}
        </p>
      )}
      <div className="flex items-center gap-2 pl-14">
        <label
          htmlFor={`${id}-cmyk`}
          className="shrink-0 text-xs font-medium text-subtle"
        >
          CMYK ≈
        </label>
        <input
          id={`${id}-cmyk`}
          type="text"
          inputMode="numeric"
          value={cmykTekst}
          onChange={(e) => handleCmyk(e.target.value)}
          aria-invalid={!cmykGyldig}
          aria-describedby={cmykGyldig ? undefined : `${id}-cmyk-feil`}
          placeholder="0 25 100 0"
          className="min-w-0 flex-1 rounded border border-line bg-panel px-2 py-1 font-mono text-xs text-ink focus:border-accent focus:outline-none aria-[invalid=true]:border-bad"
        />
      </div>
      {!cmykGyldig && (
        <p id={`${id}-cmyk-feil`} className="pl-14 text-[11px] text-bad">
          {t.values.cmykInvalid}
        </p>
      )}
    </div>
  );
}

function Swatches({
  colors,
  label,
}: {
  colors: ColorPalette["colors"];
  label: string;
}) {
  const vis = [
    colors.background,
    colors.surface,
    colors.secondary,
    colors.primary,
    colors.accent,
    colors.foreground,
    colors.muted,
  ];
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-subtle">{label}</p>
      <div
        className="flex overflow-hidden rounded-lg border border-line"
        aria-hidden="true"
      >
        {vis.map((c, i) => (
          <div key={i} className="h-10 flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skjemaet «Fra profilmanual»: logofarger og støttefarger inn, en hel palett
 * med lys og mørk variant ut. Paletten regnes ut mens du skriver, så du ser
 * resultatet og kontrasten før du lager den.
 */
export function BrandBuilder({ onClose, onCreate }: BrandBuilderProps) {
  const { locale, t } = useI18n();
  const b = t.brand;
  const [name, setName] = useState<string>(b.defaultName);
  const [logo, setLogo] = useState<string[]>(["#F2B705"]);
  const [support, setSupport] = useState<string[]>(["#F5EFE0", "#2B2B2B"]);
  // CMYK-tallene fra manualen, etter HEX-en de ga. Brukes på fargekortet.
  const [manualCmyk, setManualCmyk] = useState<Record<string, string>>({});

  const alleGyldige =
    logo.length > 0 && [...logo, ...support].every((c) => normalizeHex(c));

  const result: BrandResult | null = useMemo(() => {
    if (!alleGyldige) return null;
    try {
      return generateFromBrand({ logo, support });
    } catch {
      return null;
    }
  }, [logo, support, alleGyldige]);

  const stryker = result
    ? [result.light, result.dark]
        .map(
          (colors) =>
            checkPalette({ id: "", name: "", description: "", colors }).filter(
              (r) => r.level === "fail",
            ).length,
        )
        .reduce((a, n) => a + n, 0)
    : 0;

  const noteText = (n: BrandNote) =>
    n.kind === "adjusted-dark"
      ? b.noteDark(t.roles[n.role], n.from, n.to)
      : b.noteLight(
          t.roles[n.role],
          n.color,
          localizeRatio(formatRatio(n.ratio), locale),
        );

  const oppdater =
    (liste: string[], sett: (v: string[]) => void) => (i: number, v: string) =>
      sett(liste.map((x, j) => (j === i ? v : x)));

  const handleCreate = () => {
    if (!result) return;
    const navn = name.trim() || b.defaultName;
    onCreate({
      name: navn,
      description: b.description,
      colors: result.light,
      darkVariant: {
        id: "",
        name: `${navn} ${t.palette.darkSuffix}`,
        description: `${b.description} ${t.palette.darkDescriptionSuffix}`,
        colors: result.dark,
      },
      brand: {
        logo: logo.map((c) => normalizeHex(c)!),
        support: support.map((c) => normalizeHex(c)!),
        // Bare CMYK for farger som fortsatt er den HEX-en tallene ga.
        cmyk: Object.fromEntries(
          [...logo, ...support]
            .map((c) => normalizeHex(c)!)
            .filter((h) => manualCmyk[h])
            .map((h) => [h, manualCmyk[h]]),
        ),
      },
    });
  };

  const seksjon = (
    tittel: string,
    hjelp: string,
    liste: string[],
    sett: (v: string[]) => void,
    maks: number,
    min: number,
  ) => (
    <fieldset className="min-w-0 space-y-2">
      <legend className="text-sm font-semibold text-ink">{tittel}</legend>
      <p className="text-xs text-subtle">{hjelp}</p>
      {liste.map((c, i) => (
        <ColorRow
          key={i}
          value={c}
          onChange={(v) => oppdater(liste, sett)(i, v)}
          onCmyk={(hex, cmyk) => setManualCmyk((m) => ({ ...m, [hex]: cmyk }))}
          onRemove={
            liste.length > min
              ? () => sett(liste.filter((_, j) => j !== i))
              : undefined
          }
          removeLabel={b.remove(i + 1)}
          invalidText={b.invalid}
        />
      ))}
      {liste.length < maks && (
        <button
          type="button"
          onClick={() => sett([...liste, "#888888"])}
          className="text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          + {b.add}
        </button>
      )}
    </fieldset>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-panel">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-panel p-4 sm:p-6">
          <h2
            id="brand-title"
            className="font-display text-xl font-bold sm:text-2xl"
          >
            {b.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.editor.close}
            className="flex h-8 w-8 items-center justify-center text-2xl text-subtle hover:text-ink"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <p className="text-sm text-subtle">{b.intro}</p>

          <div>
            <label
              htmlFor="brand-name"
              className="mb-1 block text-sm font-semibold text-ink"
            >
              {b.name}
            </label>
            <input
              id="brand-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-field p-2 text-ink focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {seksjon(b.logo, b.logoHelp, logo, setLogo, MAX_LOGO, 1)}
            {seksjon(
              b.support,
              b.supportHelp,
              support,
              setSupport,
              MAX_SUPPORT,
              0,
            )}
          </div>
          <p className="text-xs text-subtle">{t.values.cmykHelp}</p>

          <section
            aria-labelledby="brand-preview"
            className="space-y-3 rounded-lg border border-line bg-sunken p-4"
          >
            <h3 id="brand-preview" className="text-sm font-semibold text-ink">
              {b.preview}
            </h3>
            {result ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Swatches colors={result.light} label={b.light} />
                  <Swatches colors={result.dark} label={b.dark} />
                </div>
                <p
                  className={
                    stryker === 0 ? "text-sm text-ok" : "text-sm text-warn"
                  }
                >
                  {stryker === 0 ? b.allPass : b.failing(stryker)}
                </p>
                {result.notes.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-xs text-subtle">
                    {result.notes.map((n, i) => (
                      <li key={i}>{noteText(n)}</li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="text-sm text-bad">{b.invalid}</p>
            )}
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-field px-5 py-2 font-medium text-subtle hover:bg-sunken"
            >
              {b.cancel}
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!result}
              className="rounded-full bg-ink px-5 py-2 font-medium text-paper hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {b.create}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
