"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { colorPalettes, type ExtendedColorPalette } from "@/data/palettes";
import { formatCmyk } from "@/lib/cmyk";
import { contrastLevel, contrastRatio, formatRatio } from "@/lib/contrast";
import { localePath, localizePalette, localizeRatio } from "@/lib/i18n";
import {
  buildProfile,
  readMaker,
  withMaker,
  withoutMaker,
  type ProfileColor,
  type ProfileSection,
} from "@/lib/profile";
import { decodeShare } from "@/lib/share";
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
export function ProfilePage({ locale }: { locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <Profile />
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

function Profile() {
  const { locale, t } = useI18n();
  const p = t.profile;
  // null til fragmentet er lest. Det finnes bare i nettleseren.
  const [hash, setHash] = useState<string | null>(null);
  const [maker, setMaker] = useState("");
  const [lenke, setLenke] = useState<"" | "copied" | "failed">("");
  const [medLogo, setMedLogo] = useState(true);
  const logoLenke = useLogoILenke(hash);

  useEffect(() => {
    const les = () => {
      const h = window.location.hash.replace(/^#/, "");
      setHash(h);
      setMaker(readMaker(h));
    };
    les();
    window.addEventListener("hashchange", les);
    return () => window.removeEventListener("hashchange", les);
  }, []);

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
        <a href={localePath(locale)} className={btn("primary", "md")}>
          {p.openTool}
        </a>
      </main>
    );
  }

  const profil = buildProfile(palette, locale);
  const navn = maker.trim();
  // Verktøyet leser ikke logoen fra lenken. Den følger med i nettleseren.
  const tilVerktøy = `${localePath(locale)}#${withLogo(withoutMaker(hash), null)}`;
  const farger = profil.sections.flatMap((s) => s.colors.map((c) => c.hex));

  const endreMaker = (v: string) => {
    setMaker(v);
    const ny = withMaker(hash, v);
    window.history.replaceState(null, "", `#${ny}`);
  };

  const kopierLenke = async () => {
    const logo = medLogo && logoLenke.status === "ok" ? logoLenke.verdi : null;
    const { origin, pathname } = window.location;
    try {
      await navigator.clipboard.writeText(
        `${origin}${pathname}#${withLogo(hash, logo)}`,
      );
      setLenke("copied");
    } catch {
      setLenke("failed");
    }
    setTimeout(() => setLenke(""), 2000);
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Verktøylinjen er for designeren og skrives ikke ut. */}
      <aside
        aria-label={p.toolbar}
        className="border-b border-line bg-panel print:hidden"
      >
        <div className="mx-auto max-w-5xl space-y-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-end gap-2">
            <Link
              href={tilVerktøy}
              className="mr-auto flex items-center gap-2 rounded-lg"
              title={p.edit}
            >
              <FanMark colors={farger} size={28} />
              <span className="font-display text-lg font-extrabold tracking-tight">
                Color<span className="font-semibold text-subtle">Craft</span>
              </span>
            </Link>
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
            <button
              type="button"
              onClick={() => window.print()}
              className={btn("outline", "md")}
            >
              {p.print}
            </button>
            <Link href={tilVerktøy} className={btn("ghost", "md")}>
              {p.edit}
            </Link>
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

      <main className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6 print:py-0">
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
            {navn && <p className="text-subtle">{p.madeBy(navn)}</p>}
          </div>
        </header>

        {profil.sections.map((s) => (
          <Section key={s.kind} s={s} />
        ))}

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

        <section className={`${panel} max-w-md p-4 print:hidden`}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-subtle">
            {p.download}
          </p>
          <ColorCardPanel palette={palette} defaultMaker={navn} />
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

function Section({ s }: { s: ProfileSection }) {
  const id = `profil-${s.kind}`;
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="max-w-2xl space-y-1">
        <h2 id={id} className="font-display text-2xl font-bold tracking-tight">
          {s.heading}
        </h2>
        <p className="text-sm text-subtle">{s.usage}</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {s.colors.map((c) => (
          <ColorCard key={c.hex + c.label} c={c} />
        ))}
      </ul>
    </section>
  );
}

function ColorCard({ c }: { c: ProfileColor }) {
  const { locale, t } = useI18n();
  const p = t.profile;
  const { kopiert, kopier } = useCopy();
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
        <p className="text-right text-[11px] text-subtle">{cmykKilde}</p>
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
