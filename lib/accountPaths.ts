import { DEFAULT_LOCALE, type Locale } from "./i18n";

/** Kontosiden. Norsk har ikke prefiks. */
export function kontoPath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/konto" : `/${locale}/konto`;
}

/** Personvernsiden for kontoene. */
export function personvernPath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/personvern" : `/${locale}/personvern`;
}
