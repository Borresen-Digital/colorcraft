"use client";

import { useI18n } from "@/components/I18nProvider";

/**
 * Ordlisten: hva fargene heter i ColorCraft, hva andre kaller dem, og hva de
 * brukes til. Designere bruker ulike ord om det samme (grunnfarge, støttefarge,
 * tilleggsfarge, aksent …), så verktøyet navngir fargene etter jobben de gjør
 * og viser de andre ordene ved siden av.
 */
export function Glossary({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const g = t.glossary;
  return (
    <details className={`rounded-lg border border-line ${className}`}>
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-ink">
        {g.title}
      </summary>
      <div className="space-y-2 border-t border-line px-3 py-3 text-xs">
        <p className="text-subtle">{g.intro}</p>
        <dl className="divide-y divide-line">
          {g.rows.map((r) => (
            <div key={r.term} className="py-1.5">
              <dt className="font-semibold text-ink">{r.term}</dt>
              <dd className="text-ink">{r.use}</dd>
              {r.aka && (
                <dd className="text-subtle">
                  {g.aka}: {r.aka}
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </details>
  );
}
