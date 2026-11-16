"use client";

import { useEffect, useState } from "react";
import { colorPalettes, type ExtendedColorPalette } from "@/data/palettes";
import { localePath, localizePalette, type Locale } from "@/lib/i18n";
import { checkPalette, headingColor, textOn } from "@/lib/contrastPairs";
import { decodeShare, encodeShare } from "@/lib/share";
import { profilePath } from "@/lib/profile";
import {
  editPalette,
  SITE_ROLES,
  sitePath,
  withPalette,
  type BrandList,
  type SiteEdit,
} from "@/lib/site";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { I18nProvider, useI18n } from "@/components/I18nProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { FanMark } from "@/components/FanMark";
import { SimpleToggle, useSimple } from "@/components/SimpleMode";
import { ViewSwitch } from "@/components/ViewSwitch";
import type { ColorPalette } from "@/types/palette";

interface Farge {
  key: string;
  label: string;
  hex: string;
  edit: (hex: string) => SiteEdit;
}

/**
 * Paletten på en hel nettside, med fargene i en linje nederst. Et klikk på
 * en farge åpner fargevelgeren, og siden endres mens du velger. En palett
 * fra en profilmanual regnes ut på nytt fra merkefargene, så resten følger
 * med, som i «Fra profilmanual». Endringene skrives til lenken, så de kan
 * tas med til verktøyet og profilsiden.
 */
export function SitePage({ locale }: { locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <Nettside locale={locale} />
    </I18nProvider>
  );
}

function Nettside({ locale }: { locale: Locale }) {
  const { t } = useI18n();
  const { simple } = useSimple();
  const s = t.site;
  // null til fragmentet er lest. Det finnes bare i nettleseren.
  const [hash, setHash] = useState<string | null>(null);
  const [start, setStart] = useState<ExtendedColorPalette | null>(null);
  const [palette, setPalette] = useState<ExtendedColorPalette | null>(null);
  const [mørk, setMørk] = useState(false);

  useEffect(() => {
    const les = () => {
      const h = window.location.hash.replace(/^#/, "");
      const delt = h ? decodeShare(h, t.palette) : null;
      let p: ExtendedColorPalette | null = null;
      if (delt?.kind === "builtin") {
        const innebygd = colorPalettes.find((x) => x.id === delt.id);
        p = innebygd ? localizePalette(innebygd, locale) : null;
      } else if (delt?.kind === "custom") {
        p = delt.palette;
      }
      setHash(h);
      setStart(p);
      setPalette(p);
      setMørk(!!delt?.dark);
    };
    les();
    window.addEventListener("hashchange", les);
    return () => window.removeEventListener("hashchange", les);
  }, [locale, t.palette]);

  if (hash === null) return <div className="min-h-screen bg-paper" />;

  if (!palette || !start) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-4 px-4 py-12">
        <FanMark />
        <h1 className="font-display text-2xl font-bold">{s.empty}</h1>
        <p className="text-subtle">{s.emptyHelp}</p>
        <a href={localePath(locale)} className={btn("primary", "md")}>
          {s.openTool}
        </a>
      </main>
    );
  }

  // Designerne ser bare lys modus, som i verktøyet.
  const visMørk = mørk && !simple && !!palette.darkVariant;
  const variant: ColorPalette = visMørk ? palette.darkVariant! : palette;
  const brand = palette.brand;

  const endre = (edit: SiteEdit) => {
    const ny = editPalette(palette, edit, visMørk);
    if (ny === palette) return;
    setPalette(ny);
    const h = withPalette(hash, encodeShare(ny, visMørk));
    setHash(h);
    // replaceState, så tilbakeknappen ikke går gjennom hver farge.
    window.history.replaceState(null, "", `#${h}`);
  };
  const angre = () => {
    setPalette(start);
    const h = withPalette(hash, encodeShare(start, visMørk));
    setHash(h);
    window.history.replaceState(null, "", `#${h}`);
  };

  // Fargene i linjen: merkefargene for en palett fra en manual, ellers de
  // fem rollene som bestemmer mest av siden.
  const farger: Farge[] = brand
    ? (
        [
          ["logo", brand.logo, t.tones.logo],
          ["support", brand.support, t.tones.support],
          ["highlight", brand.highlight ?? [], t.tones.highlight],
        ] as const
      ).flatMap(([list, hexer, standard]) =>
        hexer.map((hex, i) => ({
          key: `${list}-${i}`,
          label:
            brand.names?.[hex] ??
            brand.names?.[hex.toUpperCase()] ??
            standard(i + 1),
          hex,
          edit: (ny: string) => ({
            kind: "brand" as const,
            list: list as BrandList,
            index: i,
            hex: ny,
          }),
        })),
      )
    : SITE_ROLES.map((role) => ({
        key: role,
        label: s.roles[role],
        hex: variant.colors[role],
        edit: (ny: string) => ({ kind: "role" as const, role, hex: ny }),
      }));

  const svake = checkPalette(variant, { brand: !!brand }).filter(
    (r) => r.level === "fail",
  ).length;
  const status = simple
    ? svake === 0
      ? t.contrast.allPassPlain
      : t.contrast.belowPlain(svake)
    : svake === 0
      ? t.contrast.allPass
      : t.contrast.below(svake);
  const endret = encodeShare(palette, false) !== encodeShare(start, false);

  return (
    <div className="min-h-screen bg-paper pb-32 text-ink sm:pb-40">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <a
            href={localePath(locale)}
            className="flex items-center gap-2 rounded-lg"
          >
            <FanMark size={28} />
            <span className="font-display text-lg font-extrabold tracking-tight">
              Color<span className="font-semibold text-subtle">Craft</span>
            </span>
          </a>
          <ViewSwitch
            active="site"
            toolHref={`${localePath(locale)}#${hash}`}
            siteHref={`${sitePath(locale)}#${hash}`}
            profileHref={`${profilePath(locale)}#${hash}`}
            className="mr-auto"
          />
          {!simple && palette.darkVariant && (
            <div
              role="group"
              aria-label={t.app.paletteMode}
              className="flex rounded-full border border-line bg-sunken p-0.5"
            >
              {(
                [
                  [false, t.app.light],
                  [true, t.app.dark],
                ] as const
              ).map(([m, navn]) => (
                <button
                  key={navn}
                  type="button"
                  aria-pressed={visMørk === m}
                  onClick={() => setMørk(m)}
                  className={
                    visMørk === m
                      ? "rounded-full bg-panel px-3 py-1 text-xs font-semibold text-ink shadow-sm"
                      : "rounded-full px-3 py-1 text-xs font-medium text-subtle hover:text-ink"
                  }
                >
                  {navn}
                </button>
              ))}
            </div>
          )}
          <SimpleToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <EksempelSide palette={variant} navn={palette.name} brand={!!brand} />
      </main>

      <aside
        aria-label={s.toolbar}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate font-display font-bold">{palette.name}</p>
            <p
              className={cn(
                "text-xs font-medium",
                svake === 0 ? "text-ok" : "text-warn",
              )}
              role="status"
            >
              {status}
            </p>
          </div>
          <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible">
            {farger.map((f) => (
              <li key={f.key}>
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-line p-1 hover:bg-sunken sm:px-2 sm:py-1.5"
                  title={s.pick(f.label)}
                >
                  <span
                    className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-line"
                    style={{ backgroundColor: f.hex }}
                  >
                    <input
                      type="color"
                      value={f.hex.toLowerCase()}
                      onChange={(e) => endre(f.edit(e.target.value))}
                      aria-label={`${s.pick(f.label)}: ${f.hex}`}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <span className="block max-w-36 truncate text-xs font-medium">
                      {f.label}
                    </span>
                    <span className="block font-mono text-[11px] text-subtle">
                      {f.hex.toUpperCase()}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {endret && (
            <button
              type="button"
              onClick={angre}
              className={btn("ghost", "sm")}
            >
              {s.undo}
            </button>
          )}
          <p className="hidden w-full text-[11px] text-subtle sm:block">
            {s.help}
          </p>
        </div>
      </aside>
    </div>
  );
}

/**
 * En tenkt nettside i paletten: meny, forside, fordeler på flatefargen,
 * tjenester på kort, et sitat på hovedfargen, kontaktskjema og bunntekst.
 * Fargene settes direkte fra rollene, så siden viser nøyaktig paletten.
 */
function EksempelSide({
  palette,
  navn,
  brand,
}: {
  palette: ColorPalette;
  navn: string;
  brand: boolean;
}) {
  const { t } = useI18n();
  const s = t.site;
  const c = palette.colors;
  const overskrift = headingColor(palette, brand);
  const påHoved = textOn(palette, c.primary);
  const påUtheving = textOn(palette, c.accent);
  const påFlate = textOn(palette, c.secondary);
  const felt =
    "mt-1 block w-full rounded-lg border px-3 py-2 text-sm outline-none";

  return (
    <div
      className="overflow-hidden rounded-2xl border border-line shadow-sm"
      style={{ backgroundColor: c.background, color: c.foreground }}
    >
      {/* Meny */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-6 py-4"
        style={{ borderColor: c.border }}
      >
        <BrandLogo bg={c.background} inColor size="md">
          <span
            className="font-display text-xl font-extrabold"
            style={{ color: overskrift }}
          >
            {navn}
          </span>
        </BrandLogo>
        <nav className="mr-auto flex flex-wrap gap-4 text-sm font-medium">
          {s.nav.map((n, i) => (
            <span key={n} style={{ color: i === 0 ? c.primary : c.muted }}>
              {n}
            </span>
          ))}
        </nav>
        <span
          className="rounded-full px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: c.accent, color: påUtheving }}
        >
          {s.cta}
        </span>
      </div>

      {/* Forside */}
      <section className="grid gap-8 px-6 py-12 md:grid-cols-[1.4fr_1fr] md:items-center md:py-16">
        <div className="space-y-5">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: c.secondary, color: påFlate }}
          >
            {s.heroKicker}
          </span>
          <h1
            className="font-display text-4xl leading-tight font-extrabold tracking-tight md:text-5xl"
            style={{ color: overskrift }}
          >
            {s.heroTitle}
          </h1>
          <p className="max-w-xl text-lg" style={{ color: c.muted }}>
            {s.heroText}
          </p>
          <div className="flex flex-wrap gap-3">
            <span
              className="rounded-lg px-5 py-3 font-semibold"
              style={{ backgroundColor: c.primary, color: påHoved }}
            >
              {s.heroPrimary}
            </span>
            <span
              className="rounded-lg border-2 px-5 py-3 font-semibold"
              style={{ borderColor: c.primary, color: overskrift }}
            >
              {s.heroSecondary}
            </span>
          </div>
        </div>
        <div
          className="space-y-3 rounded-2xl border p-6"
          style={{ backgroundColor: c.surface, borderColor: c.border }}
        >
          <div className="flex h-28 gap-2" aria-hidden="true">
            {[c.primary, c.secondary, c.accent].map((f, i) => (
              <span
                key={i}
                className="flex-1 rounded-xl"
                style={{ backgroundColor: f }}
              />
            ))}
          </div>
          <p
            className="font-display text-4xl font-extrabold"
            style={{ color: overskrift }}
          >
            {s.statValue}
            <span style={{ color: c.accent }}> ★</span>
          </p>
          <p className="text-sm" style={{ color: c.muted }}>
            {s.statLabel}
          </p>
        </div>
      </section>

      {/* Fordeler på flatefargen */}
      <section
        className="px-6 py-12"
        style={{ backgroundColor: c.secondary, color: påFlate }}
      >
        <h2 className="mb-6 font-display text-2xl font-bold">
          {s.featuresTitle}
        </h2>
        <ul className="grid gap-6 md:grid-cols-3">
          {s.features.map(([tittel, tekst]) => (
            <li key={tittel} className="space-y-2">
              <span
                className="block h-2 w-10 rounded-full"
                style={{ backgroundColor: c.accent }}
                aria-hidden="true"
              />
              <h3 className="font-semibold">{tittel}</h3>
              <p className="text-sm opacity-85">{tekst}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Tjenester på kort */}
      <section className="px-6 py-12">
        <h2
          className="mb-6 font-display text-2xl font-bold"
          style={{ color: overskrift }}
        >
          {s.servicesTitle}
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {s.services.map(([tittel, tekst, merke]) => (
            <li
              key={tittel}
              className="space-y-3 rounded-2xl border p-5"
              style={{ backgroundColor: c.surface, borderColor: c.border }}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{tittel}</h3>
                {merke && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: c.accent, color: påUtheving }}
                  >
                    {merke}
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: c.muted }}>
                {tekst}
              </p>
              <span
                className="inline-block text-sm font-semibold underline underline-offset-4"
                style={{ color: overskrift }}
              >
                {s.readMore} →
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Sitat på hovedfargen */}
      <section
        className="px-6 py-12 text-center"
        style={{ backgroundColor: c.primary, color: påHoved }}
      >
        <p className="mx-auto max-w-2xl font-display text-2xl leading-snug font-bold">
          {s.quote}
        </p>
        <p className="mt-3 text-sm opacity-85">{s.quoteBy}</p>
      </section>

      {/* Kontakt */}
      <section className="grid gap-6 px-6 py-12 md:grid-cols-2">
        <div className="space-y-2">
          <h2
            className="font-display text-2xl font-bold"
            style={{ color: overskrift }}
          >
            {s.contactTitle}
          </h2>
          <p style={{ color: c.muted }}>{s.contactText}</p>
        </div>
        <form
          className="space-y-3 rounded-2xl border p-5"
          style={{ backgroundColor: c.surface, borderColor: c.border }}
          onSubmit={(e) => e.preventDefault()}
          aria-describedby="eksempel-skjema"
        >
          {(
            [
              [s.nameLabel, "text"],
              [s.emailLabel, "email"],
            ] as const
          ).map(([etikett, type]) => (
            <label key={etikett} className="block text-sm font-medium">
              {etikett}
              <input
                type={type}
                tabIndex={-1}
                readOnly
                className={felt}
                style={{
                  backgroundColor: c.background,
                  borderColor: c.border,
                  color: c.foreground,
                }}
              />
            </label>
          ))}
          <label className="block text-sm font-medium">
            {s.messageLabel}
            <textarea
              rows={3}
              tabIndex={-1}
              readOnly
              className={felt}
              style={{
                backgroundColor: c.background,
                borderColor: c.border,
                color: c.foreground,
              }}
            />
          </label>
          <span
            className="inline-block rounded-lg px-5 py-2.5 font-semibold"
            style={{ backgroundColor: c.primary, color: påHoved }}
          >
            {s.send}
          </span>
          <p
            id="eksempel-skjema"
            className="text-xs"
            style={{ color: c.muted }}
          >
            {s.sendNote}
          </p>
        </form>
      </section>

      {/* Bunntekst */}
      <footer
        className="flex flex-wrap justify-between gap-2 px-6 py-6 text-sm"
        style={{ backgroundColor: c.foreground, color: c.background }}
      >
        <span className="font-semibold">{navn}</span>
        <span className="opacity-80">{s.footer}</span>
      </footer>
    </div>
  );
}
