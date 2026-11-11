"use client";

import { useState, useEffect, useRef } from "react";
import { colorPalettes, ExtendedColorPalette } from "@/data/palettes";
import { decodeShare, encodeShare } from "@/lib/share";
import {
  applyOverrides,
  builtinOriginal,
  builtinOverrides,
  isModifiedBuiltin,
} from "@/lib/builtin";
import { PaginatedPaletteSelector } from "@/components/PaletteSelector";
import { LivePreview } from "@/components/LivePreview";
import { ColorDetails } from "@/components/ColorDetails";
import { PaletteEditor } from "@/components/PaletteEditor";
import { BrandBuilder } from "@/components/BrandBuilder";
import { ColorPalette } from "@/types/palette";
import { storageUtils } from "@/utils/localStorage";
import { FanMark } from "@/components/FanMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { btn, panel } from "@/lib/ui";
import { I18nProvider, useI18n } from "@/components/I18nProvider";
import {
  localePath,
  localizePalette,
  type Locale,
  type Messages,
} from "@/lib/i18n";

// En palett fra en lenke lagres ikke før brukeren ber om det. Da får den en
// vanlig custom-id og havner i localStorage som de andre egne palettene.
function toCustom(
  p: ExtendedColorPalette,
  m: Messages["palette"],
): ExtendedColorPalette {
  const id = `custom-${Date.now()}`;
  return {
    ...p,
    id,
    description:
      p.description === m.sharedDescription
        ? m.savedDescription
        : p.description,
    ...(p.darkVariant && {
      darkVariant: { ...p.darkVariant, id: `${id}-dark` },
    }),
  };
}

export function ColorCraftApp({ locale }: { locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <ColorCraft />
    </I18nProvider>
  );
}

function ColorCraft() {
  const { locale, t } = useI18n();
  const [palettes, setPalettes] =
    useState<ExtendedColorPalette[]>(colorPalettes);
  const [selectedPaletteId, setSelectedPaletteId] = useState(
    colorPalettes[0].id,
  );
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPalette, setEditingPalette] =
    useState<ExtendedColorPalette | null>(null);

  // Egne paletter og endringer i de innebygde leses fra localStorage når
  // siden er lastet, og lagres hver gang listen endres. Lagringen venter til
  // lesingen er gjort, så standardlisten aldri skriver over det som er lagret.
  // Et state-flagg og ikke en ref: begge effektene kjører i samme commit, så
  // lagringen må vente til neste gjengivelse, når listen fra lageret er satt.
  const [lagerLest, setLagerLest] = useState(false);
  useEffect(() => {
    if (storageUtils.isStorageAvailable()) {
      const customPalettes = storageUtils.loadCustomPalettes();
      const innebygde = applyOverrides(storageUtils.loadBuiltinOverrides());
      // localStorage finnes ikke når siden gjengis på serveren, så dette kan
      // først leses etter hydrering. Det er synkronisering med et eksternt
      // lager, som effekter er ment for.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPalettes([...innebygde, ...customPalettes]);
    }
    setLagerLest(true);
  }, []);

  useEffect(() => {
    if (!lagerLest || !storageUtils.isStorageAvailable()) return;
    storageUtils.saveCustomPalettes(palettes);
    storageUtils.saveBuiltinOverrides(builtinOverrides(palettes));
  }, [palettes, lagerLest]);

  // Delbar lenke, del 1: les paletten fra adressen ved åpning, og når noen
  // limer inn en ny lenke i samme fane.
  const hashLest = useRef(false);
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bruk = () => {
      const delt = decodeShare(window.location.hash, t.palette);
      hashLest.current = true;
      if (!delt) return;
      if (delt.kind === "builtin") {
        const p = colorPalettes.find((x) => x.id === delt.id)!;
        const mork = delt.dark && !!p.darkVariant;
        setIsDarkMode(mork);
        setSelectedPaletteId(mork ? p.darkVariant!.id : p.id);
        return;
      }
      // Er den samme paletten (navn og farger) alt lagret, velges den i
      // stedet for å legge til en kopi. Det gjelder også en innebygd palett
      // du har endret: adressen peker da på fargene, ikke på id-en.
      const lagret = storageUtils.isStorageAvailable()
        ? [
            ...applyOverrides(storageUtils.loadBuiltinOverrides()).filter(
              isModifiedBuiltin,
            ),
            ...storageUtils.loadCustomPalettes(),
          ].find(
            (x) => encodeShare(x, false) === encodeShare(delt.palette, false),
          )
        : undefined;
      const p = lagret ?? delt.palette;
      setPalettes((prev) =>
        prev.some((x) => x.id === p.id) ? prev : [...prev, p],
      );
      setIsDarkMode(delt.dark);
      setSelectedPaletteId(
        delt.dark && p.darkVariant ? p.darkVariant.id : p.id,
      );
    };
    // Fragmentet finnes bare i nettleseren, så det kan først leses etter
    // hydrering, på samme måte som localStorage over.
    bruk();
    window.addEventListener("hashchange", bruk);
    return () => window.removeEventListener("hashchange", bruk);
  }, [t.palette]);

  // Dark mode toggle - maintains dark mode state when switching palettes
  const handleDarkModeToggle = (newDarkMode: boolean) => {
    setIsDarkMode(newDarkMode);

    // Auto-switch palette variant based on current selection
    const currentBasePaletteId = selectedPaletteId.replace("-dark", "");
    const palette = palettes.find((p) => p.id === currentBasePaletteId);

    if (palette) {
      if (newDarkMode && palette.darkVariant) {
        setSelectedPaletteId(palette.darkVariant.id);
      } else {
        setSelectedPaletteId(palette.id);
      }
    }
  };

  // Handle palette selection - respects current dark mode state
  const handlePaletteSelect = (paletteId: string) => {
    const basePaletteId = paletteId.replace("-dark", "");
    const palette = palettes.find((p) => p.id === basePaletteId);

    if (palette) {
      // If dark mode is enabled and palette has dark variant, select dark variant
      if (isDarkMode && palette.darkVariant) {
        setSelectedPaletteId(palette.darkVariant.id);
      } else {
        // Otherwise select the base palette
        setSelectedPaletteId(palette.id);
      }
      // På mobil ligger forhåndsvisningen over listen. Vis den nye paletten
      // med en gang i stedet for å la brukeren lete etter den.
      if (window.matchMedia("(max-width: 767px)").matches) {
        const rolig = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        previewRef.current?.scrollIntoView({
          behavior: rolig ? "auto" : "smooth",
          block: "start",
        });
      }
    }
  };

  // Innebygde paletter med navn og beskrivelse på sidens språk. Tilstanden
  // (palettes) holdes på ett språk, så lagring og lenker ikke avhenger av det.
  const shown = palettes.map((p) => localizePalette(p, locale));

  const getCurrentPalette = (): ColorPalette => {
    for (const palette of shown) {
      if (palette.id === selectedPaletteId) return palette;
      if (palette.darkVariant?.id === selectedPaletteId)
        return palette.darkVariant;
    }
    return shown[0];
  };

  // Hele paletten (lys med eventuell mørk) som den viste varianten hører til.
  const getCurrentExtendedPalette = (): ExtendedColorPalette =>
    shown.find(
      (p) =>
        p.id === selectedPaletteId || p.darkVariant?.id === selectedPaletteId,
    ) ?? shown[0];

  const currentExtended = getCurrentExtendedPalette();

  // Delbar lenke, del 2: adressen følger det som vises, så den alltid kan
  // kopieres rett fra adressefeltet. replaceState fyller ikke opp historikken.
  // Standardvisningen (første palett, lys) gir en adresse uten fragment.
  const shareHash = encodeShare(currentExtended, isDarkMode);
  useEffect(() => {
    if (!hashLest.current) return;
    const { pathname, search } = window.location;
    const standard = encodeShare(colorPalettes[0], false);
    const ny =
      shareHash === standard
        ? `${pathname}${search}`
        : `${pathname}${search}#${shareHash}`;
    if (ny !== `${pathname}${search}${window.location.hash}`) {
      window.history.replaceState(null, "", ny);
    }
  }, [shareHash]);

  const [linkStatus, setLinkStatus] = useState<"" | "copied" | "failed">("");
  const copyShareLink = async () => {
    const { origin, pathname } = window.location;
    try {
      await navigator.clipboard.writeText(`${origin}${pathname}#${shareHash}`);
      setLinkStatus("copied");
    } catch {
      setLinkStatus("failed");
    }
    setTimeout(() => setLinkStatus(""), 2000);
  };

  const handleSaveShared = () => {
    const delt = currentExtended;
    if (!delt.id.startsWith("shared-")) return;
    const lagret = toCustom(
      palettes.find((p) => p.id === delt.id) ?? delt,
      t.palette,
    );
    setPalettes((prev) => prev.map((p) => (p.id === delt.id ? lagret : p)));
    setSelectedPaletteId(
      selectedPaletteId === delt.darkVariant?.id
        ? lagret.darkVariant!.id
        : lagret.id,
    );
  };

  // Handle creating new palette
  const handleCreatePalette = () => {
    setEditingPalette(null);
    setEditorOpen(true);
  };

  // «Fra profilmanual»: paletten kommer ferdig regnet ut, og blir en egen
  // palett som lagres og velges.
  const [brandOpen, setBrandOpen] = useState(false);
  const handleCreateFromBrand = (p: Omit<ExtendedColorPalette, "id">) => {
    const id = `custom-${Date.now()}`;
    const ny: ExtendedColorPalette = {
      ...p,
      id,
      ...(p.darkVariant && {
        darkVariant: { ...p.darkVariant, id: `${id}-dark` },
      }),
    };
    setPalettes((prev) => [...prev, ny]);
    setSelectedPaletteId(isDarkMode && ny.darkVariant ? ny.darkVariant.id : id);
    setBrandOpen(false);
  };

  // Handle editing existing palette
  const handleEditPalette = () => {
    const currentExtendedPalette = palettes.find(
      (p) =>
        p.id === selectedPaletteId || p.darkVariant?.id === selectedPaletteId,
    );
    setEditingPalette(currentExtendedPalette || null);
    setEditorOpen(true);
  };

  // Handle saving palette from editor
  const handleSavePalette = (
    palette: ColorPalette,
    darkVariant?: ColorPalette,
  ) => {
    let newExtendedPalette: ExtendedColorPalette = {
      ...palette,
      darkVariant,
    };
    // En palett fra en lenke som endres, blir en egen palett som lagres.
    if (newExtendedPalette.id.startsWith("shared-")) {
      newExtendedPalette = toCustom(newExtendedPalette, t.palette);
    }

    if (editingPalette) {
      // Update existing palette
      setPalettes((prev) =>
        prev.map((p) => (p.id === editingPalette.id ? newExtendedPalette : p)),
      );
    } else {
      // Add new palette
      setPalettes((prev) => [...prev, newExtendedPalette]);
    }

    // Select the new/updated palette
    setSelectedPaletteId(newExtendedPalette.id);
    setEditorOpen(false);
    setEditingPalette(null);
  };

  // Handle deleting palette
  const handleDeletePalette = () => {
    if (palettes.length <= 1) return; // Don't delete if it's the last palette

    const paletteToDelete = palettes.find(
      (p) =>
        p.id === selectedPaletteId || p.darkVariant?.id === selectedPaletteId,
    );

    if (paletteToDelete) {
      // Remove from localStorage if it's a custom palette
      if (
        paletteToDelete.id.startsWith("custom-") &&
        storageUtils.isStorageAvailable()
      ) {
        storageUtils.removeCustomPalette(paletteToDelete.id);
      }

      setPalettes((prev) => prev.filter((p) => p.id !== paletteToDelete.id));

      // Select first available palette
      const remainingPalettes = palettes.filter(
        (p) => p.id !== paletteToDelete.id,
      );
      if (remainingPalettes.length > 0) {
        setSelectedPaletteId(remainingPalettes[0].id);
      }
    }
  };

  const currentPalette = getCurrentPalette();
  const otherLocale: Locale = locale === "nb" ? "en" : "nb";
  // Paletten i lenken følger med over til det andre språket.
  const switchLanguage = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.href = localePath(otherLocale) + window.location.hash;
  };
  // Paletten som vises, på formen den lagres i (uten oversettelse).
  const currentRaw =
    palettes.find(
      (p) =>
        p.id === selectedPaletteId || p.darkVariant?.id === selectedPaletteId,
    ) ?? palettes[0];
  const erInnebygd = !!builtinOriginal(currentRaw.id);
  // Innebygde paletter slettes ikke, de tilbakestilles. Ellers ville de
  // dukket opp igjen ved neste besøk uansett.
  const canDelete = !erInnebygd && palettes.length > 1;
  const canReset = isModifiedBuiltin(currentRaw);

  const handleResetBuiltin = () => {
    const original = builtinOriginal(currentRaw.id);
    if (!original) return;
    setPalettes((prev) =>
      prev.map((p) => (p.id === original.id ? original : p)),
    );
    // Hadde den endrede paletten ingen mørk variant, men originalen har det,
    // står valget riktig fordi id-ene er de samme.
    setSelectedPaletteId(
      selectedPaletteId === `${original.id}-dark` && original.darkVariant
        ? original.darkVariant.id
        : original.id,
    );
  };

  // «Bruk» på et forslag i kontrastsjekken: bytter én farge i varianten som
  // vises. En delt palett blir en egen palett når den endres, som i
  // redigeringen.
  const handleApplySuggestion = (
    role: keyof ColorPalette["colors"],
    color: string,
  ) => {
    const viserMork = currentRaw.darkVariant?.id === selectedPaletteId;
    let ny: ExtendedColorPalette = viserMork
      ? {
          ...currentRaw,
          darkVariant: {
            ...currentRaw.darkVariant!,
            colors: { ...currentRaw.darkVariant!.colors, [role]: color },
          },
        }
      : { ...currentRaw, colors: { ...currentRaw.colors, [role]: color } };
    if (ny.id.startsWith("shared-")) ny = toCustom(ny, t.palette);
    setPalettes((prev) => prev.map((p) => (p.id === currentRaw.id ? ny : p)));
    setSelectedPaletteId(
      viserMork && ny.darkVariant ? ny.darkVariant.id : ny.id,
    );
  };

  const fanFarger = [
    currentPalette.colors.primary,
    currentPalette.colors.accent,
    currentPalette.colors.secondary,
    currentPalette.colors.warm,
  ];
  const harMørk = !!currentExtended.darkVariant;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <a
            href={localePath(locale)}
            className="flex min-w-0 items-center gap-2.5 rounded-lg"
            aria-label={t.app.home}
          >
            <FanMark colors={fanFarger} />
            <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
              Color<span className="font-semibold text-subtle">Craft</span>
            </h1>
          </a>
          <p className="order-last hidden w-full text-sm text-subtle lg:order-none lg:block lg:w-auto lg:max-w-md">
            {t.app.tagline}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <a
              href={localePath(otherLocale)}
              hrefLang={otherLocale}
              lang={otherLocale}
              aria-label={t.app.otherLanguageLabel}
              onClick={switchLanguage}
              className={btn("ghost", "sm")}
            >
              {t.app.otherLanguage}
            </a>
            <ThemeToggle />
            <button
              type="button"
              onClick={copyShareLink}
              className={btn("outline", "sm")}
              title={t.app.shareTitle}
            >
              {linkStatus === "copied"
                ? t.app.linkCopied
                : linkStatus === "failed"
                  ? t.app.copyFailed
                  : t.app.share}
            </button>
            <button
              type="button"
              onClick={handleCreatePalette}
              className={btn("outline", "sm")}
            >
              {t.app.add}
            </button>
            <button
              type="button"
              onClick={() => setBrandOpen(true)}
              title={t.brand.openTitle}
              className={btn("primary", "sm")}
            >
              {t.brand.open}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6">
        {currentExtended.id.startsWith("shared-") && (
          <div
            role="status"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-accent-soft px-4 py-3 text-sm text-ink"
          >
            <span>
              <strong>{currentExtended.name}</strong> {t.app.sharedBanner}
            </span>
            <button
              type="button"
              onClick={handleSaveShared}
              className={btn("primary", "sm")}
            >
              {t.app.saveShared}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:h-[calc(100vh-7.5rem)] lg:min-h-[720px] lg:grid-cols-12 lg:gap-5">
          <nav
            aria-label={t.app.paletteList}
            className={`${panel} p-4 lg:col-span-3 lg:overflow-y-auto`}
          >
            <PaginatedPaletteSelector
              palettes={shown}
              selectedId={selectedPaletteId}
              onSelect={handlePaletteSelect}
            />
          </nav>

          <section
            ref={previewRef}
            aria-labelledby="palette-title"
            className={`${panel} order-first flex scroll-mt-20 flex-col overflow-hidden md:col-span-2 lg:order-none lg:col-span-6`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h2
                  id="palette-title"
                  className="font-display text-2xl font-bold tracking-tight"
                >
                  {currentPalette.name}
                </h2>
                {currentPalette.description && (
                  <p className="mt-0.5 text-sm text-subtle">
                    {currentPalette.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {harMørk && (
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
                    ).map(([mørk, navn]) => (
                      <button
                        key={navn}
                        type="button"
                        aria-pressed={isDarkMode === mørk}
                        onClick={() => handleDarkModeToggle(mørk)}
                        className={
                          isDarkMode === mørk
                            ? "rounded-full bg-panel px-3 py-1 text-xs font-semibold text-ink shadow-sm"
                            : "rounded-full px-3 py-1 text-xs font-medium text-subtle hover:text-ink"
                        }
                      >
                        {navn}
                      </button>
                    ))}
                  </div>
                )}
                <div
                  role="group"
                  aria-label={t.app.paletteActions}
                  className="flex items-center gap-0.5"
                >
                  <button
                    type="button"
                    onClick={handleEditPalette}
                    className={btn("ghost", "sm")}
                  >
                    {t.app.edit}
                  </button>
                  {canReset && (
                    <button
                      type="button"
                      onClick={handleResetBuiltin}
                      title={t.app.resetTitle}
                      className={btn("ghost", "sm")}
                    >
                      {t.app.reset}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={handleDeletePalette}
                      className={btn("danger", "sm")}
                    >
                      {t.app.delete}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 lg:overflow-y-auto">
              <LivePreview
                palette={currentPalette}
                brand={currentExtended.brand}
                onApply={handleApplySuggestion}
              />
            </div>
          </section>

          <aside
            className={`${panel} p-4 sm:p-5 lg:col-span-3 lg:overflow-y-auto`}
          >
            <ColorDetails
              palette={currentPalette}
              exportPalette={currentExtended}
              onApplySuggestion={handleApplySuggestion}
            />
          </aside>
        </div>
      </main>

      <footer className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 pb-8 text-sm text-subtle sm:px-6">
        <span>
          {t.app.footer}{" "}
          <a
            href="https://www.borresendigital.no"
            className="font-medium text-ink underline underline-offset-4 hover:text-accent"
          >
            Børresen Digital
          </a>
        </span>
        <span className="font-mono text-xs">farger.borresendigital.no</span>
      </footer>

      {brandOpen && (
        <BrandBuilder
          onClose={() => setBrandOpen(false)}
          onCreate={handleCreateFromBrand}
        />
      )}

      {editorOpen && (
        <PaletteEditor
          key={editingPalette?.id ?? "ny"}
          onClose={() => {
            setEditorOpen(false);
            setEditingPalette(null);
          }}
          onSave={handleSavePalette}
          editingPalette={editingPalette}
        />
      )}
    </div>
  );
}
