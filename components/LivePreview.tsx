// ================================
// components/LivePreview.tsx
// ================================

"use client";

import { useState } from "react";
import type { ExtendedColorPalette } from "@/data/palettes";
import { textOn } from "@/lib/contrastPairs";
import { cn } from "@/lib/utils";
import { SurfacesPreview } from "@/components/SurfacesPreview";
import { useI18n } from "@/components/I18nProvider";
import { ColorPalette } from "@/types/palette";

interface LivePreviewProps {
  palette: ColorPalette;
  /** Merkefargene, hvis paletten er laget fra en profilmanual. */
  brand?: ExtendedColorPalette["brand"];
}

type Tab = "components" | "surfaces";

/**
 * Forhåndsvisningen har to faner: komponenter (knapper, kort, meny) og
 * flater (støttefargene som heldekkende seksjoner og infobokser).
 */
export function LivePreview({ palette, brand }: LivePreviewProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("components");
  const faner: [Tab, string][] = [
    ["components", t.surfaces.tabComponents],
    ["surfaces", t.surfaces.tabSurfaces],
  ];
  return (
    <div className="flex h-full flex-col">
      <div
        role="tablist"
        aria-label={t.surfaces.tabsLabel}
        className="flex gap-1 border-b border-gray-200 bg-white px-3 pt-3"
      >
        {faner.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`preview-tab-${id}`}
            aria-selected={tab === id}
            aria-controls="preview-panel"
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px rounded-t-lg border px-4 py-2 text-sm font-medium",
              tab === id
                ? "border-gray-200 border-b-white bg-white text-gray-900"
                : "border-transparent text-gray-600 hover:text-gray-900",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        id="preview-panel"
        role="tabpanel"
        aria-labelledby={`preview-tab-${tab}`}
        className="flex-1"
      >
        {tab === "components" ? (
          <ComponentsPreview palette={palette} />
        ) : (
          <SurfacesPreview palette={palette} brand={brand} />
        )}
      </div>
    </div>
  );
}

function ComponentsPreview({ palette }: { palette: ColorPalette }) {
  const { t } = useI18n();
  // Samme tekstfarge som kontrastsjekken regner med.
  const onPrimary = textOn(palette, palette.colors.primary);
  const onAccent = textOn(palette, palette.colors.accent);

  return (
    <div
      className="h-full rounded-xl p-4 transition-all duration-500 sm:p-6"
      style={{
        backgroundColor: palette.colors.background,
        color: palette.colors.foreground,
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-3xl font-bold mb-2 transition-all duration-500 sm:text-4xl"
          style={{ color: palette.colors.primary }}
        >
          {palette.name}
        </h1>
        <p style={{ color: palette.colors.muted }}>{palette.description}</p>
      </div>

      {/* Navigation */}
      <nav
        className="flex flex-wrap justify-center gap-1 mb-8 p-2 rounded-lg transition-all duration-500 sm:gap-2 sm:p-4"
        style={{
          backgroundColor: palette.colors.surface,
          border: `1px solid ${palette.colors.border}`,
        }}
      >
        {t.preview.nav.map((item) => (
          <button
            key={item}
            className="px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 sm:px-4"
            style={{ color: palette.colors.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = palette.colors.primary;
              e.currentTarget.style.color = onPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = palette.colors.muted;
            }}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div
          className="p-6 rounded-xl transition-all duration-500 hover:scale-105"
          style={{
            backgroundColor: palette.colors.surface,
            border: `1px solid ${palette.colors.border}`,
          }}
        >
          <h3 className="text-xl font-semibold mb-3">
            {t.preview.primaryTitle}
          </h3>
          <p className="mb-4" style={{ color: palette.colors.muted }}>
            {t.preview.primaryText}
          </p>
          <button
            className="px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: palette.colors.primary,
              color: onPrimary,
            }}
          >
            {t.preview.primaryButton}
          </button>
        </div>

        <div
          className="p-6 rounded-xl transition-all duration-500 hover:scale-105"
          style={{
            backgroundColor: palette.colors.surface,
            border: `1px solid ${palette.colors.border}`,
          }}
        >
          <h3 className="text-xl font-semibold mb-3">
            {t.preview.secondaryTitle}
          </h3>
          <p className="mb-4" style={{ color: palette.colors.muted }}>
            {t.preview.secondaryText}
          </p>
          <button
            className="px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: palette.colors.accent,
              color: onAccent,
            }}
          >
            {t.preview.secondaryButton}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { type: t.roles.success, color: palette.colors.success, icon: "✓" },
          { type: t.roles.warning, color: palette.colors.warning, icon: "⚠" },
          { type: t.roles.error, color: palette.colors.error, icon: "✗" },
          { type: t.roles.info, color: palette.colors.info, icon: "i" },
        ].map((status) => (
          <div
            key={status.type}
            className="p-4 rounded-lg text-center transition-all duration-500 hover:scale-105"
            style={{
              backgroundColor: status.color + "20",
              border: `1px solid ${status.color}`,
            }}
          >
            <div
              className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: status.color }}
            >
              {status.icon}
            </div>
            <p className="text-sm" style={{ color: status.color }}>
              {status.type}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
