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
import { Logo } from "@/components/Logo";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center">
              <Logo size="xl" showText={false} />
              <div className="ml-3 min-w-0 sm:ml-4">
                <h1 className="sr-only">ColorCraft</h1>
                <p className="text-gray-600 text-sm">{t.app.tagline}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href={localePath(otherLocale)}
                hrefLang={otherLocale}
                lang={otherLocale}
                aria-label={t.app.otherLanguageLabel}
                onClick={switchLanguage}
                className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline"
              >
                {t.app.otherLanguage}
              </a>
              {/* Palette Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyShareLink}
                  className="px-3 py-2 sm:px-4 text-white rounded-lg transition-colors text-sm font-medium bg-emerald-700 hover:bg-emerald-800"
                  title={t.app.shareTitle}
                >
                  {linkStatus === "copied"
                    ? t.app.linkCopied
                    : linkStatus === "failed"
                      ? t.app.copyFailed
                      : t.app.share}
                </button>
                <button
                  onClick={() => setBrandOpen(true)}
                  title={t.brand.openTitle}
                  className="px-3 py-2 sm:px-4 text-white rounded-lg transition-colors text-sm font-medium bg-violet-700 hover:bg-violet-800"
                >
                  {t.brand.open}
                </button>
                <button
                  onClick={handleCreatePalette}
                  className="px-3 py-2 sm:px-4 text-white rounded-lg transition-colors text-sm font-medium bg-blue-600 hover:bg-blue-700"
                >
                  {t.app.add}
                </button>
                <button
                  onClick={handleEditPalette}
                  className="px-3 py-2 sm:px-4 text-white rounded-lg transition-colors text-sm font-medium bg-gray-600 hover:bg-gray-700"
                >
                  {t.app.edit}
                </button>
                {canReset && (
                  <button
                    onClick={handleResetBuiltin}
                    title={t.app.resetTitle}
                    className="px-3 py-2 sm:px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
                  >
                    {t.app.reset}
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDeletePalette}
                    className="px-3 py-2 sm:px-4 text-white rounded-lg transition-colors text-sm font-medium bg-red-600 hover:bg-red-700"
                  >
                    {t.app.delete}
                  </button>
                )}
              </div>

              <div className="hidden text-right text-sm text-gray-600 md:block">
                <p>
                  {t.app.viewing}{" "}
                  <span className="font-medium text-gray-900">
                    {currentPalette.name}
                  </span>
                </p>
                <p className="text-xs mt-1">
                  {t.app.mode}{" "}
                  <span className="font-medium">
                    {isDarkMode ? t.app.dark : t.app.light}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {currentExtended.id.startsWith("shared-") && (
          <div
            role="status"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            <span>
              <strong>{currentExtended.name}</strong> {t.app.sharedBanner}
            </span>
            <button
              onClick={handleSaveShared}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
            >
              {t.app.saveShared}
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:h-[850px] lg:grid-cols-12 lg:gap-6">
          <div className="bg-white rounded-xl p-4 shadow-lg sm:p-6 lg:col-span-3 lg:overflow-y-auto">
            <PaginatedPaletteSelector
              palettes={shown}
              selectedId={selectedPaletteId}
              onSelect={handlePaletteSelect}
              isDarkMode={isDarkMode}
              onDarkModeToggle={handleDarkModeToggle}
            />
          </div>

          <div
            ref={previewRef}
            className="scroll-mt-4 bg-white rounded-xl shadow-lg overflow-hidden order-first md:col-span-2 lg:order-none lg:col-span-6 lg:overflow-y-auto"
          >
            <LivePreview
              palette={currentPalette}
              brand={currentExtended.brand}
              onApply={handleApplySuggestion}
            />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg sm:p-6 lg:col-span-3 lg:overflow-y-auto">
            <ColorDetails
              palette={currentPalette}
              exportPalette={currentExtended}
              onApplySuggestion={handleApplySuggestion}
            />
          </div>
        </div>
      </div>

      <footer className="max-w-7xl mx-auto px-4 pb-8 text-center text-sm text-gray-600">
        {t.app.footer}{" "}
        <a
          href="https://www.borresendigital.no"
          className="font-medium text-gray-900 underline underline-offset-4 hover:text-blue-700"
        >
          Børresen Digital
        </a>
      </footer>

      {brandOpen && (
        <BrandBuilder
          onClose={() => setBrandOpen(false)}
          onCreate={handleCreateFromBrand}
        />
      )}

      {/* Palette Editor Modal */}
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
