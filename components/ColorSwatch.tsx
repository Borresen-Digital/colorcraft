"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";

interface ColorSwatchProps {
  label: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

/** En fargeprøve som kopierer HEX-verdien ved klikk. */
export function ColorSwatch({ label, color, size = "md" }: ColorSwatchProps) {
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
      <p className="mt-1.5 truncate text-xs font-medium text-ink">{label}</p>
      <p className="truncate font-mono text-[11px] text-subtle">{color}</p>
    </div>
  );
}
