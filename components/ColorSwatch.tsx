"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";

interface ColorSwatchProps {
  label: string;
  color: string;
  size?: "sm" | "md" | "lg";
  /** «row»: liten prøve til venstre og hele navnet ved siden av. */
  layout?: "grid" | "row";
}

/** En fargeprøve som kopierer HEX-verdien ved klikk. */
export function ColorSwatch({
  label,
  color,
  size = "md",
  layout = "grid",
}: ColorSwatchProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(color);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Utklippstavlen kan være sperret. Verdien står uansett under prøven.
    }
  };

  const sizeClasses = {
    sm: "h-12 w-full",
    md: "h-16 w-full",
    lg: "h-20 w-full",
  };

  if (layout === "row") {
    // Hele raden kopierer HEX. Navnet får plass i stedet for å kuttes.
    return (
      <button
        type="button"
        onClick={copyToClipboard}
        aria-label={`${t.export.copy} ${label} ${color}`}
        className="flex w-full min-w-0 items-center gap-3 rounded-xl p-1 text-left hover:bg-sunken"
      >
        <span
          className="relative h-11 w-11 shrink-0 rounded-lg border border-line"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-snug font-medium text-ink">
            {label}
          </span>
          <span className="block font-mono text-[11px] text-subtle">
            {copied ? t.details.copied : color}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="group min-w-0">
      <button
        type="button"
        onClick={copyToClipboard}
        aria-label={`${t.export.copy} ${label} ${color}`}
        className={cn(
          "relative block rounded-xl border border-line transition-transform duration-200 hover:scale-[1.04]",
          sizeClasses[size],
        )}
        style={{ backgroundColor: color }}
      >
        {copied && (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-ink/70 text-xs font-semibold text-paper">
            {t.details.copied}
          </span>
        )}
      </button>
      <p className="mt-1.5 truncate text-xs font-medium text-ink" title={label}>
        {label}
      </p>
      <p className="truncate font-mono text-[11px] text-subtle">{color}</p>
    </div>
  );
}
