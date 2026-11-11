import type { ColorPalette } from "@/types/palette";
import { colorPalettes, type ExtendedColorPalette } from "@/data/palettes";

/**
 * Norsk og engelsk. Norsk er standard og bor på `/`, engelsk på `/en`.
 *
 * Ingen bibliotek: to statiske sider og én ordbok er alt som trengs, og alt
 * er med i bygget. Den engelske ordboken har samme type som den norske, så
 * TypeScript sier fra hvis en tekst mangler.
 */

export const LOCALES = ["nb", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "nb";

export function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s);
}

/** Stien til forsiden på et språk. Norsk har ikke prefiks. */
export function localePath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
}

type Role = keyof ColorPalette["colors"];

const nb = {
  meta: {
    title: "ColorCraft: test fargepaletter og kontrast",
    description:
      "Gratis verktøy for fargepaletter. Se fargene på ekte komponenter, sjekk kontrasten etter WCAG 2.2, og eksporter som CSS, Tailwind eller design tokens.",
    ogLocale: "nb_NO",
  },
  app: {
    tagline:
      "Test fargepaletter på ekte komponenter, sjekk kontrasten og eksporter som tokens",
    share: "Del lenke",
    shareTitle: "Kopier en lenke til denne paletten",
    linkCopied: "Lenke kopiert!",
    copyFailed: "Kunne ikke kopiere",
    add: "Ny palett",
    edit: "Rediger",
    delete: "Slett",
    viewing: "Viser:",
    mode: "Modus:",
    light: "Lys",
    dark: "Mørk",
    sharedBanner:
      "kom fra en delt lenke og er ikke lagret i denne nettleseren ennå.",
    saveShared: "Lagre i mine paletter",
    reset: "Tilbakestill",
    resetTitle: "Gå tilbake til fargene paletten hadde fra starten",
    otherLanguage: "English",
    otherLanguageLabel: "Switch to English",
    footer: "Et gratis verktøy fra",
  },
  selector: {
    title: "Velg palett",
    search: "Søk i paletter …",
    searchLabel: "Søk i paletter",
    showing: (n: number, total: number) => `Viser ${n} av ${total} paletter`,
    darkAvailable: "Har mørk variant",
    toggleDark: "Mørk modus",
    previous: "Forrige",
    next: "Neste",
    page: (p: number, total: number) => `Side ${p} av ${total}`,
  },
  preview: {
    nav: ["Hjem", "Om oss", "Tjenester", "Kontakt"],
    primaryTitle: "Hovedhandling",
    primaryText: "Slik ser de viktigste elementene ut med denne paletten.",
    primaryButton: "Kom i gang",
    secondaryTitle: "Sekundær handling",
    secondaryText: "Slik fungerer aksentfargen sammen med resten av paletten.",
    secondaryButton: "Les mer",
  },
  roles: {
    primary: "Primær",
    secondary: "Sekundær",
    accent: "Aksent",
    warm: "Varm",
    cool: "Kald",
    background: "Bakgrunn",
    surface: "Flate",
    foreground: "Forgrunn",
    muted: "Dempet",
    border: "Kant",
    success: "Suksess",
    warning: "Advarsel",
    error: "Feil",
    info: "Info",
  } satisfies Record<Role, string>,
  details: {
    swatches: "Fargeprøver",
    semantic: "Statusfarger",
    copied: "Kopiert!",
  },
  contrast: {
    title: "Kontrastsjekk",
    allPass: "Alle par består AA",
    below: (n: number) => `${n} under AA`,
    large: "(stor tekst)",
    invalid: "Ugyldig farge",
    passes: "består",
    fails: "stryker",
    suggest: (color: string, role: string, target: string) =>
      `Prøv ${color} som ${role.toLowerCase()} for å nå ${target}:1`,
    copySuggestion: "Kopier forslaget",
    apply: "Bruk",
    applyLabel: (color: string, role: string) =>
      `Bruk ${color} som ${role.toLowerCase()}`,
    copied: "Kopiert!",
    footnote:
      "WCAG 2.2: AA krever 4,5:1 for tekst og 3:1 for stor tekst. AAA krever 7:1 og 4,5:1.",
    pairs: {
      "text-background": "Tekst på bakgrunn",
      "text-surface": "Tekst på flate",
      "muted-background": "Dempet på bakgrunn",
      "muted-surface": "Dempet på flate",
      "heading-background": "Overskrift (primær) på bakgrunn",
      "button-primary": "Knappetekst på primær",
      "button-accent": "Knappetekst på aksent",
    } as Record<string, string>,
    decimal: ",",
  },
  export: {
    title: "Eksport",
    formatLabel: "Eksportformat",
    hints: {
      css: "Lys som standard, mørk fra systemvalget. Sett data-theme på <html> for å overstyre.",
      tailwind:
        "Erstatter CSS-inngangen til Tailwind. Gir klasser som bg-primary og text-on-primary.",
      json: "W3C Design Tokens-formatet. Virker med Tokens Studio for Figma og Style Dictionary.",
    },
    copy: "Kopier",
    download: "Last ned",
    copied: "Kopiert!",
    failed: "Kunne ikke kopiere",
    madeWith: "laget med",
    darkVariantComment:
      "dark: følger data-theme på <html>. Uten data-theme brukes systemvalget.",
  },
  editor: {
    titleNew: "Ny palett",
    titleEdit: "Rediger palett",
    close: "Lukk",
    info: "Om paletten",
    name: "Navn",
    namePlaceholder: "Skriv et navn",
    description: "Beskrivelse",
    descriptionPlaceholder: "Beskriv paletten",
    lightColors: "Farger i lys modus",
    createDark: "Lag en mørk variant",
    darkColors: "Farger i mørk modus",
    cancel: "Avbryt",
    create: "Lag palett",
    update: "Lagre endringer",
    defaultName: "Egen palett",
    defaultDescription: "Min egen fargepalett",
  },
  palette: {
    darkSuffix: "mørk",
    darkDescriptionSuffix: "(mørk modus)",
    sharedName: "Delt palett",
    sharedDescription: "Delt palett",
    savedDescription: "Lagret fra en delt lenke",
  },
};

export type Messages = typeof nb;

const en: Messages = {
  meta: {
    title: "ColorCraft: test color palettes and contrast",
    description:
      "A free color palette tool. See your colors on real components, check contrast against WCAG 2.2, and export as CSS, Tailwind or design tokens.",
    ogLocale: "en_US",
  },
  app: {
    tagline:
      "Test color palettes on real components, check contrast and export tokens",
    share: "Share link",
    shareTitle: "Copy a link to this palette",
    linkCopied: "Link copied!",
    copyFailed: "Copy failed",
    add: "Add palette",
    edit: "Edit",
    delete: "Delete",
    viewing: "Viewing:",
    mode: "Mode:",
    light: "Light",
    dark: "Dark",
    sharedBanner:
      "came from a shared link. It is not saved in this browser yet.",
    saveShared: "Save to my palettes",
    reset: "Reset",
    resetTitle: "Go back to the palette's original colors",
    otherLanguage: "Norsk",
    otherLanguageLabel: "Bytt til norsk",
    footer: "A free tool from",
  },
  selector: {
    title: "Choose palette",
    search: "Search palettes …",
    searchLabel: "Search palettes",
    showing: (n, total) => `Showing ${n} of ${total} palettes`,
    darkAvailable: "Dark variant available",
    toggleDark: "Dark mode",
    previous: "Previous",
    next: "Next",
    page: (p, total) => `Page ${p} of ${total}`,
  },
  preview: {
    nav: ["Home", "About", "Services", "Contact"],
    primaryTitle: "Primary action",
    primaryText:
      "This demonstrates how primary elements look with this color palette.",
    primaryButton: "Get started",
    secondaryTitle: "Secondary action",
    secondaryText:
      "This shows how accent colors work within the overall design system.",
    secondaryButton: "Learn more",
  },
  roles: {
    primary: "Primary",
    secondary: "Secondary",
    accent: "Accent",
    warm: "Warm",
    cool: "Cool",
    background: "Background",
    surface: "Surface",
    foreground: "Foreground",
    muted: "Muted",
    border: "Border",
    success: "Success",
    warning: "Warning",
    error: "Error",
    info: "Info",
  },
  details: {
    swatches: "Color swatches",
    semantic: "Semantic colors",
    copied: "Copied!",
  },
  contrast: {
    title: "Contrast check",
    allPass: "All pairs pass AA",
    below: (n) => `${n} below AA`,
    large: "(large text)",
    invalid: "Invalid color",
    passes: "passes",
    fails: "fails",
    suggest: (color, role, target) =>
      `Try ${color} for ${role.toLowerCase()} to reach ${target}:1`,
    copySuggestion: "Copy the suggested color",
    apply: "Apply",
    applyLabel: (color, role) => `Use ${color} for ${role.toLowerCase()}`,
    copied: "Copied!",
    footnote:
      "WCAG 2.2: AA needs 4.5:1 for text and 3:1 for large text. AAA needs 7:1 and 4.5:1.",
    pairs: {
      "text-background": "Text on background",
      "text-surface": "Text on surface",
      "muted-background": "Muted on background",
      "muted-surface": "Muted on surface",
      "heading-background": "Heading (primary) on background",
      "button-primary": "Button text on primary",
      "button-accent": "Button text on accent",
    },
    decimal: ".",
  },
  export: {
    title: "Export",
    formatLabel: "Export format",
    hints: {
      css: "Light by default, dark from the system setting. Set data-theme on <html> to override.",
      tailwind:
        "Replaces your Tailwind entry CSS. Gives classes like bg-primary and text-on-primary.",
      json: "W3C Design Tokens format. Works with Tokens Studio for Figma and Style Dictionary.",
    },
    copy: "Copy",
    download: "Download",
    copied: "Copied!",
    failed: "Copy failed",
    madeWith: "made with",
    darkVariantComment:
      "dark: follows data-theme on <html>. Without data-theme, the system setting is used.",
  },
  editor: {
    titleNew: "Create new palette",
    titleEdit: "Edit palette",
    close: "Close",
    info: "Palette information",
    name: "Palette name",
    namePlaceholder: "Enter palette name",
    description: "Description",
    descriptionPlaceholder: "Describe your palette",
    lightColors: "Light mode colors",
    createDark: "Create dark mode variant",
    darkColors: "Dark mode colors",
    cancel: "Cancel",
    create: "Create palette",
    update: "Update palette",
    defaultName: "Custom palette",
    defaultDescription: "My custom color palette",
  },
  palette: {
    darkSuffix: "dark",
    darkDescriptionSuffix: "(dark mode)",
    sharedName: "Shared palette",
    sharedDescription: "Shared palette",
    savedDescription: "Saved from a shared link",
  },
};

export const MESSAGES: Record<Locale, Messages> = { nb, en };

/** Engelske beskrivelser av de innebygde palettene. Navnene er stedsnavn og står likt. */
const PALETTE_DESCRIPTIONS_EN: Record<string, string> = {
  havet: "Cool blues and teals",
  solnedgang: "Warm oranges and reds",
  skogen: "Deep greens and browns",
  sande: "Calm greens and earthy tones, like the farming village",
  "verdens-ende": "Blues and purples, like sea and sky at Tjøme",
  ramnes: "Warm earth tones from open fields",
  slottsfjellet: "Regal, noble colors, like the castle hill in Tønsberg",
  kaldnes: "Steel and copper, like the old shipyard in Tønsberg",
  bokeskogen: "Forest with gold and silver, like the beech forest in Larvik",
  larvikitt: "Deep blue with a sheen, like the stone from Larvik",
  lardal: "Natural brown and green forest tones",
  borre: "Burgundy and gold, like the Viking mounds at Borre",
  molen: "Light and pearl grey, like the pebble beach in Larvik",
  ula: "Sun, sand and terracotta by the coast",
  svenner: "Cool teal and silver, like the lighthouse off Larvik",
};

/**
 * Navn og beskrivelse på riktig språk for de innebygde palettene. Egne og
 * delte paletter er skrevet av brukeren og står som de er. Det samme gjelder
 * tekst brukeren har endret i en innebygd palett: bare urørte tekster
 * oversettes.
 */
export function localizePalette(
  p: ExtendedColorPalette,
  locale: Locale,
): ExtendedColorPalette {
  const innebygd = colorPalettes.find((x) => x.id === p.id);
  if (!innebygd || locale === DEFAULT_LOCALE) return p;
  const m = MESSAGES[locale].palette;
  const oversatt = PALETTE_DESCRIPTIONS_EN[p.id] ?? p.description;
  const desc =
    p.description === innebygd.description ? oversatt : p.description;
  const mork = p.darkVariant;
  const morkOrig = innebygd.darkVariant;
  return {
    ...p,
    description: desc,
    ...(mork && {
      darkVariant: {
        ...mork,
        name:
          mork.name === morkOrig?.name
            ? `${p.name} ${m.darkSuffix}`
            : mork.name,
        description:
          mork.description === morkOrig?.description
            ? `${desc} ${m.darkDescriptionSuffix}`
            : mork.description,
      },
    }),
  };
}

/** Kontrastforholdet med desimaltegnet språket bruker (4,54:1 på norsk). */
export function localizeRatio(ratio: string, locale: Locale): string {
  return ratio.replace(".", MESSAGES[locale].contrast.decimal);
}
