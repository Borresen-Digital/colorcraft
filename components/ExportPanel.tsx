"use client";

import { useMemo, useState } from "react";
import type { ExtendedColorPalette } from "@/data/palettes";
import { EXPORTS, type ExportFormat } from "@/lib/export";
import { cn } from "@/lib/utils";

interface ExportPanelProps {
  /** Hele paletten, med mørk variant hvis den finnes, uansett hvilken som vises. */
  palette: ExtendedColorPalette;
}

const FORMATS = Object.keys(EXPORTS) as ExportFormat[];

const HINTS: Record<ExportFormat, string> = {
  css: "Light by default, dark from the system setting. Set data-theme on <html> to override.",
  tailwind:
    "Replaces your Tailwind entry CSS. Gives classes like bg-primary and text-on-primary.",
  json: "W3C Design Tokens format. Works with Tokens Studio for Figma and Style Dictionary.",
};

export function ExportPanel({ palette }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>("css");
  const [status, setStatus] = useState<"" | "copied" | "failed">("");
  const spec = EXPORTS[format];
  const code = useMemo(() => spec.render(palette), [spec, palette]);

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
        className="mb-3 text-lg font-semibold text-gray-900"
      >
        Export
      </h3>

      <div
        role="tablist"
        aria-label="Export format"
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
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            )}
          >
            {EXPORTS[f].label}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[11px] text-gray-600">{HINTS[format]}</p>

      <pre
        className="max-h-72 overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-[11px] leading-relaxed text-green-400"
        tabIndex={0}
        aria-label={`${EXPORTS[format].label} export`}
      >
        <code>{code}</code>
      </pre>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          {status === "copied"
            ? "Copied!"
            : status === "failed"
              ? "Copy failed"
              : "Copy"}
        </button>
        <button
          type="button"
          onClick={download}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
        >
          Download
        </button>
      </div>
      <p className="mt-1 truncate text-[11px] text-gray-500">
        {spec.filename(palette)}
      </p>
    </section>
  );
}
