// ================================
// components/ColorSwatch.tsx
// ================================

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";

interface ColorSwatchProps {
  label: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

export function ColorSwatch({ label, color, size = "md" }: ColorSwatchProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  return (
    <div className="text-center group">
      <div
        className={cn(
          "rounded-lg cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg relative",
          sizeClasses[size],
        )}
        style={{ backgroundColor: color }}
        onClick={copyToClipboard}
      >
        {copied && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {t.details.copied}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs font-medium mt-2 group-hover:text-blue-600 transition-colors">
        {label}
      </p>
      <p className="text-xs text-gray-500 font-mono">{color}</p>
    </div>
  );
}
