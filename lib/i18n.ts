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
    home: "ColorCraft, til forsiden",
    theme: { system: "System", light: "Lys", dark: "Mørk" },
    themeLabel: (navn: string) => `Utseende: ${navn}. Trykk for å bytte.`,
    paletteMode: "Vis paletten i",
    paletteActions: "Handlinger for paletten",
    paletteList: "Paletter",
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
    siteName: "Din bedrift",
    siteTagline: "Slik kan nettsiden se ut med denne paletten",
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
  brand: {
    open: "Fra profilmanual",
    openTitle:
      "Lag en palett fra logofargene og støttefargene i en profilmanual",
    title: "Palett fra profilmanual",
    intro:
      "Legg inn fargene fra profilmanualen. Logofargene brukes til det som skal synes, som overskrifter og logo. Støttefargene er flatefarger. Highlight er farger som bare brukes i små doser, som knapper og enkeltord. Merkefargene endres ikke. Det er tekst, bakgrunn og statusfarger som tilpasses, så kontrasten består.",
    name: "Navn på paletten",
    defaultName: "Ny profil",
    logo: "Logofarger",
    logoHelp: "1–3 farger. Den første er hovedfargen.",
    support: "Støttefarger",
    supportHelp: "0–4 flatefarger: bakgrunner, seksjoner og infobokser.",
    highlight: "Highlight",
    highlightHelp:
      "0–2 farger som bare brukes i små doser: knapper og enkeltord. Aldri som flate.",
    colorName: "Navn (valgfritt)",
    colorNamePlaceholder: "For eksempel Varm rørfarge",
    add: "Legg til farge",
    remove: (n: number) => `Fjern farge ${n}`,
    invalid: "Ugyldig farge. Skriv HEX, for eksempel #F2B705.",
    preview: "Slik blir paletten",
    light: "Lys",
    dark: "Mørk",
    allPass: "Alle kontrastparene består AA i begge moduser.",
    failing: (n: number) =>
      `${n} kontrastpar er under AA. Du ser hvilke i kontrastsjekken etterpå.`,
    noteDark: (role: string, from: string, to: string) =>
      `${role} er lysnet fra ${from} til ${to} i mørk modus, så den synes mot den mørke bakgrunnen.`,
    noteLogoBackground: (from: string, to: string) =>
      `Logofargen (${from}) er bakgrunnen i mørk modus, slik den brukes som flate på trykk. ${to} er primærfargen oppå.`,
    noteLight: (role: string, color: string, ratio: string) =>
      `${role} (${color}) har ${ratio} mot den lyse bakgrunnen. Den passer best som flate eller grafikk, ikke til tekst.`,
    description: "Laget fra profilmanual",
    create: "Lag palett",
    cancel: "Avbryt",
  },
  surfaces: {
    tabComponents: "Komponenter",
    tabSurfaces: "Flater",
    tabsLabel: "Forhåndsvisning",
    intro:
      "Støttefargene som heldekkende flater, slik en profilmanual bruker dem, med logo og tekst oppå. Logoen er grafikk og trenger 3:1. Teksten trenger 4,5:1.",
    introNoBrand:
      "Paletten er ikke laget fra en profilmanual, så flatene her er secondary og surface. Lag en palett med «Fra profilmanual» for å se dine egne støttefarger.",
    support: (n: number) => `Støttefarge ${n}`,
    logoSurface: "Logofargen som flate",
    chapter: (n: number) => `Kapittel ${n}`,
    heading: "Overskrift på flaten",
    body: "Brødtekst på flaten, med",
    highlight: "markert tekst",
    bodyEnd: "i logofargen.",
    bodyEndHighlight: "i highlightfargen.",
    infoboxes: "Infobokser på siden",
    infobox: "Infoboks med kort, viktig informasjon.",
    logo: "Logo",
    text: "Tekst",
    logoInverted: "negativ",
    ok: "består",
    fail: "under kravet",
  },
  values: {
    title: "HEX, RGB og CMYK",
    outOfGamut: "kan ikke trykkes likt",
    note: "CMYK er omtrentlig: regnet ut fra vanlig offset på bestrøket papir (Coated FOGRA39), uten fargestyring. Til trykk gjelder verdiene fra trykkeriets profil. Farger merket «kan ikke trykkes likt» er mer mettede på skjerm enn trykkfargene klarer.",
    cmykHelp:
      "Skriv CMYK fra manualen, for eksempel 0 25 100 0. Omregnes omtrentlig.",
    cmykInvalid: "Skriv fire tall fra 0 til 100: C M Y K.",
  },
  tones: {
    tab: "Valør og varme",
    intro:
      "Hver farge i ti valører, og varmere, kaldere, mer og mindre mettet med samme lyshet. Klikk en farge for å bruke den i paletten.",
    logo: (n: number) => `Logofarge ${n}`,
    support: (n: number) => `Støttefarge ${n}`,
    highlight: (n: number) => `Highlight ${n}`,
    applyAs: "Bruk som",
    valor: "Valør",
    variants: "Varme og metning",
    warmer: "Varmere",
    cooler: "Kaldere",
    more: "Mer mettet",
    less: "Mindre mettet",
    original: "original",
    textOk: "Aa betyr at fargen består som tekst (4,5:1) mot bakgrunnen.",
    apply: (hex: string, role: string) =>
      `Bruk ${hex} som ${role.toLowerCase()}`,
    applied: (hex: string, role: string) =>
      `${hex} er brukt som ${role.toLowerCase()}.`,
  },
  card: {
    title: "Fargekort",
    panelTitle: "Fargekort til kunden",
    panelHelp:
      "PDF eller PNG med fargene, HEX, RGB, CMYK og kontrast. Lages i nettleseren.",
    maker: "Laget av (valgfritt)",
    makerPlaceholder: "Ditt navn eller firma",
    downloadPdf: "Last ned PDF",
    downloadPng: "Last ned PNG",
    working: "Lager …",
    failed: "Kunne ikke lage fargekortet",
    logoColors: "Logofarger",
    supportColors: "Støttefarger",
    highlightColors: "Highlight",
    mainColors: "Hovedfarger",
    fromManual: "(fra manualen)",
    approx: "ca.",
    outOfGamut: "kan ikke trykkes likt",
    whiteText: "Hvit tekst",
    blackText: "Svart tekst",
    contrastHeading: "Kontrast i paletten (lys modus)",
    belowAA: "under AA",
    madeBy: (navn: string) => `Laget av ${navn}`,
    madeWith: "Laget med ColorCraft · farger.borresendigital.no",
    note: "CMYK merket ca. er omtrentlig: regnet ut for vanlig offset på bestrøket papir (Coated FOGRA39), uten fargestyring. Til trykk gjelder verdiene fra trykkeriets profil. Kontrast er etter WCAG 2.2: AA krever 4,5:1 for tekst.",
    filePrefix: "fargekort",
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
    home: "ColorCraft, home",
    theme: { system: "System", light: "Light", dark: "Dark" },
    themeLabel: (name) => `Appearance: ${name}. Click to switch.`,
    paletteMode: "Show the palette in",
    paletteActions: "Palette actions",
    paletteList: "Palettes",
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
    siteName: "Your business",
    siteTagline: "This is how the website could look with this palette",
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
  brand: {
    open: "From brand guide",
    openTitle:
      "Create a palette from the logo and support colors in a brand guide",
    title: "Palette from brand guide",
    intro:
      "Enter the colors from the brand guide. Logo colors are used for what should stand out, like headings and the logo. Support colors are surface colors. Highlight colors are only used in small doses, like buttons and single words. The brand colors are not changed. Text, background and status colors are adjusted so the contrast passes.",
    name: "Palette name",
    defaultName: "New brand",
    logo: "Logo colors",
    logoHelp: "1–3 colors. The first one is the main color.",
    support: "Support colors",
    supportHelp: "0–4 surface colors: backgrounds, sections and info boxes.",
    highlight: "Highlight",
    highlightHelp:
      "0–2 colors used only in small doses: buttons and single words. Never as a surface.",
    colorName: "Name (optional)",
    colorNamePlaceholder: "For example Warm pipe color",
    add: "Add color",
    remove: (n) => `Remove color ${n}`,
    invalid: "Invalid color. Use HEX, for example #F2B705.",
    preview: "Your palette",
    light: "Light",
    dark: "Dark",
    allPass: "All contrast pairs pass AA in both modes.",
    failing: (n) =>
      `${n} contrast pairs are below AA. The contrast check shows which ones afterwards.`,
    noteDark: (role, from, to) =>
      `${role} is lightened from ${from} to ${to} in dark mode so it stands out against the dark background.`,
    noteLogoBackground: (from, to) =>
      `The logo color (${from}) is the background in dark mode, the way it is used as a surface in print. ${to} is the primary color on top.`,
    noteLight: (role, color, ratio) =>
      `${role} (${color}) has ${ratio} against the light background. It works best as a surface or graphic, not for text.`,
    description: "Made from a brand guide",
    create: "Create palette",
    cancel: "Cancel",
  },
  surfaces: {
    tabComponents: "Components",
    tabSurfaces: "Surfaces",
    tabsLabel: "Preview",
    intro:
      "The support colors as full surfaces, the way a brand guide uses them, with the logo and text on top. The logo is a graphic and needs 3:1. Text needs 4.5:1.",
    introNoBrand:
      "This palette was not made from a brand guide, so the surfaces here are secondary and surface. Create a palette with “From brand guide” to see your own support colors.",
    support: (n) => `Support color ${n}`,
    logoSurface: "Logo color as a surface",
    chapter: (n) => `Chapter ${n}`,
    heading: "Heading on the surface",
    body: "Body text on the surface, with",
    highlight: "highlighted text",
    bodyEnd: "in the logo color.",
    bodyEndHighlight: "in the highlight color.",
    infoboxes: "Info boxes on the page",
    infobox: "Info box with short, important information.",
    logo: "Logo",
    text: "Text",
    logoInverted: "reversed",
    ok: "passes",
    fail: "below the requirement",
  },
  values: {
    title: "HEX, RGB and CMYK",
    outOfGamut: "can't be printed exactly",
    note: "CMYK is approximate: calculated for standard offset on coated paper (Coated FOGRA39), without color management. For print, use the values from your printer's profile. Colors marked “can't be printed exactly” are more saturated on screen than process inks can reach.",
    cmykHelp:
      "Enter CMYK from the brand guide, for example 0 25 100 0. Converted approximately.",
    cmykInvalid: "Enter four numbers from 0 to 100: C M Y K.",
  },
  tones: {
    tab: "Value and warmth",
    intro:
      "Each color in ten values, plus warmer, cooler, more and less saturated at the same lightness. Click a color to use it in the palette.",
    logo: (n) => `Logo color ${n}`,
    support: (n) => `Support color ${n}`,
    highlight: (n) => `Highlight ${n}`,
    applyAs: "Use as",
    valor: "Value",
    variants: "Warmth and saturation",
    warmer: "Warmer",
    cooler: "Cooler",
    more: "More saturated",
    less: "Less saturated",
    original: "original",
    textOk: "Aa means the color passes as text (4.5:1) on the background.",
    apply: (hex, role) => `Use ${hex} as ${role.toLowerCase()}`,
    applied: (hex, role) => `${hex} is now used as ${role.toLowerCase()}.`,
  },
  card: {
    title: "Color card",
    panelTitle: "Color card for the client",
    panelHelp:
      "PDF or PNG with the colors, HEX, RGB, CMYK and contrast. Made in your browser.",
    maker: "Made by (optional)",
    makerPlaceholder: "Your name or company",
    downloadPdf: "Download PDF",
    downloadPng: "Download PNG",
    working: "Working …",
    failed: "Could not create the color card",
    logoColors: "Logo colors",
    supportColors: "Support colors",
    highlightColors: "Highlight",
    mainColors: "Main colors",
    fromManual: "(from the brand guide)",
    approx: "approx.",
    outOfGamut: "can't be printed exactly",
    whiteText: "White text",
    blackText: "Black text",
    contrastHeading: "Contrast in the palette (light mode)",
    belowAA: "below AA",
    madeBy: (name) => `Made by ${name}`,
    madeWith: "Made with ColorCraft · farger.borresendigital.no",
    note: "CMYK marked approx. is approximate: calculated for standard offset on coated paper (Coated FOGRA39), without color management. For print, use the values from your printer's profile. Contrast follows WCAG 2.2: AA needs 4.5:1 for text.",
    filePrefix: "color-card",
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
