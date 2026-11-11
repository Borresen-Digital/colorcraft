"use client";

import { useState } from "react";
import { formatRatio, THRESHOLDS, type ContrastLevel } from "@/lib/contrast";
import { checkPalette, type ContrastResult } from "@/lib/contrastPairs";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import { localizeRatio } from "@/lib/i18n";
import type { ColorPalette } from "@/types/palette";

type ApplyFn = (role: keyof ColorPalette["colors"], color: string) => void;

interface ContrastPanelProps {
  palette: ColorPalette;
  /** Uten denne vises bare kopiering, ikke «Bruk». */
  onApply?: ApplyFn;
}

function Badge({ label, pass }: { label: string; pass: boolean }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
        pass
          ? "bg-emerald-100 text-emerald-800"
          : "bg-gray-100 text-gray-500 line-through",
      )}
      aria-label={`${label} ${pass ? t.contrast.passes : t.contrast.fails}`}
    >
      {label}
    </span>
  );
}

function passes(level: ContrastLevel, need: "AA" | "AAA") {
  return need === "AA" ? level !== "fail" : level === "AAA";
}

function ContrastRow({
  result,
  onApply,
}: {
  result: ContrastResult;
  onApply?: ApplyFn;
}) {
  const { locale, t } = useI18n();
  const [copied, setCopied] = useState(false);
  const { pair, fg, bg, ratio, level, suggestion } = result;
  const krav = pair.large ? THRESHOLDS.large : THRESHOLDS.normal;

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Utklippstavlen kan være sperret. Fargen står uansett synlig.
    }
  };

  return (
    <li className="space-y-1.5 rounded-lg border border-gray-200 p-2.5">
      <p className="text-xs font-medium text-gray-900">
        {t.contrast.pairs[pair.id] ?? pair.label}
        {pair.large && (
          <span className="font-normal text-gray-500"> {t.contrast.large}</span>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="flex h-7 w-9 shrink-0 items-center justify-center rounded border border-gray-200 text-sm font-semibold"
          style={{ backgroundColor: bg, color: fg }}
          aria-hidden="true"
        >
          Aa
        </span>
        <span className="font-mono text-xs text-gray-700">
          {ratio === null
            ? t.contrast.invalid
            : localizeRatio(formatRatio(ratio), locale)}
        </span>
        <div className="ml-auto flex shrink-0 gap-1">
          <Badge label="AA" pass={passes(level, "AA")} />
          <Badge label="AAA" pass={passes(level, "AAA")} />
        </div>
      </div>

      {suggestion && (
        <div className="flex items-stretch gap-1">
          <button
            type="button"
            onClick={() => copy(suggestion.color)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded bg-amber-50 px-2 py-1 text-left text-[11px] text-amber-900 hover:bg-amber-100"
            title={t.contrast.copySuggestion}
          >
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-sm border border-amber-200"
              style={{ backgroundColor: suggestion.color }}
              aria-hidden="true"
            />
            <span>
              {copied
                ? t.contrast.copied
                : t.contrast.suggest(
                    suggestion.color,
                    t.roles[suggestion.role],
                    localizeRatio(String(krav.AA), locale),
                  )}
            </span>
          </button>
          {onApply && (
            <button
              type="button"
              onClick={() => onApply(suggestion.role, suggestion.color)}
              aria-label={t.contrast.applyLabel(
                suggestion.color,
                t.roles[suggestion.role],
              )}
              className="shrink-0 rounded bg-amber-800 px-2 text-[11px] font-semibold text-white hover:bg-amber-900"
            >
              {t.contrast.apply}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Kontrastsjekk for fargeparene i forhåndsvisningen, etter WCAG 2.2.
 * Par som stryker får et forslag til nærmeste farge som når AA.
 */
export function ContrastPanel({ palette, onApply }: ContrastPanelProps) {
  const { t } = useI18n();
  const results = checkPalette(palette);
  const failing = results.filter((r) => r.level === "fail").length;

  return (
    <section aria-labelledby="contrast-heading">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-2">
        <h3
          id="contrast-heading"
          className="text-lg font-semibold text-gray-900"
        >
          {t.contrast.title}
        </h3>
        <span
          className={cn(
            "text-xs font-medium",
            failing === 0 ? "text-emerald-700" : "text-amber-700",
          )}
        >
          {failing === 0 ? t.contrast.allPass : t.contrast.below(failing)}
        </span>
      </div>
      <ul className="space-y-2">
        {results.map((r) => (
          <ContrastRow key={r.pair.id} result={r} onApply={onApply} />
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-gray-500">{t.contrast.footnote}</p>
    </section>
  );
}
