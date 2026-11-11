"use client";

import { useState } from "react";
import { ColorPalette } from "@/types/palette";
import { ExtendedColorPalette } from "@/data/palettes";
import { useI18n } from "@/components/I18nProvider";

type Role = keyof ColorPalette["colors"];

interface PaletteEditorProps {
  onClose: () => void;
  onSave: (palette: ColorPalette, darkVariant?: ColorPalette) => void;
  editingPalette?: ExtendedColorPalette | null;
}

const DEFAULT_LIGHT_COLORS: ColorPalette["colors"] = {
  primary: "#3B82F6",
  secondary: "#E5E7EB",
  accent: "#10B981",
  warm: "#F59E0B",
  cool: "#06B6D4",
  background: "#FFFFFF",
  surface: "#F9FAFB",
  foreground: "#111827",
  muted: "#6B7280",
  border: "#D1D5DB",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

const DEFAULT_DARK_COLORS: ColorPalette["colors"] = {
  primary: "#60A5FA",
  secondary: "#374151",
  accent: "#34D399",
  warm: "#FBBF24",
  cool: "#22D3EE",
  background: "#111827",
  surface: "#1F2937",
  foreground: "#F9FAFB",
  muted: "#9CA3AF",
  border: "#374151",
  success: "#34D399",
  warning: "#FBBF24",
  error: "#F87171",
  info: "#60A5FA",
};

/**
 * Skjemaet for å lage eller endre en palett.
 *
 * Forelderen monterer komponenten bare når redigeringen er åpen, med en ny
 * `key` hver gang. Da settes starttilstanden én gang fra props, og det trengs
 * ingen effekt som nullstiller skjemaet når en annen palett åpnes.
 */
export function PaletteEditor({
  onClose,
  onSave,
  editingPalette,
}: PaletteEditorProps) {
  const { t } = useI18n();
  const [palette, setPalette] = useState<ColorPalette>(
    () =>
      editingPalette ?? {
        name: t.editor.defaultName,
        id: `custom-${Date.now()}`,
        description: t.editor.defaultDescription,
        colors: DEFAULT_LIGHT_COLORS,
      },
  );

  const [createDarkVariant, setCreateDarkVariant] = useState(
    () => !!editingPalette?.darkVariant,
  );
  // Bare fargene lagres her. Navn, id og beskrivelse for den mørke varianten
  // utledes fra den lyse ved lagring, så de alltid følger hverandre.
  const [darkColors, setDarkColors] = useState<ColorPalette["colors"]>(
    () => editingPalette?.darkVariant?.colors ?? DEFAULT_DARK_COLORS,
  );

  const handleSave = () => {
    const darkVariant: ColorPalette | undefined = createDarkVariant
      ? {
          name: `${palette.name} ${t.palette.darkSuffix}`,
          id: `${palette.id}-dark`,
          description: `${palette.description} ${t.palette.darkDescriptionSuffix}`,
          colors: darkColors,
        }
      : undefined;
    onSave(palette, darkVariant);
  };

  const handleColorChange = (
    colorKey: string,
    value: string,
    isDark = false,
  ) => {
    if (isDark) {
      setDarkColors((prev) => ({ ...prev, [colorKey]: value }));
    } else {
      setPalette((prev) => ({
        ...prev,
        colors: { ...prev.colors, [colorKey]: value },
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {editingPalette ? t.editor.titleEdit : t.editor.titleNew}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.editor.close}
              className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50">
          {/* Basic Info */}
          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              {t.editor.info}
            </h3>
            <div>
              <label
                htmlFor="palette-name"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                {t.editor.name}
              </label>
              <input
                id="palette-name"
                type="text"
                value={palette.name}
                onChange={(e) =>
                  setPalette({ ...palette, name: e.target.value })
                }
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-base"
                placeholder={t.editor.namePlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="palette-description"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                {t.editor.description}
              </label>
              <input
                id="palette-description"
                type="text"
                value={palette.description}
                onChange={(e) =>
                  setPalette({ ...palette, description: e.target.value })
                }
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-base"
                placeholder={t.editor.descriptionPlaceholder}
              />
            </div>
          </div>

          {/* Color Grid */}
          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              {t.editor.lightColors}
            </h3>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(palette.colors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-800 capitalize">
                    {t.roles[key as Role]}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-12 h-10 shrink-0 rounded border-2 border-gray-300 cursor-pointer hover:border-blue-400 transition-colors"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="min-w-0 flex-1 p-2 border-2 border-gray-300 rounded text-sm font-mono bg-white text-gray-900 focus:border-blue-500 focus:outline-none"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dark Variant Toggle */}
          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                checked={createDarkVariant}
                id="create-dark"
                onChange={(e) => setCreateDarkVariant(e.target.checked)}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 rounded"
              />
              <label
                htmlFor="create-dark"
                className="text-lg font-semibold text-gray-900"
              >
                {t.editor.createDark}
              </label>
            </div>

            {createDarkVariant && (
              <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border-2 border-gray-600">
                <h4 className="text-white font-medium mb-4 text-base">
                  {t.editor.darkColors}
                </h4>
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(darkColors).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-200 capitalize">
                        {t.roles[key as Role]}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) =>
                            handleColorChange(key, e.target.value, true)
                          }
                          className="w-12 h-10 shrink-0 rounded border-2 border-gray-500 cursor-pointer hover:border-gray-400 transition-colors"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            handleColorChange(key, e.target.value, true)
                          }
                          className="min-w-0 flex-1 p-2 bg-gray-700 border-2 border-gray-600 rounded text-sm font-mono text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 border-t-2 border-t-gray-300">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
              >
                {t.editor.cancel}
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                {editingPalette ? t.editor.update : t.editor.create}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
