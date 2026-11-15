"use client";

import { useMemo, useState } from "react";
import {
  FORMAT_INFO,
  profileFilename,
  renderProfile,
  type ProfileExportInput,
  type ProfileFormat,
} from "@/lib/profileExport";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";

/** Formatene i grupper, så det er lett å finne riktig. */
const GRUPPER: {
  key: "web" | "design" | "apps" | "data";
  formats: ProfileFormat[];
}[] = [
  { key: "web", formats: ["css", "scss", "tailwind"] },
  { key: "design", formats: ["figma", "tokens"] },
  { key: "apps", formats: ["swift", "flutter", "android"] },
  { key: "data", formats: ["profile"] },
];

/**
 * Eksport av profilen: ett format om gangen, med kode, kopier og last ned.
 * Formatene er vanlige knapper (aria-pressed) i grupper med navn, så de er
 * lette å nå med tastatur og skjermleser.
 */
export function ProfileExport({ input }: { input: ProfileExportInput }) {
  const { t } = useI18n();
  const p = t.profile;
  const [format, setFormat] = useState<ProfileFormat>("css");
  const [status, setStatus] = useState<"" | "copied" | "failed">("");
  const kode = useMemo(() => renderProfile(format, input), [format, input]);
  const filnavn = profileFilename(input.title, format);

  const velg = (f: ProfileFormat) => {
    setFormat(f);
    setStatus("");
  };

  const kopier = async () => {
    try {
      await navigator.clipboard.writeText(kode);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    setTimeout(() => setStatus(""), 2000);
  };

  // Filen lages i nettleseren. Ingenting sendes noe sted.
  const lastNed = () => {
    const url = URL.createObjectURL(
      new Blob([kode], { type: FORMAT_INFO[format].mime }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filnavn;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {GRUPPER.map((g) => (
          <div
            key={g.key}
            role="group"
            aria-labelledby={`eksport-gruppe-${g.key}`}
            className="space-y-1"
          >
            <p
              id={`eksport-gruppe-${g.key}`}
              className="text-[11px] font-semibold uppercase tracking-widest text-subtle"
            >
              {p.exportGroups[g.key]}
            </p>
            <div className="flex flex-wrap gap-1">
              {g.formats.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={format === f}
                  aria-controls="eksport-kode"
                  onClick={() => velg(f)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    format === f
                      ? "bg-ink text-paper"
                      : "bg-sunken text-subtle hover:bg-line hover:text-ink",
                  )}
                >
                  {FORMAT_INFO[f].label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div id="eksport-kode" className="space-y-2">
        <p className="text-sm">{p.exportHints[format]}</p>
        <pre
          tabIndex={0}
          aria-label={`${p.export}: ${FORMAT_INFO[format].label}`}
          className="max-h-80 overflow-auto rounded-lg bg-sunken p-3 font-mono text-[11px] leading-relaxed text-ink"
        >
          <code>{kode}</code>
        </pre>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={kopier}
            className={btn("primary", "sm")}
          >
            {status === "copied"
              ? t.export.copied
              : status === "failed"
                ? t.export.failed
                : t.export.copy}
          </button>
          <button
            type="button"
            onClick={lastNed}
            className={btn("outline", "sm")}
          >
            {t.export.download}
          </button>
          <span className="truncate font-mono text-[11px] text-subtle">
            {filnavn}
          </span>
        </div>
      </div>
    </div>
  );
}
