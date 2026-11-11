"use client";

import { useState, useEffect, useRef } from "react";
import { colorPalettes, ExtendedColorPalette } from "@/data/palettes";
import { decodeShare, encodeShare } from "@/lib/share";
import { PaginatedPaletteSelector } from "@/components/PaletteSelector";
import { LivePreview } from "@/components/LivePreview";
import { ColorDetails } from "@/components/ColorDetails";
import { PaletteEditor } from "@/components/PaletteEditor";
import { ColorPalette } from "@/types/palette";
import { storageUtils } from "@/utils/localStorage";
import { Logo } from "@/components/Logo";

// En palett fra en lenke lagres ikke før brukeren ber om det. Da får den en
// vanlig custom-id og havner i localStorage som de andre egne palettene.
function toCustom(p: ExtendedColorPalette): ExtendedColorPalette {
  const id = `custom-${Date.now()}`;
  return {
    ...p,
    id,
    description:
      p.description === "Shared palette"
        ? "Saved from a shared link"
        : p.description,
    ...(p.darkVariant && {
      darkVariant: { ...p.darkVariant, id: `${id}-dark` },
    }),
  };
}

export default function ColorCraft() {
  const [palettes, setPalettes] =
    useState<ExtendedColorPalette[]>(colorPalettes);
  const [selectedPaletteId, setSelectedPaletteId] = useState(
    colorPalettes[0].id,
  );
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPalette, setEditingPalette] =
    useState<ExtendedColorPalette | null>(null);

  // Load custom palettes from localStorage on component mount
  useEffect(() => {
    if (storageUtils.isStorageAvailable()) {
      const customPalettes = storageUtils.loadCustomPalettes();
      if (customPalettes.length > 0) {
        // localStorage finnes ikke når siden gjengis på serveren, så de egne
        // palettene kan først leses etter hydrering. Dette er synkronisering
        // med et eksternt lager, som effekter er ment for.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPalettes([...colorPalettes, ...customPalettes]);
      }
    }
  }, []);

  // Save custom palettes to localStorage whenever palettes change
  useEffect(() => {
    if (storageUtils.isStorageAvailable()) {
      storageUtils.saveCustomPalettes(palettes);
    }
  }, [palettes]);

  // Delbar lenke, del 1: les paletten fra adressen ved åpning, og når noen
  // limer inn en ny lenke i samme fane.
  const hashLest = useRef(false);
  useEffect(() => {
    const bruk = () => {
      const delt = decodeShare(window.location.hash);
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
      // stedet for å legge til en kopi.
      const lagret = storageUtils.isStorageAvailable()
        ? storageUtils
            .loadCustomPalettes()
            .find(
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
  }, []);

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
    }
  };

  const getCurrentPalette = (): ColorPalette => {
    for (const palette of palettes) {
      if (palette.id === selectedPaletteId) return palette;
      if (palette.darkVariant?.id === selectedPaletteId)
        return palette.darkVariant;
    }
    return palettes[0];
  };

  // Hele paletten (lys med eventuell mørk) som den viste varianten hører til.
  const getCurrentExtendedPalette = (): ExtendedColorPalette =>
    palettes.find(
      (p) =>
        p.id === selectedPaletteId || p.darkVariant?.id === selectedPaletteId,
    ) ?? palettes[0];

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
    const lagret = toCustom(delt);
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
      newExtendedPalette = toCustom(newExtendedPalette);
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
  const canDelete = palettes.length > 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Logo size="xl" showText={false} />
              <div className="ml-4">
                {/* <h1 className="text-3xl font-bold text-gray-900">ColorCraft</h1> */}
                <p className="text-gray-600 text-sm">
                  Professional color palette testing and visualization tool
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Palette Actions */}
              <div className="flex gap-2">
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  title="Copy a link to this palette"
                >
                  {linkStatus === "copied"
                    ? "Link copied!"
                    : linkStatus === "failed"
                      ? "Copy failed"
                      : "Share link"}
                </button>
                <button
                  onClick={handleCreatePalette}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Add Palette
                </button>
                <button
                  onClick={handleEditPalette}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Edit Palette
                </button>
                {canDelete && (
                  <button
                    onClick={handleDeletePalette}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className="text-right text-sm text-gray-500">
                <p>
                  Currently viewing:{" "}
                  <span className="font-medium text-gray-900">
                    {currentPalette.name}
                  </span>
                </p>
                <p className="text-xs mt-1">
                  Mode:{" "}
                  <span className="font-medium">
                    {isDarkMode ? "Dark" : "Light"}
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
              <strong>{currentExtended.name}</strong> came from a shared link.
              It is not saved in this browser yet.
            </span>
            <button
              onClick={handleSaveShared}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Save to my palettes
            </button>
          </div>
        )}
        <div className="grid grid-cols-12 gap-6 h-[850px]">
          <div className="col-span-3 bg-white rounded-xl p-6 shadow-lg overflow-y-auto">
            <PaginatedPaletteSelector
              palettes={palettes}
              selectedId={selectedPaletteId}
              onSelect={handlePaletteSelect}
              isDarkMode={isDarkMode}
              onDarkModeToggle={handleDarkModeToggle}
            />
          </div>

          <div className="col-span-6 bg-white rounded-xl shadow-lg overflow-hidden">
            <LivePreview palette={currentPalette} />
          </div>

          <div className="col-span-3 bg-white rounded-xl p-6 shadow-lg overflow-y-auto">
            <ColorDetails
              palette={currentPalette}
              exportPalette={currentExtended}
            />
          </div>
        </div>
      </div>

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
