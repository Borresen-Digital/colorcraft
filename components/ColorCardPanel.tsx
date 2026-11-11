"use client";

import { useState } from "react";
import type { ExtendedColorPalette } from "@/data/palettes";
import { buildCardModel, cardFilename, layoutCard } from "@/lib/colorCard";
import { useI18n } from "@/components/I18nProvider";

/**
 * «Fargekort til kunden»: PDF eller PNG med fargene, lages i nettleseren.
 * pdf-lib lastes først når noen ber om en PDF, så siden ikke blir tyngre.
 */
export function ColorCardPanel({ palette }: { palette: ExtendedColorPalette }) {
  const { locale, t } = useI18n();
  const k = t.card;
  const [maker, setMaker] = useState("");
  const [status, setStatus] = useState<"" | "working" | "failed">("");

  const lastNed = (blob: Blob, navn: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = navn;
    a.click();
    // Gi nedlastingen tid før adressen frigis.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const lag = async (format: "pdf" | "png") => {
    setStatus("working");
    try {
      const ops = layoutCard(
        buildCardModel(palette, locale, maker, new Date()),
        locale,
      );
      const { renderPdf, renderPng } = await import("@/lib/cardRender");
      const blob =
        format === "pdf"
          ? new Blob([(await renderPdf(ops, palette.name)) as BlobPart], {
              type: "application/pdf",
            })
          : await renderPng(ops);
      lastNed(blob, cardFilename(palette.name, locale, format));
      setStatus("");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <section aria-labelledby="card-heading" className="space-y-2">
      <h3 id="card-heading" className="font-display text-lg font-bold text-ink">
        {k.panelTitle}
      </h3>
      <p className="text-[11px] text-subtle">{k.panelHelp}</p>
      <label
        htmlFor="card-maker"
        className="block text-xs font-medium text-ink"
      >
        {k.maker}
      </label>
      <input
        id="card-maker"
        type="text"
        value={maker}
        maxLength={60}
        onChange={(e) => setMaker(e.target.value)}
        placeholder={k.makerPlaceholder}
        className="w-full rounded border border-line bg-panel px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => lag("pdf")}
          disabled={status === "working"}
          className="flex-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          {k.downloadPdf}
        </button>
        <button
          type="button"
          onClick={() => lag("png")}
          disabled={status === "working"}
          className="flex-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-sunken disabled:opacity-50"
        >
          {k.downloadPng}
        </button>
      </div>
      <p role="status" aria-live="polite" className="min-h-4 text-[11px]">
        {status === "working" && (
          <span className="text-subtle">{k.working}</span>
        )}
        {status === "failed" && <span className="text-bad">{k.failed}</span>}
      </p>
    </section>
  );
}
