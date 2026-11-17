"use client";

import { colorPalettes } from "@/data/palettes";
import { localizePalette, toolPath, type Locale } from "@/lib/i18n";
import { personvernPath } from "@/lib/accountPaths";
import { profilePath } from "@/lib/profile";
import { sitePath } from "@/lib/site";
import { btn, panel } from "@/lib/ui";
import { I18nProvider, useI18n } from "@/components/I18nProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { EksempelSide } from "@/components/SitePage";

/** Eksempelpaletten på forsiden og i «Se et eksempel». */
const EKSEMPEL = "havet";

/**
 * Forsiden: hva ColorCraft er, slik det virker, og veien inn i verktøyet.
 * Verktøyet ligger på /verktoy. Gamle delte lenker til forsiden sendes dit
 * av et skript i siden (se `LEGACY_REDIRECT_SCRIPT`).
 */
export function LandingPage({ locale }: { locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <Forside locale={locale} />
    </I18nProvider>
  );
}

function Forside({ locale }: { locale: Locale }) {
  const { t } = useI18n();
  const l = t.landing;
  const havet = localizePalette(
    colorPalettes.find((p) => p.id === EKSEMPEL)!,
    locale,
  );
  const eksempel = `${sitePath(locale)}#p=${EKSEMPEL}`;
  const visninger = [
    `${toolPath(locale)}#p=${EKSEMPEL}`,
    eksempel,
    `${profilePath(locale)}#p=${EKSEMPEL}`,
  ];
  const fanFarger = [
    havet.colors.primary,
    havet.colors.accent,
    havet.colors.secondary,
    havet.colors.warm,
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader active="home" fanColors={fanFarger} />

      <main className="mx-auto max-w-6xl space-y-20 px-4 py-12 sm:px-6 sm:py-16">
        {/* Forsiden */}
        <section className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <p className="text-sm font-semibold tracking-widest text-accent uppercase">
              {l.kicker}
            </p>
            <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
              {l.title}
            </h1>
            <p className="max-w-xl text-lg text-subtle">{l.lead}</p>
            <div className="flex flex-wrap gap-3">
              <a href={toolPath(locale)} className={btn("primary", "md")}>
                {l.openTool}
              </a>
              <a href={eksempel} className={btn("outline", "md")}>
                {l.example}
              </a>
            </div>
            <p className="text-sm text-subtle">{l.note}</p>
          </div>
          {/* Et levende eksempel, skalert ned. Det er bare til å se på. */}
          <a
            href={eksempel}
            aria-label={l.previewLabel}
            className="block overflow-hidden rounded-2xl border border-line shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <div
              aria-hidden="true"
              inert
              className="pointer-events-none max-h-[54rem] overflow-hidden select-none"
              style={{ zoom: 0.5 }}
            >
              <EksempelSide
                palette={havet}
                navn={havet.name}
                brand={false}
                fonter={{}}
              />
            </div>
          </a>
        </section>

        {/* Slik virker det */}
        <section aria-labelledby="slik" className="space-y-6">
          <h2
            id="slik"
            className="font-display text-3xl font-bold tracking-tight"
          >
            {l.stepsTitle}
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {l.steps.map(([tittel, tekst], i) => (
              <li key={tittel} className={`${panel} space-y-2 p-5`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-display font-bold text-paper">
                  {i + 1}
                </span>
                <h3 className="font-display text-lg font-bold">{tittel}</h3>
                <p className="text-sm text-subtle">{tekst}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Tre sider */}
        <section aria-labelledby="sider" className="space-y-6">
          <h2
            id="sider"
            className="font-display text-3xl font-bold tracking-tight"
          >
            {l.viewsTitle}
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {l.views.map(([tittel, tekst], i) => (
              <li key={tittel}>
                <a
                  href={visninger[i]}
                  className={`${panel} block h-full space-y-2 p-5 transition-colors hover:border-ink`}
                >
                  <h3 className="font-display text-lg font-bold">{tittel} →</h3>
                  <p className="text-sm text-subtle">{tekst}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* For designere og utviklere */}
        <section aria-labelledby="for" className="space-y-6">
          <h2
            id="for"
            className="font-display text-3xl font-bold tracking-tight"
          >
            {l.forTitle}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                [l.designers, l.designerPoints],
                [l.developers, l.developerPoints],
              ] as const
            ).map(([tittel, punkter]) => (
              <div key={tittel} className={`${panel} space-y-3 p-5`}>
                <h3 className="font-display text-lg font-bold">{tittel}</h3>
                <ul className="space-y-2 text-sm">
                  {punkter.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-sm text-subtle">{l.switchNote}</p>
        </section>

        {/* Personvern */}
        <section
          aria-labelledby="personvern"
          className={`${panel} space-y-3 p-6 sm:p-8`}
        >
          <h2
            id="personvern"
            className="font-display text-2xl font-bold tracking-tight"
          >
            {l.privacyTitle}
          </h2>
          <p className="max-w-2xl text-subtle">{l.privacyText}</p>
          <a
            href={personvernPath(locale)}
            className="inline-block text-sm font-medium underline underline-offset-4 hover:text-accent"
          >
            {l.privacyLink}
          </a>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <a href={toolPath(locale)} className={btn("primary", "md")}>
            {l.openTool}
          </a>
          <a href={eksempel} className={btn("outline", "md")}>
            {l.example}
          </a>
        </div>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 pb-10 text-sm text-subtle sm:px-6">
        <span>
          {l.madeBy}{" "}
          <a
            href="https://www.borresendigital.no"
            className="font-medium text-ink underline underline-offset-4 hover:text-accent"
          >
            Børresen Digital
          </a>
        </span>
        <a
          href="/llms.txt"
          className="underline underline-offset-4 hover:text-ink"
        >
          {l.forAi}
        </a>
      </footer>
    </div>
  );
}
