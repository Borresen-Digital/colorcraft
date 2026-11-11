// utils/localStorage.ts
import { ExtendedColorPalette } from "@/data/palettes";

const STORAGE_KEY = "colorcraft-custom-palettes";
const OVERRIDES_KEY = "colorcraft-builtin-overrides";

export const storageUtils = {
  // Save custom palettes to localStorage
  saveCustomPalettes: (palettes: ExtendedColorPalette[]): void => {
    try {
      // Only save custom palettes (those with IDs starting with 'custom-')
      const customPalettes = palettes.filter((palette) =>
        palette.id.startsWith("custom-"),
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPalettes));
    } catch (error) {
      console.warn("Failed to save palettes to localStorage:", error);
    }
  },

  // Load custom palettes from localStorage
  loadCustomPalettes: (): ExtendedColorPalette[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that it's an array
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn("Failed to load palettes from localStorage:", error);
    }
    return [];
  },

  // Remove a specific custom palette
  removeCustomPalette: (paletteId: string): void => {
    try {
      const customPalettes = storageUtils.loadCustomPalettes();
      const filtered = customPalettes.filter(
        (palette) => palette.id !== paletteId,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.warn("Failed to remove palette from localStorage:", error);
    }
  },

  // Clear all custom palettes
  clearCustomPalettes: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear palettes from localStorage:", error);
    }
  },

  // Endringer i innebygde paletter, med id som nøkkel (se lib/builtin.ts).
  // Rått innhold: applyOverrides validerer det.
  loadBuiltinOverrides: (): unknown => {
    try {
      const lagret = localStorage.getItem(OVERRIDES_KEY);
      return lagret ? JSON.parse(lagret) : {};
    } catch {
      return {};
    }
  },

  saveBuiltinOverrides: (
    overrides: Record<string, ExtendedColorPalette>,
  ): void => {
    try {
      if (Object.keys(overrides).length === 0) {
        localStorage.removeItem(OVERRIDES_KEY);
      } else {
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
      }
    } catch (error) {
      console.warn("Failed to save palette changes to localStorage:", error);
    }
  },

  // Check if localStorage is available
  isStorageAvailable: (): boolean => {
    try {
      const test = "__test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },
};
