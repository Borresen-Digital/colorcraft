"use client";

import { createContext, useContext } from "react";
import { MESSAGES, type Locale, type Messages } from "@/lib/i18n";

const I18nContext = createContext<{ locale: Locale; t: Messages } | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, t: MESSAGES[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

/** Språket og tekstene for siden komponenten står på. */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n må brukes inne i I18nProvider");
  return ctx;
}
