"use client";

import { useMemo, useState } from "react";
import type { ExtendedColorPalette } from "@/data/palettes";
import { EXPORTS, type ExportFormat } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";

interface ExportPanelProps {
  /** Hele paletten, med mørk variant hvis den finnes, uansett hvilken som vises. */
  palette: ExtendedColorPalette;
}

const FORMATS = Object.keys(EXPORTS) as ExportFormat[];

export function ExportPanel({ palette }: ExportPanelProps) {
  const { locale, t } = useI18n();
  const [format, setFormat] = useState<ExportFormat>("css");
  const [status, setStatus] = useState<"" | "copied" | "failed">("");
  const spec = EXPORTS[format];
  const code = useMemo(
    () => spec.render(palette, locale),
    [spec, palette, locale],
  );

  const flash = (s: "copied" | "failed") => {
    setStatus(s);
    setTimeout(() => setStatus(""), 2000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      flash("copied");
    } catch {
      flash("failed");
    }
  };

  // Filen lages i nettleseren. Ingenting sendes noe sted.
  const download = () => {
    const url = URL.createObjectURL(new Blob([code], { type: spec.mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = spec.filename(palette);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="export-heading">
      <h3
        id="export-heading"
        className="mb-3 font-display text-lg font-bold text-ink"
      >
        {t.export.title}
      </h3>

      <div
        role="tablist"
        aria-label={t.export.formatLabel}
        className="mb-2 flex gap-1"
      >
        {FORMATS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={format === f}
            onClick={() => setFormat(f)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              format === f
                ? "bg-ink text-paper"
                : "bg-sunken text-subtle hover:bg-line",
            )}
          >
            {EXPORTS[f].label}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[11px] text-subtle">{t.export.hints[format]}</p>

      <pre
        className="max-h-72 overflow-auto rounded-lg bg-sunken p-3 font-mono text-[11px] leading-relaxed text-ink"
        tabIndex={0}
        aria-label={`${t.export.title}: ${EXPORTS[format].label}`}
      >
        <code>{code}</code>
      </pre>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-ink/85"
        >
          {status === "copied"
            ? t.export.copied
            : status === "failed"
              ? t.export.failed
              : t.export.copy}
        </button>
        <button
          type="button"
          onClick={download}
          className="flex-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-sunken"
        >
          {t.export.download}
        </button>
      </div>
      <p className="mt-1 truncate text-[11px] text-subtle">
        {spec.filename(palette)}
      </p>
    </section>
  );
}
