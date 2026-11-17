"use client";

import { useEffect, useRef, useState } from "react";
import { colorPalettes, type ExtendedColorPalette } from "@/data/palettes";
import { formatCmyk } from "@/lib/cmyk";
import { contrastLevel, contrastRatio, formatRatio } from "@/lib/contrast";
import {
  localePath,
  localizePalette,
  localizeRatio,
  toolPath,
} from "@/lib/i18n";
import {
  buildProfile,
  cleanRule,
  MAX_RULE,
  readMaker,
  readRules,
  ruleLines,
  withMaker,
  isReadonlyLink,
  withReadonly,
  withoutMaker,
  withoutRules,
  withRule,
  type ProfileColor,
  type ProfileSection,
  type RuleKey,
  type Rules,
} from "@/lib/profile";
import { decodeShare } from "@/lib/share";
import { toneCss, toneScale } from "@/lib/toneScale";
import {
  cleanPantone,
  pantoneKey,
  readPantone,
  withoutPantone,
  withPantone,
  type PantoneMap,
} from "@/lib/pantone";
import { ProfileExport } from "@/components/ProfileExport";
import { SectionNav, type NavItem } from "@/components/SectionNav";
import { SimpleToggle, useSimple } from "@/components/SimpleMode";
import { SiteHeader } from "@/components/SiteHeader";
import { SaveToAccount } from "@/components/SaveToAccount";
import { withSaved, withoutSaved } from "@/lib/savedProfiles";
import type { ProfileExportInput } from "@/lib/profileExport";
import {
  filterMatrix,
  similarPairs,
  simulate,
  VISIONS,
  type Vision,
} from "@/lib/colorblind";
import {
  cleanFont,
  cleanType,
  fontStack,
  MAX_TYPES,
  readTypography,
  WEIGHTS,
  withoutTypography,
  withTypography,
  type TypeSpec,
} from "@/lib/typography";
import {
  decodeLogo,
  encodeLogo,
  readLogoParam,
  withLogo,
} from "@/lib/logoLink";
import { btn, field, panel } from "@/lib/ui";
import { BrandLogo, LogoUpload, useLogos } from "@/components/BrandLogo";
import { ColorCardPanel } from "@/components/ColorCardPanel";
import { FanMark } from "@/components/FanMark";
import { I18nProvider, useI18n } from "@/components/I18nProvider";
import { InUsePreview } from "@/components/InUsePreview";
import { SurfacesPreview } from "@/components/SurfacesPreview";
import type { Locale } from "@/lib/i18n";

/**
 * Profilsiden: fargeprofilen som en ren side designeren kan sende til
 * kunden. Paletten kommer fra fragmentet i adressen, som i verktøyet, så
 * ingenting lagres eller sendes. Siden viser alltid lys modus: fargene slik
 * de står i manualen.
 */
/**
 * `initialHash`: profilen kommer fra serveren (den korte lenken /p/…) i
 * stedet for fra adressen. `readonly`: kunden ser profilen uten knappene
 * for å redigere den.
 */
export function ProfilePage({
  locale,
  initialHash,
  readonly = false,
}: {
  locale: Locale;
  initialHash?: string;
  readonly?: boolean;
}) {
  return (
    <I18nProvider locale={locale}>
      <Profile initialHash={initialHash} readonly={readonly} />
    </I18nProvider>
  );
}

function useCopy() {
  const [kopiert, setKopiert] = useState<string | null>(null);
  const kopier = async (verdi: string) => {
    try {
      await navigator.clipboard.writeText(verdi);
      setKopiert(verdi);
      setTimeout(() => setKopiert((k) => (k === verdi ? null : k)), 1500);
    } catch {
      setKopiert(null);
    }
  };
  return { kopiert, kopier };
}

/** Høyden en bildefil gjøres om til før den legges i lenken. */
const LENKE_HØYDE = 240;

/**
 * En bildefil som en liten WebP (eller PNG der nettleseren ikke lager WebP),
 * så den får plass i lenken. Tegnes i nettleseren, ingenting sendes.
 */
async function småBilde(blob: Blob): Promise<Blob | null> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const nh = img.naturalHeight || LENKE_HØYDE;
    const nw = img.naturalWidth || nh * 3;
    const h = Math.min(LENKE_HØYDE, nh);
    const w = Math.max(1, Math.round((nw * h) / nh));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")?.drawImage(img, 0, 0, w, h);
    const lag = (type: string, q?: number) =>
      new Promise<Blob | null>((r) => c.toBlob(r, type, q));
    const webp = await lag("image/webp", 0.85);
    if (webp?.type === "image/webp") return webp;
    return await lag("image/png");
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function logoTilLenke(blob: Blob): Promise<string | null> {
  if (blob.type === "image/svg+xml") {
    const svg = await encodeLogo(
      new Uint8Array(await blob.arrayBuffer()),
      blob.type,
    );
    if (svg) return svg;
  }
  const liten = await småBilde(blob);
  if (!liten) return null;
  return encodeLogo(new Uint8Array(await liten.arrayBuffer()), liten.type);
}

type LogoILenke =
  | { status: "none" }
  | { status: "working" }
  | { status: "ok"; verdi: string }
  | { status: "too-big" };

/**
 * Logoen i lenken, begge veier: en logo i lenken lastes inn som
 * fargeversjonen, og fargeversjonen som er lastet opp, gjøres klar til
 * lenken, så «Kopier lenke» ikke trenger å vente.
 */
function useLogoILenke(hash: string | null): LogoILenke {
  const { files, set } = useLogos();
  const lest = useRef<string | null>(null);
  const [klar, setKlar] = useState<LogoILenke>({ status: "none" });

  useEffect(() => {
    const verdi = hash ? readLogoParam(hash) : null;
    if (!verdi || verdi === lest.current) return;
    lest.current = verdi;
    let avbrutt = false;
    decodeLogo(verdi).then((logo) => {
      if (avbrutt || !logo) return;
      const ext = logo.mime.split("/")[1].replace("svg+xml", "svg");
      set(
        "color",
        new File([logo.bytes as BlobPart], `logo.${ext}`, { type: logo.mime }),
      );
    });
    return () => {
      avbrutt = true;
    };
  }, [hash, set]);

  const fil = files.color;
  useEffect(() => {
    let avbrutt = false;
    if (!fil) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKlar({ status: "none" });
      return;
    }
    setKlar({ status: "working" });
    logoTilLenke(fil).then((verdi) => {
      if (avbrutt) return;
      setKlar(verdi ? { status: "ok", verdi } : { status: "too-big" });
    });
    return () => {
      avbrutt = true;
    };
  }, [fil]);

  return klar;
}

function Profile({
  initialHash,
  readonly,
}: {
  initialHash?: string;
  readonly: boolean;
}) {
  const { locale, t } = useI18n();
  // «For designere / For utviklere»: utviklerne får tonetrappen og filene.
  const { simple } = useSimple();
  const p = t.profile;
  // null til fragmentet er lest. Det finnes bare i nettleseren.
  const [hash, setHash] = useState<string | null>(null);
  const [maker, setMaker] = useState("");
  const [regler, setRegler] = useState<Rules>({});
  const [typo, setTypo] = useState<TypeSpec[]>([]);
  const [pantone, setPantone] = useState<PantoneMap>({});
  const [syn, setSyn] = useState<Vision | "normal">("normal");
  const [lenke, setLenke] = useState<"" | "copied" | "failed">("");
  const [medLogo, setMedLogo] = useState(true);
  const logoLenke = useLogoILenke(hash);

  useEffect(() => {
    const les = () => {
      const h = initialHash ?? window.location.hash.replace(/^#/, "");
      setHash(h);
      setMaker(readMaker(h));
      setRegler(readRules(h));
      setTypo(readTypography(h));
      setPantone(readPantone(h));
    };
    les();
    // En lagret profil kommer fra serveren og endres ikke av adressen.
    if (initialHash !== undefined) return;
    window.addEventListener("hashchange", les);
    return () => window.removeEventListener("hashchange", les);
  }, [initialHash]);

  // Profilen er et dokument til kunden, og vises alltid på lyst papir,
  // uansett hva rammen er satt til. Valget i verktøyet settes tilbake når
  // du går dit igjen.
  useEffect(() => {
    const html = document.documentElement;
    const før = html.getAttribute("data-theme");
    html.setAttribute("data-theme", "light");
    return () => {
      if (før) html.setAttribute("data-theme", før);
      else html.removeAttribute("data-theme");
    };
  }, []);

  if (hash === null) return <div className="min-h-screen bg-paper" />;

  const delt = hash ? decodeShare(hash, t.palette) : null;
  let palette: ExtendedColorPalette | undefined;
  if (delt?.kind === "builtin") {
    const innebygd = colorPalettes.find((x) => x.id === delt.id);
    palette = innebygd && localizePalette(innebygd, locale);
  } else if (delt?.kind === "custom") {
    palette = delt.palette;
  }

  if (!palette) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-4 px-4 py-12">
        <FanMark />
        <h1 className="font-display text-2xl font-bold">{p.empty}</h1>
        <p className="text-subtle">{p.emptyHelp}</p>
        <a href={toolPath(locale)} className={btn("primary", "md")}>
          {p.openTool}
        </a>
      </main>
    );
  }

  const profil = buildProfile(palette, locale);
  const navn = maker.trim();
  // Kundens visning: fra en kort lenke, eller fra «Kopier lenke til kunden».
  const kunde = readonly || isReadonlyLink(hash);
  const utvikler = !simple;
  // Fragmentet designeren jobber med, uten merket for kundens visning.
  const egen = withReadonly(withoutSaved(hash), false);
  // Verktøyet leser ikke logoen fra lenken. Den følger med i nettleseren.
  const tilVerktøy = `${toolPath(locale)}#${withLogo(withoutPantone(withoutTypography(withoutRules(withoutMaker(egen)))), null)}`;
  const farger = profil.sections.flatMap((s) => s.colors.map((c) => c.hex));
  // Tonetrappen og Figma-filen: merkefargene uten intern profil, og for en
  // palett uten profil bare hovedfarge, uthevingsfarge og flatefarge.
  const tonefarger = profil.sections.flatMap((s) =>
    s.kind === "internal"
      ? []
      : (s.kind === "main" ? s.colors.slice(0, 3) : s.colors).map((c) => ({
          label: c.label,
          hex: c.hex,
        })),
  );
  const unikeTonefarger = tonefarger.filter(
    (f, i) => tonefarger.findIndex((g) => g.hex === f.hex) === i,
  );

  // Alt eksporten trenger. Lenken er uten logoen, så den holder seg kort.
  const eksport: ProfileExportInput = {
    title: profil.title,
    credit: `${p.madeWith} (farger.borresendigital.no)`,
    maker: navn || undefined,
    colors: profil.sections.flatMap((s) =>
      s.colors.map((c) => ({
        group: s.heading,
        role: s.kind,
        label: c.label,
        hex: c.hex,
        cmyk: c.cmyk,
        cmykNumbers: c.cmykValue
          ? formatCmyk(c.cmykValue)
          : c.cmyk.slice(t.card.approx.length + 1),
        cmykFromManual: c.cmykFromManual,
        pantone: cleanPantone(pantone[pantoneKey(c.hex)]) || undefined,
      })),
    ),
    tones: unikeTonefarger.map((f) => ({
      label: f.label,
      scale: toneScale(f.hex),
    })),
    typography: typo.map(cleanType),
    rules: [
      ...profil.sections.map((s) => ({
        group: s.heading,
        role: s.kind,
        text: cleanRule(regler[s.kind]),
      })),
      {
        group: p.rules,
        role: "general" as const,
        text: cleanRule(regler.general),
      },
    ],
    direction: palette.brand?.direction,
    link: `${window.location.origin}${window.location.pathname}#${withLogo(hash, null)}`,
    figmaNames: p.figmaNames,
  };

  // Menyen følger rekkefølgen på siden. Typografi og bruksregler er bare
  // med når de har innhold.
  const navItems: NavItem[] = [
    { id: "profil-farger", label: p.navColors },
    ...(utvikler && unikeTonefarger.length > 0
      ? [{ id: "profil-toner", label: p.tones }]
      : []),
    ...(typo.some((x) => cleanFont(x.font))
      ? [{ id: "profil-typografi", label: p.type }]
      : []),
    ...(cleanRule(regler.general)
      ? [{ id: "profil-regler", label: p.rules }]
      : []),
    { id: "profil-ibruk", label: p.navInUse },
    { id: "profil-kontrast", label: p.navContrast },
    { id: "profil-fargeblind", label: p.colorblind },
    { id: "profil-eksport", label: p.export },
  ];

  const endreMaker = (v: string) => {
    setMaker(v);
    const ny = withMaker(hash, v);
    setHash(ny);
    window.history.replaceState(null, "", `#${ny}`);
  };

  // Feltet viser det som skrives. Lenken får det rensede.
  const endrePantone = (hex: string, v: string) => {
    const ny = { ...pantone, [pantoneKey(hex)]: v };
    setPantone(ny);
    const h = withPantone(hash, ny);
    setHash(h);
    window.history.replaceState(null, "", `#${h}`);
  };

  const endreTypo = (liste: TypeSpec[]) => {
    setTypo(liste);
    const ny = withTypography(hash, liste);
    setHash(ny);
    window.history.replaceState(null, "", `#${ny}`);
  };

  // Teksten i feltet står som den er skrevet. Lenken får den rensede.
  // Uendret standardtekst lagres ikke i lenken, så den følger språket og
  // senere endringer i standardteksten.
  const endreRegel = (key: RuleKey, v: string, standard?: string) => {
    setRegler((r) => ({ ...r, [key]: v }));
    const lik = standard && cleanRule(v) === cleanRule(standard);
    const ny = withRule(hash, key, lik ? "" : v);
    setHash(ny);
    window.history.replaceState(null, "", `#${ny}`);
  };

  const kopierLenke = async () => {
    const logo = medLogo && logoLenke.status === "ok" ? logoLenke.verdi : null;
    const { origin, pathname } = window.location;
    try {
      await navigator.clipboard.writeText(
        `${origin}${pathname}#${withReadonly(withLogo(egen, logo), true)}`,
      );
      setLenke("copied");
    } catch {
      setLenke("failed");
    }
    setTimeout(() => setLenke(""), 2000);
  };

  return (
    <div
      className="min-h-screen bg-paper text-ink"
      data-les={kunde ? "" : undefined}
    >
      {/* Verktøylinjen er for designeren og skrives ikke ut. */}
      {/* Den felles toppen, som i verktøyet og på nettsiden. Kunden får
          sin egen enkle linje i stedet. */}
      {!kunde && (
        <SiteHeader
          active="profile"
          hash={hash}
          toolHash={tilVerktøy.slice(tilVerktøy.indexOf("#") + 1)}
          fanColors={farger}
          lockTheme
          sticky={false}
        />
      )}
      {kunde ? (
        <aside
          aria-label={p.toolbar}
          className="border-b border-line bg-panel print:hidden"
        >
          <div className="mx-auto flex max-w-5xl flex-wrap items-end gap-2 px-4 py-3 sm:px-6">
            <a
              href={localePath(locale)}
              className="mr-auto flex items-center gap-2 rounded-lg"
            >
              <FanMark colors={farger} size={28} />
              <span className="font-display text-lg font-extrabold tracking-tight">
                Color<span className="font-semibold text-subtle">Craft</span>
              </span>
            </a>
            <SimpleToggle />
            <label className="flex flex-col gap-1 text-xs font-medium">
              {p.vision}
              <select
                value={syn}
                onChange={(e) => setSyn(e.target.value as Vision | "normal")}
                className={field}
              >
                <option value="normal">{p.visionNormal}</option>
                {VISIONS.map((v) => (
                  <option key={v} value={v}>
                    {p.visions[v]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => window.print()}
              className={btn("outline", "md")}
            >
              {p.print}
            </button>
          </div>
        </aside>
      ) : (
        <aside
          aria-label={p.toolbar}
          className="border-b border-line bg-panel print:hidden"
        >
          <div className="mx-auto max-w-5xl space-y-3 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-48 flex-col gap-1 text-xs font-medium">
                {p.maker}
                <input
                  type="text"
                  value={maker}
                  maxLength={60}
                  placeholder={p.makerPlaceholder}
                  onChange={(e) => endreMaker(e.target.value)}
                  className={field}
                />
              </label>
              <button
                type="button"
                onClick={kopierLenke}
                className={btn("primary", "md")}
              >
                {lenke === "copied"
                  ? p.linkCopied
                  : lenke === "failed"
                    ? p.copyFailed
                    : p.copyLink}
              </button>
              <a
                href={`#${withReadonly(egen, true)}`}
                target="_blank"
                rel="noopener"
                className={btn("outline", "md")}
              >
                {p.previewClient}
              </a>
              <label className="flex flex-col gap-1 text-xs font-medium">
                {p.vision}
                <select
                  value={syn}
                  onChange={(e) => setSyn(e.target.value as Vision | "normal")}
                  className={field}
                >
                  <option value="normal">{p.visionNormal}</option>
                  {VISIONS.map((v) => (
                    <option key={v} value={v}>
                      {p.visions[v]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => window.print()}
                className={btn("outline", "md")}
              >
                {p.print}
              </button>
              <SaveToAccount
                hash={hash}
                lagreHash={() =>
                  withLogo(
                    egen,
                    medLogo && logoLenke.status === "ok"
                      ? logoLenke.verdi
                      : null,
                  )
                }
                title={profil.title}
                locale={locale}
                onSaved={(id) => {
                  const ny = withSaved(hash, id);
                  setHash(ny);
                  window.history.replaceState(null, "", `#${ny}`);
                }}
              />
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-subtle hover:text-ink">
                {p.logo}
              </summary>
              <div className="mt-2 overflow-hidden rounded-xl border border-line">
                <LogoUpload />
              </div>
            </details>
            {logoLenke.status !== "none" && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <label className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={medLogo && logoLenke.status === "ok"}
                    disabled={logoLenke.status !== "ok"}
                    onChange={(e) => setMedLogo(e.target.checked)}
                    className="h-4 w-4 accent-[var(--cc-accent)]"
                  />
                  {p.logoInLink}
                </label>
                <span className="text-subtle" role="status">
                  {logoLenke.status === "working" && p.logoWorking}
                  {logoLenke.status === "ok" &&
                    p.logoSize(logoLenke.verdi.length + 4)}
                  {logoLenke.status === "too-big" && p.logoTooBig}
                </span>
              </div>
            )}
            <p className="text-[11px] text-subtle">{p.toolbarHelp}</p>
          </div>
        </aside>
      )}

      <SectionNav label={p.onThisPage} items={navItems} />

      {/* Filtrene for «Se siden som». feColorMatrix regner i lineær RGB. */}
      <svg aria-hidden="true" focusable="false" className="absolute h-0 w-0">
        <defs>
          {VISIONS.map((v) => (
            <filter
              key={v}
              id={`cc-${v}`}
              colorInterpolationFilters="linearRGB"
            >
              <feColorMatrix type="matrix" values={filterMatrix(v)} />
            </filter>
          ))}
        </defs>
      </svg>

      <main
        className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6 print:py-0 print:filter-none!"
        style={syn === "normal" ? undefined : { filter: `url(#cc-${syn})` }}
      >
        <header className="space-y-4">
          <BrandLogo bg={palette.colors.background} inColor size="lg">
            {null}
          </BrandLogo>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-subtle">
              {p.eyebrow}
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              {profil.title}
            </h1>
            {/* Linjen står alltid, så siden ikke hopper når navnet skrives. */}
            <p className="min-h-6 text-subtle">{navn && p.madeBy(navn)}</p>
          </div>
        </header>

        <div id="profil-farger" className="space-y-12">
          {profil.sections.map((s) => (
            <Section
              key={s.kind}
              s={s}
              regel={regler[s.kind] ?? ""}
              onRegel={(v) => endreRegel(s.kind, v, s.usage)}
              pantone={pantone}
              onPantone={endrePantone}
            />
          ))}
        </div>

        {/* Tonetrappen er for nettsider og apper, så den er i utviklerdelen. */}
        {utvikler && <ToneScales farger={tonefarger} />}

        <Typography liste={typo} onListe={endreTypo} />

        <GeneralRules
          regel={regler.general ?? ""}
          onRegel={(v) => endreRegel("general", v)}
        />

        <section aria-labelledby="profil-ibruk" className="space-y-4">
          <h2
            id="profil-ibruk"
            className="font-display text-2xl font-bold tracking-tight"
          >
            {p.inUse}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-line">
            <InUsePreview palette={palette} brand={palette.brand} />
          </div>
          {palette.brand && (
            <div className="overflow-hidden rounded-2xl border border-line break-inside-avoid-page">
              <SurfacesPreview palette={palette} brand={palette.brand} />
            </div>
          )}
        </section>

        <section
          aria-labelledby="profil-kontrast"
          className="space-y-3 break-inside-avoid"
        >
          <h2
            id="profil-kontrast"
            className="font-display text-2xl font-bold tracking-tight"
          >
            {p.contrast}
          </h2>
          <p className="text-sm text-subtle">{p.contrastHelp}</p>
          <ul className={`${panel} divide-y divide-line`}>
            {profil.contrast.map((c) => (
              <li
                key={c.label}
                className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
              >
                <span>{c.label}</span>
                <span className="flex items-center gap-2 font-mono text-xs">
                  {c.ratio}
                  <Level level={c.level} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <ColorBlindness
          farger={profil.sections.flatMap((s) =>
            s.colors.map((c) => ({ label: c.label, hex: c.hex })),
          )}
        />

        <section
          id="profil-eksport"
          aria-labelledby="profil-eksport-tittel"
          className="space-y-4 print:hidden"
        >
          <div className="max-w-2xl space-y-1">
            <h2
              id="profil-eksport-tittel"
              className="font-display text-2xl font-bold tracking-tight"
            >
              {p.export}
            </h2>
            <p className="text-sm text-subtle">{p.exportHelp}</p>
          </div>
          <div
            className={
              utvikler
                ? "grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]"
                : "max-w-md"
            }
          >
            <div className={`${panel} p-4`}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-subtle">
                {p.download}
              </p>
              <ColorCardPanel palette={palette} maker={navn} />
            </div>
            {/* Filene til nettside og app er for utviklerne. */}
            {utvikler && (
              <div className={`${panel} p-4`}>
                <p className="text-xs font-semibold uppercase tracking-widest text-subtle">
                  {p.exportCode}
                </p>
                <p className="mt-2 text-xs text-subtle">{p.exportCodeHelp}</p>
                <div className="mt-3">
                  <ProfileExport input={eksport} />
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className="space-y-2 border-t border-line pt-6 text-xs text-subtle">
          <p>
            {navn && <>{p.madeBy(navn)} · </>}
            <a href={localePath(locale)} className="underline hover:text-ink">
              {p.madeWith}
            </a>
          </p>
          <p>{t.card.note}</p>
        </footer>
      </main>
    </div>
  );
}

/** Hvit eller svart, den som står best på fargen. */
function tekstPå(hex: string): string {
  const hvit = contrastRatio("#FFFFFF", hex) ?? 0;
  const svart = contrastRatio("#000000", hex) ?? 0;
  return hvit >= svart ? "#FFFFFF" : "#000000";
}

function Level({ level }: { level: string }) {
  const ok = level === "AA" || level === "AAA";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        ok ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"
      }`}
    >
      {level}
    </span>
  );
}

/** En bruksregel som avsnitt, eller som punktliste når den har flere linjer. */
function RuleText({ tekst, className }: { tekst: string; className: string }) {
  const linjer = ruleLines(tekst);
  if (linjer.length === 1) return <p className={className}>{linjer[0]}</p>;
  return (
    <ul className={`${className} list-disc space-y-0.5 pl-5`}>
      {linjer.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}

/**
 * Feltet der designeren skriver egne bruksregler. Vises ikke for utskrift.
 */
function RuleEditor({
  label,
  regel,
  standard,
  onRegel,
  onDone,
}: {
  label: string;
  regel: string;
  standard?: string;
  onRegel: (v: string) => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const p = t.profile;
  // Uendret standardtekst lagres ikke i lenken.
  const ferdig = () => {
    if (standard && cleanRule(regel) === cleanRule(standard)) onRegel("");
    onDone();
  };
  return (
    <div className="space-y-2 print:hidden">
      <textarea
        aria-label={label}
        value={regel}
        maxLength={MAX_RULE}
        rows={4}
        autoFocus
        onChange={(e) => onRegel(e.target.value)}
        className={`${field} block w-full resize-y`}
      />
      <p className="text-[11px] text-subtle">{p.rulesHelp(MAX_RULE)}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={ferdig} className={btn("primary", "sm")}>
          {p.rulesDone}
        </button>
        {regel && (
          <button
            type="button"
            onClick={() => {
              onRegel("");
              onDone();
            }}
            className={btn("ghost", "sm")}
          >
            {standard ? p.rulesReset : p.rulesRemove}
          </button>
        )}
      </div>
    </div>
  );
}

function Section({
  s,
  regel,
  onRegel,
  pantone,
  onPantone,
}: {
  s: ProfileSection;
  regel: string;
  onRegel: (v: string) => void;
  pantone: PantoneMap;
  onPantone: (hex: string, v: string) => void;
}) {
  const { t } = useI18n();
  const p = t.profile;
  const [åpen, setÅpen] = useState(false);
  const id = `profil-${s.kind}`;
  const egen = cleanRule(regel);
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="max-w-2xl space-y-2">
        <h2 id={id} className="font-display text-2xl font-bold tracking-tight">
          {s.heading}
        </h2>
        {åpen ? (
          <RuleEditor
            label={p.rulesLabel(s.heading)}
            regel={regel}
            standard={s.usage}
            onRegel={onRegel}
            onDone={() => setÅpen(false)}
          />
        ) : (
          <>
            <RuleText tekst={egen || s.usage} className="text-sm text-subtle" />
            <button
              type="button"
              onClick={() => {
                // Standardteksten er et godt sted å starte.
                if (!egen) onRegel(s.usage);
                setÅpen(true);
              }}
              data-rediger
              className="text-xs font-medium text-subtle underline hover:text-ink print:hidden"
            >
              {egen ? p.rulesChange : p.rulesWrite}
            </button>
          </>
        )}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {s.colors.map((c) => (
          <ColorCard
            key={c.hex + c.label}
            c={c}
            pantone={pantone[pantoneKey(c.hex)] ?? ""}
            onPantone={(v) => onPantone(c.hex, v)}
          />
        ))}
      </ul>
    </section>
  );
}

/**
 * Om en font er installert: tekst i fonten måles mot to ulike
 * reservefonter. Blir bredden den samme som reservefonten for begge, finnes
 * ikke fonten.
 */
function fontFinnes(font: string): boolean {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return true;
  const prøve = "mmmmmmmmmmlli WQ@#0123";
  return (["monospace", "serif"] as const).some((reserve) => {
    ctx.font = `72px ${reserve}`;
    const uten = ctx.measureText(prøve).width;
    ctx.font = `72px "${cleanFont(font)}", ${reserve}`;
    return ctx.measureText(prøve).width !== uten;
  });
}

/** Typografien. Uten fonter vises bare knappen, og ikke på trykk. */
function Typography({
  liste,
  onListe,
}: {
  liste: TypeSpec[];
  onListe: (l: TypeSpec[]) => void;
}) {
  const { t } = useI18n();
  const p = t.profile;
  const [åpen, setÅpen] = useState(false);
  const fonter = liste.filter((x) => cleanFont(x.font));

  const ny = (role: string, weight: number): TypeSpec => ({
    role,
    font: "",
    weight,
    size: "",
    fallback: "",
    note: "",
  });
  const endre = (i: number, felt: Partial<TypeSpec>) =>
    onListe(liste.map((x, j) => (j === i ? { ...x, ...felt } : x)));

  if (fonter.length === 0 && !åpen) {
    return (
      <div data-rediger className="print:hidden">
        <button
          type="button"
          onClick={() => {
            if (liste.length === 0) {
              onListe([ny(p.typeDefaults[0], 700), ny(p.typeDefaults[1], 400)]);
            }
            setÅpen(true);
          }}
          className={btn("outline", "sm")}
        >
          {p.typeAdd}
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="profil-typografi" className="space-y-4">
      <div className="max-w-2xl space-y-1">
        <h2
          id="profil-typografi"
          className="font-display text-2xl font-bold tracking-tight"
        >
          {p.type}
        </h2>
        <p className="text-xs text-subtle print:hidden">{p.typeHelp}</p>
      </div>

      {åpen ? (
        <div className="space-y-3 print:hidden">
          {liste.map((x, i) => (
            <fieldset
              key={i}
              className={`${panel} grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3`}
            >
              <legend className="sr-only">
                {x.role || `${p.typeFont} ${i + 1}`}
              </legend>
              <TypeField
                label={p.typeRole}
                value={x.role}
                onChange={(v) => endre(i, { role: v })}
              />
              <TypeField
                label={p.typeFont}
                value={x.font}
                placeholder="Montserrat"
                onChange={(v) => endre(i, { font: v })}
                autoFocus={i === 0 && !x.font}
              />
              <label className="flex flex-col gap-1 text-xs font-medium">
                {p.typeWeight}
                <select
                  value={x.weight}
                  onChange={(e) => endre(i, { weight: Number(e.target.value) })}
                  className={field}
                >
                  {WEIGHTS.map((w) => (
                    <option key={w} value={w}>
                      {w} {p.weights[w]}
                    </option>
                  ))}
                </select>
              </label>
              <TypeField
                label={p.typeSize}
                value={x.size}
                placeholder={p.typeSizePlaceholder}
                onChange={(v) => endre(i, { size: v })}
              />
              <TypeField
                label={p.typeFallback}
                value={x.fallback}
                placeholder={p.typeFallbackPlaceholder}
                onChange={(v) => endre(i, { fallback: v })}
              />
              <TypeField
                label={p.typeNote}
                value={x.note}
                max={160}
                onChange={(v) => endre(i, { note: v })}
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  onClick={() => onListe(liste.filter((_, j) => j !== i))}
                  className={btn("ghost", "sm")}
                >
                  {p.typeRemoveFont}
                </button>
              </div>
            </fieldset>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setÅpen(false)}
              className={btn("primary", "sm")}
            >
              {p.rulesDone}
            </button>
            {liste.length < MAX_TYPES && (
              <button
                type="button"
                onClick={() => onListe([...liste, ny("", 400)])}
                className={btn("outline", "sm")}
              >
                {p.typeAddFont}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {fonter.map((x, i) => (
              <TypeCard key={i} x={x} />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setÅpen(true)}
            data-rediger
            className="text-xs font-medium text-subtle underline hover:text-ink print:hidden"
          >
            {p.typeChange}
          </button>
        </>
      )}
    </section>
  );
}

function TypeField({
  label,
  value,
  onChange,
  placeholder,
  max = 60,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max?: number;
  autoFocus?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium">
      {label}
      <input
        type="text"
        value={value}
        maxLength={max}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className={field}
      />
    </label>
  );
}

function TypeCard({ x }: { x: TypeSpec }) {
  const { t } = useI18n();
  const p = t.profile;
  const font = cleanFont(x.font);
  const reserve = cleanFont(x.fallback);
  const [finnes, setFinnes] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFinnes(fontFinnes(font));
  }, [font]);
  const stil = { fontFamily: fontStack(x), fontWeight: x.weight };
  return (
    <li className={`${panel} space-y-3 p-5 break-inside-avoid`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-subtle">
        {x.role}
      </p>
      <div className="flex items-end gap-4">
        <span style={stil} className="text-6xl leading-none">
          Aa
        </span>
        <div className="min-w-0">
          <p style={stil} className="truncate text-2xl">
            {font}
          </p>
          <p className="text-xs text-subtle">
            {x.weight} {p.weights[x.weight]}
            {x.size && <> · {x.size}</>}
          </p>
        </div>
      </div>
      <p style={stil} className="text-lg">
        {p.typeSample}
      </p>
      {(reserve || x.note) && (
        <p className="text-sm text-subtle">
          {reserve && p.typeFallbackLabel(reserve)}
          {reserve && x.note && " · "}
          {x.note}
        </p>
      )}
      {!finnes && (
        <p className="text-xs text-subtle print:hidden">
          {p.typeMissing(font, reserve)}
        </p>
      )}
    </li>
  );
}

/**
 * Tonetrapp 50–950 for merkefargene, med CSS-variabler til utvikleren.
 * Intern profil er ikke med, og for en palett uten profil bare hovedfarge,
 * uthevingsfarge og flatefarge.
 */
function ToneScales({ farger }: { farger: { label: string; hex: string }[] }) {
  const { t } = useI18n();
  const p = t.profile;
  const { kopiert, kopier } = useCopy();
  const unike = farger.filter(
    (f, i) => farger.findIndex((g) => g.hex === f.hex) === i,
  );
  if (unike.length === 0) return null;
  const trapper = unike.map((f) => ({
    ...f,
    skala: toneScale(f.hex),
  }));
  const alt = trapper.map((x) => toneCss(x.label, x.skala)).join("\n\n");

  return (
    <section aria-labelledby="profil-toner" className="space-y-4">
      <div className="max-w-2xl space-y-1">
        <h2
          id="profil-toner"
          className="font-display text-2xl font-bold tracking-tight"
        >
          {p.tones}
        </h2>
        <p className="text-sm text-subtle">{p.tonesHelp}</p>
      </div>
      {/* Bare i utviklerdelen, så den står åpen. */}
      <details open>
        <summary className="cursor-pointer text-sm font-medium text-subtle hover:text-ink print:hidden">
          {p.tonesShow}
        </summary>
        <ul className="mt-4 space-y-5">
          {trapper.map((x) => {
            const css = toneCss(x.label, x.skala);
            return (
              <li key={x.hex} className="space-y-2 break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">{x.label}</p>
                  <button
                    type="button"
                    onClick={() => kopier(css)}
                    className="text-xs font-medium text-subtle underline hover:text-ink print:hidden"
                  >
                    {kopiert === css ? p.tonesCopied : p.tonesCopy}
                  </button>
                </div>
                <ol className="grid grid-cols-6 gap-1 sm:grid-cols-11">
                  {x.skala.map((s) => (
                    <li
                      key={s.step}
                      className="flex h-16 flex-col justify-between rounded-md p-1.5 text-[10px] leading-tight"
                      style={{ background: s.hex, color: s.text }}
                      title={s.base ? `${s.hex}, ${p.tonesBase}` : s.hex}
                    >
                      <span className="flex items-center justify-between font-semibold">
                        {s.step}
                        {s.base && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: s.text }}
                          >
                            <span className="sr-only">{p.tonesBase}</span>
                          </span>
                        )}
                      </span>
                      <span className="font-mono">{s.hex.slice(1)}</span>
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={() => kopier(alt)}
            className={btn("outline", "sm")}
          >
            {kopiert === alt ? p.tonesCopied : p.tonesCopyAll}
          </button>
          <p className="text-xs text-subtle">{p.tonesCssNote}</p>
        </div>
      </details>
    </section>
  );
}

/**
 * Fargene med hvert fargesyn, og hvilke farger som blir for like. Regnes
 * fra HEX, så tabellen er riktig også på trykk.
 */
function ColorBlindness({
  farger,
}: {
  farger: { label: string; hex: string }[];
}) {
  const { t } = useI18n();
  const p = t.profile;
  const unike = farger.filter(
    (f, i) => farger.findIndex((g) => g.hex === f.hex) === i,
  );
  if (unike.length === 0) return null;
  const funn = VISIONS.map((v) => ({ v, par: similarPairs(unike, v) }));
  return (
    <section aria-labelledby="profil-fargeblind" className="space-y-4">
      <div className="max-w-2xl space-y-1">
        <h2
          id="profil-fargeblind"
          className="font-display text-2xl font-bold tracking-tight"
        >
          {p.colorblind}
        </h2>
        <p className="text-sm text-subtle">{p.colorblindHelp}</p>
      </div>
      <div className={`${panel} overflow-x-auto break-inside-avoid`}>
        <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="px-3 py-2 font-semibold">
                {p.colorblindColor}
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                {p.visionNormal}
              </th>
              {VISIONS.map((v) => (
                <th key={v} scope="col" className="px-3 py-2 font-semibold">
                  {p.visionsShort[v]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {unike.map((f) => (
              <tr key={f.hex} className="border-b border-line last:border-0">
                <th scope="row" className="px-3 py-2 font-medium">
                  {f.label}
                </th>
                {[f.hex, ...VISIONS.map((v) => simulate(f.hex, v))].map(
                  (hex, i) => (
                    <td key={i} className="px-3 py-2">
                      <span
                        className="block h-8 w-full min-w-12 rounded-md border border-line"
                        style={{ background: hex }}
                        title={hex}
                      />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 text-sm sm:grid-cols-2">
        {funn.map(({ v, par }) => (
          <li key={v} className="space-y-1 break-inside-avoid">
            <p className="font-semibold">{p.visions[v]}</p>
            {par.length === 0 ? (
              <p className="text-subtle">{p.colorblindNone}</p>
            ) : (
              <ul className="list-disc space-y-0.5 pl-5">
                {par.map((x) => (
                  <li key={`${x.a.hex}-${x.b.hex}`}>
                    {p.colorblindSimilar(x.a.label, x.b.label)}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {funn.some((f) => f.par.length > 0) && (
        <p className="max-w-2xl text-sm text-subtle">{p.colorblindTip}</p>
      )}
    </section>
  );
}

/** Generelle bruksregler. Uten tekst vises bare knappen, og ikke på trykk. */
function GeneralRules({
  regel,
  onRegel,
}: {
  regel: string;
  onRegel: (v: string) => void;
}) {
  const { t } = useI18n();
  const p = t.profile;
  const [åpen, setÅpen] = useState(false);
  const egen = cleanRule(regel);

  if (!egen && !åpen) {
    return (
      <div data-rediger className="print:hidden">
        <button
          type="button"
          onClick={() => setÅpen(true)}
          className={btn("outline", "sm")}
        >
          {p.rulesAdd}
        </button>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="profil-regler"
      className="max-w-2xl space-y-2 break-inside-avoid"
    >
      <h2
        id="profil-regler"
        className="font-display text-2xl font-bold tracking-tight"
      >
        {p.rules}
      </h2>
      {åpen ? (
        <>
          <p className="text-xs text-subtle print:hidden">
            {p.rulesGeneralHelp}
          </p>
          <RuleEditor
            label={p.rules}
            regel={regel}
            onRegel={onRegel}
            onDone={() => setÅpen(false)}
          />
        </>
      ) : (
        <>
          <RuleText tekst={egen} className="text-sm" />
          <button
            type="button"
            onClick={() => setÅpen(true)}
            data-rediger
            className="text-xs font-medium text-subtle underline hover:text-ink print:hidden"
          >
            {p.rulesChange}
          </button>
        </>
      )}
    </section>
  );
}

function ColorCard({
  c,
  pantone,
  onPantone,
}: {
  c: ProfileColor;
  pantone: string;
  onPantone: (v: string) => void;
}) {
  const { locale, t } = useI18n();
  const p = t.profile;
  const { kopiert, kopier } = useCopy();
  const [endrer, setEndrer] = useState(false);
  const pms = cleanPantone(pantone);
  const ratio = (r: number) => localizeRatio(formatRatio(r), locale);
  const nivå = (r: number) => {
    const l = contrastLevel(r);
    return l === "fail" ? p.belowAA : l;
  };
  const verdier: [string, string][] = [
    ["HEX", c.hex],
    ["RGB", c.rgb],
    // Bare tallene, så de kan limes rett inn. Hvor de kommer fra, står under.
    [
      "CMYK",
      c.cmykValue
        ? formatCmyk(c.cmykValue)
        : c.cmyk.slice(t.card.approx.length + 1),
    ],
  ];
  if (pms) verdier.push(["Pantone", pms]);
  const cmykKilde = c.cmykFromManual ? p.cmykManual : p.cmykApprox;

  return (
    <li className={`${panel} overflow-hidden break-inside-avoid`}>
      <div
        className="flex h-36 flex-col justify-end p-4"
        style={{ backgroundColor: c.hex, color: c.text }}
      >
        <p className="font-display text-lg font-bold">{c.label}</p>
        <p className="font-mono text-xs opacity-80">{c.hex}</p>
      </div>
      {c.profileTints.length > 0 && (
        <div className="grid grid-cols-4" aria-label={p.tints}>
          {c.profileTints.map((tint) => (
            <div
              key={tint.percent}
              className="h-9 px-2 py-1 font-mono text-[10px]"
              style={{
                backgroundColor: tint.hex,
                color: tekstPå(tint.hex),
              }}
              title={t.tones.tintTitle(tint.percent, tint.hex, tint.cmykText)}
            >
              {tint.percent} %
            </div>
          ))}
        </div>
      )}
      <dl className="space-y-1 px-4 py-3 text-sm">
        {verdier.map(([navn, verdi]) => (
          <div key={navn} className="flex items-baseline justify-between gap-3">
            <dt className="text-xs font-semibold text-subtle">{navn}</dt>
            <dd className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-mono text-xs">{verdi}</span>
              <button
                type="button"
                onClick={() => kopier(verdi)}
                aria-label={p.copy(`${navn} ${verdi}`)}
                className="shrink-0 text-[11px] text-subtle underline hover:text-ink print:hidden"
              >
                {kopiert === verdi ? p.copied : t.export.copy}
              </button>
            </dd>
          </div>
        ))}
        <p className="text-right text-[11px] text-subtle">
          {cmykKilde}
          {pms && <> · {p.pantoneSource}</>}
        </p>
        {endrer ? (
          <div className="space-y-1 pt-1 print:hidden">
            <input
              type="text"
              aria-label={p.pantoneLabel(c.label)}
              value={pantone}
              maxLength={30}
              placeholder={p.pantonePlaceholder}
              autoFocus
              onChange={(e) => onPantone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") setEndrer(false);
              }}
              onBlur={() => setEndrer(false)}
              className={`${field} w-full`}
            />
            <p className="text-[11px] text-subtle">{p.pantoneHelp}</p>
          </div>
        ) : (
          <div data-rediger className="text-right print:hidden">
            <button
              type="button"
              onClick={() => setEndrer(true)}
              className="text-[11px] text-subtle underline hover:text-ink"
            >
              {pms ? p.pantoneChange : p.pantoneAdd}
            </button>
          </div>
        )}
      </dl>
      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3 text-xs">
        <span
          className="rounded-md px-2 py-1 font-medium"
          style={{ backgroundColor: c.hex, color: "#FFFFFF" }}
        >
          {p.whiteText} {ratio(c.onWhite)} · {nivå(c.onWhite)}
        </span>
        <span
          className="rounded-md px-2 py-1 font-medium"
          style={{ backgroundColor: c.hex, color: "#000000" }}
        >
          {p.blackText} {ratio(c.onBlack)} · {nivå(c.onBlack)}
        </span>
      </div>
    </li>
  );
}
