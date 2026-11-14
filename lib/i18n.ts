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
    secondaryTitle: "Annen handling",
    secondaryText:
      "Slik fungerer uthevingsfargen sammen med resten av paletten.",
    secondaryButton: "Les mer",
  },
  roles: {
    primary: "Hovedfarge",
    secondary: "Flatefarge",
    accent: "Uthevingsfarge",
    warm: "Varm",
    cool: "Kald",
    background: "Bakgrunn",
    surface: "Kort og bokser",
    foreground: "Tekst",
    muted: "Svak tekst",
    border: "Linjer",
    success: "OK",
    warning: "Advarsel",
    error: "Feil",
    info: "Info",
  } satisfies Record<Role, string>,
  details: {
    swatches: "Fargene",
    semantic: "Varslingsfarger",
    brandTitle: "Merkefargene",
    brandHelp:
      "Fargene fra profilmanualen. Resten av paletten er tilpasset dem.",
    developer: "For utvikleren",
    developerHelp:
      "Paletten som roller i koden, med HEX, RGB og CMYK og eksport. Navnet i koden står i grått.",
    copied: "Kopiert!",
  },
  glossary: {
    title: "Hva betyr ordene?",
    intro:
      "Designere bruker ulike ord om det samme. ColorCraft kaller fargene det de gjør.",
    term: "I ColorCraft",
    aka: "Også kalt",
    use: "Brukes til",
    rows: [
      {
        term: "Logofarge",
        aka: "grunnfarge, primærfarge, hovedfarge",
        use: "Logo, overskrifter og det som skal synes.",
      },
      {
        term: "Flatefarger",
        aka: "støttefarger, tilleggsfarger, sekundærfarger",
        use: "Bakgrunner, seksjoner og infobokser.",
      },
      {
        term: "Uthevingsfarge",
        aka: "highlight, aksentfarge, signalfarge",
        use: "Knapper og enkeltord. Aldri som flate.",
      },
      {
        term: "Tekst og bakgrunn",
        aka: "forgrunn",
        use: "Lages automatisk, så kontrasten blir god nok.",
      },
      {
        term: "Varm og kald",
        aka: "",
        use: "Varmere og kaldere farger fra merket, til grafikk og illustrasjoner.",
      },
      {
        term: "Varslingsfarger",
        aka: "statusfarger",
        use: "Grønn, gul, rød og blå til meldinger på nettsiden. Lages automatisk.",
      },
      {
        term: "Ekstra farger",
        aka: "intern profil",
        use: "Friere farger til PowerPoint og interne dokumenter. Bare internt.",
      },
    ],
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
      "text-surface": "Tekst på kort og bokser",
      "muted-background": "Svak tekst på bakgrunn",
      "muted-surface": "Svak tekst på kort og bokser",
      "heading-background": "Overskrift (hovedfarge) på bakgrunn",
      "button-primary": "Knappetekst på hovedfargen",
      "button-accent": "Knappetekst på uthevingsfargen",
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
      "Lag en palett fra logofargene og flatefargene i en profilmanual",
    title: "Palett fra profilmanual",
    intro:
      "Legg inn fargene fra profilmanualen. Merkefargene endres ikke. Tekst, bakgrunn og varslingsfarger tilpasses, så kontrasten blir god nok.",
    name: "Navn på paletten",
    defaultName: "Ny profil",
    logo: "Logofarger",
    logoHelp: "1–3 farger. Den første er hovedfargen.",
    support: "Flatefarger",
    supportHelp:
      "0–4 farger til bakgrunner, seksjoner og infobokser. Også kalt støttefarger eller tilleggsfarger.",
    highlight: "Uthevingsfarge",
    highlightHelp:
      "0–2 farger til knapper og enkeltord, aldri som flate. Også kalt highlight eller aksentfarge.",
    more: "Flere valg",
    moreHelp:
      "Retning, ekstra farger til internt bruk og sjekk av tallene i manualen.",
    direction: "Retning",
    directionHelp:
      "Kundens føring for uttrykket. Den styrer bare fargene som lages rundt merket: bakgrunn, tekst, kanter, varm og kald. Merkefargene endres ikke.",
    directions: {
      neutral: "Nøytral",
      exclusive: "Eksklusiv",
      sales: "Salgsfremmende",
      tonal: "Ton i ton",
      playful: "Leken",
    },
    directionInfo: {
      neutral: "Balansert, uten særlig føring.",
      exclusive:
        "Dempet og luftig: nesten nøytral bakgrunn, gråere tekst og mindre mettet varm og kald.",
      sales:
        "Høy kontrast: hvit bakgrunn, nesten svart tekst og mer mettet varm og kald.",
      tonal:
        "Ton i ton: bakgrunn, flater og kanter i hovedfargens tone, og små sprang mellom fargene.",
      playful: "Leken: tydelig tonet bakgrunn og mer mettet varm og kald.",
    },
    internal: "Ekstra farger (bare internt)",
    internalHelp:
      "0–6 friere farger til for eksempel PowerPoint og interne dokumenter. Også kalt intern profil. De brukes ikke i paletten for skjerm.",
    suggest: "Foreslå farger",
    check: {
      title: "Sjekk verdiene fra manualen",
      help: "Skriv inn HEX, RGB og CMYK for én farge slik de står i manualen. HEX og RGB er samme tall og må stemme helt. CMYK avhenger av trykkprofilen og kan bare ligne.",
      rgbOk: "HEX og RGB stemmer.",
      rgbMismatch: (rgbHex: string, hex: string) =>
        `RGB-tallene gir ${rgbHex}, men HEX er ${hex}. En av dem er trolig feil.`,
      cmykLike: (hex: string) => `CMYK gir omtrent ${hex}. Det ligner.`,
      cmykNear: (hex: string) =>
        `CMYK gir omtrent ${hex}. Det ligner, men ikke helt. Det kan komme av trykkprofilen.`,
      cmykOff: (hex: string) =>
        `CMYK gir omtrent ${hex}, som er tydelig ulik. Sjekk tallene.`,
      invalid: "Kan ikke lese",
      empty: "Fyll inn minst to av feltene.",
    },
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
      `Logofargen (${from}) er bakgrunnen i mørk modus, slik den brukes som flate på trykk. ${to} er hovedfargen oppå.`,
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
      "Flatefargene som heldekkende flater, slik en profilmanual bruker dem, med logo og tekst oppå. Logoen er grafikk og trenger 3:1. Teksten trenger 4,5:1.",
    introNoBrand:
      "Paletten er ikke laget fra en profilmanual, så flatene her er flatefargen og kort og bokser. Lag en palett med «Fra profilmanual» for å se dine egne flatefarger.",
    support: (n: number) => `Flatefarge ${n}`,
    logoSurface: "Logofargen som flate",
    chapter: (n: number) => `Kapittel ${n}`,
    heading: "Overskrift på flaten",
    body: "Brødtekst på flaten, med",
    highlight: "markert tekst",
    bodyEnd: "i logofargen.",
    bodyEndHighlight: "i uthevingsfargen.",
    infoboxes: "Infobokser på siden",
    infobox: "Infoboks med kort, viktig informasjon.",
    logo: "Logo",
    text: "Tekst",
    logoInverted: "negativ",
    ok: "består",
    fail: "under kravet",
    tints: "Tinter av flaten, med logoen",
    tintLabel: (p: number) => `${p} %`,
  },
  values: {
    title: "HEX, RGB og CMYK",
    outOfGamut: "kan ikke trykkes likt",
    note: "CMYK er omtrentlig: regnet ut fra vanlig offset på bestrøket papir (Coated FOGRA39), uten fargestyring. Til trykk gjelder verdiene fra trykkeriets profil. Farger merket «kan ikke trykkes likt» er mer mettede på skjerm enn trykkfargene klarer.",
    cmykHelp:
      "Skriv CMYK fra manualen, for eksempel 0 25 100 0. Omregnes omtrentlig.",
    cmykInvalid: "Skriv fire tall fra 0 til 100: C M Y K.",
  },
  inUse: {
    tab: "I bruk",
    intro:
      "Merkefargene på trykksaker og en presentasjon: logofargen som hovedflate, uthevingsfargen eller en flatefarge på striper og knapper, og lyst papir. Trykksaker har ikke mørk modus, så her brukes merkefargene direkte.",
    introNoBrand:
      "Paletten på trykksaker og en presentasjon: hovedfargen som hovedflate, og flatefargen eller uthevingsfargen på striper og knapper. Lag en palett med «Fra profilmanual» for å se dine egne merkefarger.",
    rollup: "Rollup",
    ad: "Displayannonse",
    card: "Visittkort",
    slide: "Presentasjon",
    headline: "Overskrift som synes på avstand",
    body: "Kort tekst om hva dere gjør, og for hvem.",
    image: "Bilde",
    services: "Tjeneste · Tjeneste · Tjeneste",
    url: "dittfirma.no",
    adHeadline: "Trenger du hjelp?",
    adSub: "Vi er her for deg.",
    cta: "Ta kontakt",
    person: "Navn Navnesen",
    role: "Daglig leder",
    slideTitle: "Tittel på presentasjonen",
    slideSub: "Undertittel og dato",
    internalSlide: "Intern presentasjon",
    internalOnly: "Bare internt",
    chartTitle: "Resultater i år",
    checksTitle: "Kontrast på trykksakene",
    checks: {
      hero: "Tekst på hovedflaten",
      band: "Tekst på stripen",
      button: "Tekst på knappen",
      paper: "Tekst på lyst papir",
      logoHero: "Logoen i negativ på hovedflaten",
      logoPaper: "Logoen på lyst papir",
    },
  },
  tones: {
    tab: "Valør og varme",
    intro:
      "Hver farge i ti valører, og varmere, kaldere, mer og mindre mettet med samme lyshet. Klikk en farge for å bruke den i paletten.",
    logo: (n: number) => `Logofarge ${n}`,
    support: (n: number) => `Flatefarge ${n}`,
    highlight: (n: number) => `Uthevingsfarge ${n}`,
    internal: (n: number) => `Ekstra farge ${n}`,
    tint: "Tint",
    tintHelp:
      "Fargen trykt med lavere rasterprosent, regnet fra CMYK. Med CMYK fra manualen blir tintene riktigst.",
    tintTitle: (p: number, hex: string, cmyk: string) =>
      `${p} % tint: ${hex}, CMYK ${cmyk}`,
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
    withInUse: "Ta med «I bruk» som side 2",
    downloadPdf: "Last ned PDF",
    downloadPng: "Last ned PNG",
    working: "Lager …",
    failed: "Kunne ikke lage fargekortet",
    logoColors: "Logofarger",
    supportColors: "Flatefarger",
    highlightColors: "Uthevingsfarger",
    internalColors: "Ekstra farger (bare internt)",
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
    tintNote: "Stripene til høyre for hver farge er tint på 60, 40 og 20 %.",
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
    secondaryTitle: "Other action",
    secondaryText:
      "This shows how the highlight color works with the rest of the palette.",
    secondaryButton: "Learn more",
  },
  roles: {
    primary: "Main color",
    secondary: "Area color",
    accent: "Highlight color",
    warm: "Warm",
    cool: "Cool",
    background: "Background",
    surface: "Cards and boxes",
    foreground: "Text",
    muted: "Subtle text",
    border: "Lines",
    success: "Success",
    warning: "Warning",
    error: "Error",
    info: "Info",
  },
  details: {
    swatches: "The colors",
    semantic: "Alert colors",
    brandTitle: "Brand colors",
    brandHelp:
      "The colors from the brand guide. The rest of the palette is fitted to them.",
    developer: "For developers",
    developerHelp:
      "The palette as roles in code, with HEX, RGB and CMYK and export. The name in code is shown in grey.",
    copied: "Copied!",
  },
  glossary: {
    title: "What do the words mean?",
    intro:
      "Designers use different words for the same thing. ColorCraft names the colors after what they do.",
    term: "In ColorCraft",
    aka: "Also called",
    use: "Used for",
    rows: [
      {
        term: "Logo color",
        aka: "base color, primary color, main color",
        use: "The logo, headings and what should stand out.",
      },
      {
        term: "Area colors",
        aka: "support colors, additional colors, secondary colors",
        use: "Backgrounds, sections and info boxes.",
      },
      {
        term: "Highlight color",
        aka: "accent color, signal color",
        use: "Buttons and single words. Never as an area.",
      },
      {
        term: "Text and background",
        aka: "foreground",
        use: "Made automatically, so the contrast is good enough.",
      },
      {
        term: "Warm and cool",
        aka: "",
        use: "Warmer and cooler colors from the brand, for graphics and illustrations.",
      },
      {
        term: "Alert colors",
        aka: "status colors, semantic colors",
        use: "Green, yellow, red and blue for messages on the website. Made automatically.",
      },
      {
        term: "Extra colors",
        aka: "internal profile",
        use: "Freer colors for PowerPoint and internal documents. Internal only.",
      },
    ],
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
      "text-surface": "Text on cards and boxes",
      "muted-background": "Subtle text on background",
      "muted-surface": "Subtle text on cards and boxes",
      "heading-background": "Heading (main color) on background",
      "button-primary": "Button text on the main color",
      "button-accent": "Button text on the highlight color",
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
      "Create a palette from the logo and area colors in a brand guide",
    title: "Palette from brand guide",
    intro:
      "Enter the colors from the brand guide. The brand colors are not changed. Text, background and alert colors are adjusted so the contrast is good enough.",
    name: "Palette name",
    defaultName: "New brand",
    logo: "Logo colors",
    logoHelp: "1–3 colors. The first one is the main color.",
    support: "Area colors",
    supportHelp:
      "0–4 colors for backgrounds, sections and info boxes. Also called support or additional colors.",
    highlight: "Highlight color",
    highlightHelp:
      "0–2 colors for buttons and single words, never as an area. Also called accent color.",
    more: "More options",
    moreHelp:
      "Direction, extra colors for internal use and a check of the numbers in the brand guide.",
    direction: "Direction",
    directionHelp:
      "The client's brief for the look. It only steers the colors made around the brand: background, text, borders, warm and cool. The brand colors are not changed.",
    directions: {
      neutral: "Neutral",
      exclusive: "Exclusive",
      sales: "Sales-driven",
      tonal: "Tone on tone",
      playful: "Playful",
    },
    directionInfo: {
      neutral: "Balanced, with no particular brief.",
      exclusive:
        "Muted and airy: an almost neutral background, greyer text and less saturated warm and cool.",
      sales:
        "High contrast: white background, near-black text and more saturated warm and cool.",
      tonal:
        "Tone on tone: background, surfaces and borders in the main color's hue, with small steps between colors.",
      playful:
        "Playful: a clearly tinted background and more saturated warm and cool.",
    },
    internal: "Extra colors (internal only)",
    internalHelp:
      "0–6 freer colors for things like PowerPoint and internal documents. Also called an internal profile. They are not used in the screen palette.",
    suggest: "Suggest colors",
    check: {
      title: "Check the values from the brand guide",
      help: "Enter HEX, RGB and CMYK for one color as they appear in the brand guide. HEX and RGB are the same numbers and must match exactly. CMYK depends on the print profile and can only be similar.",
      rgbOk: "HEX and RGB match.",
      rgbMismatch: (rgbHex, hex) =>
        `The RGB numbers give ${rgbHex}, but HEX is ${hex}. One of them is probably wrong.`,
      cmykLike: (hex) => `CMYK gives about ${hex}. That is a match.`,
      cmykNear: (hex) =>
        `CMYK gives about ${hex}. Close, but not quite. That can be the print profile.`,
      cmykOff: (hex) =>
        `CMYK gives about ${hex}, which is clearly different. Check the numbers.`,
      invalid: "Can't read",
      empty: "Fill in at least two of the fields.",
    },
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
      `The logo color (${from}) is the background in dark mode, the way it is used as a surface in print. ${to} is the main color on top.`,
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
      "The area colors as full surfaces, the way a brand guide uses them, with the logo and text on top. The logo is a graphic and needs 3:1. Text needs 4.5:1.",
    introNoBrand:
      "This palette was not made from a brand guide, so the surfaces here are the area color and cards and boxes. Create a palette with “From brand guide” to see your own area colors.",
    support: (n) => `Area color ${n}`,
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
    tints: "Tints of the surface, with the logo",
    tintLabel: (p) => `${p}%`,
  },
  values: {
    title: "HEX, RGB and CMYK",
    outOfGamut: "can't be printed exactly",
    note: "CMYK is approximate: calculated for standard offset on coated paper (Coated FOGRA39), without color management. For print, use the values from your printer's profile. Colors marked “can't be printed exactly” are more saturated on screen than process inks can reach.",
    cmykHelp:
      "Enter CMYK from the brand guide, for example 0 25 100 0. Converted approximately.",
    cmykInvalid: "Enter four numbers from 0 to 100: C M Y K.",
  },
  inUse: {
    tab: "In use",
    intro:
      "The brand colors on print and a presentation: the logo color as the main surface, the highlight color or an area color on stripes and buttons, and light paper. Print has no dark mode, so the brand colors are used directly.",
    introNoBrand:
      "The palette on print and a presentation: the main color as the main surface, and the area color or highlight color on stripes and buttons. Create a palette with “From brand guide” to see your own brand colors.",
    rollup: "Roll-up banner",
    ad: "Display ad",
    card: "Business card",
    slide: "Presentation",
    headline: "A headline you can read from afar",
    body: "A short line about what you do, and for whom.",
    image: "Image",
    services: "Service · Service · Service",
    url: "yourcompany.com",
    adHeadline: "Need a hand?",
    adSub: "We're here for you.",
    cta: "Get in touch",
    person: "Jane Doe",
    role: "Managing director",
    slideTitle: "Presentation title",
    slideSub: "Subtitle and date",
    internalSlide: "Internal presentation",
    internalOnly: "Internal only",
    chartTitle: "Results this year",
    checksTitle: "Contrast in print",
    checks: {
      hero: "Text on the main surface",
      band: "Text on the stripe",
      button: "Text on the button",
      paper: "Text on light paper",
      logoHero: "Logo in negative on the main surface",
      logoPaper: "Logo on light paper",
    },
  },
  tones: {
    tab: "Value and warmth",
    intro:
      "Each color in ten values, plus warmer, cooler, more and less saturated at the same lightness. Click a color to use it in the palette.",
    logo: (n) => `Logo color ${n}`,
    support: (n) => `Area color ${n}`,
    highlight: (n) => `Highlight color ${n}`,
    internal: (n) => `Extra color ${n}`,
    tint: "Tint",
    tintHelp:
      "The color printed at a lower screen percentage, calculated from CMYK. With CMYK from the brand guide, the tints are most accurate.",
    tintTitle: (p, hex, cmyk) => `${p}% tint: ${hex}, CMYK ${cmyk}`,
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
    withInUse: "Include “In use” as page 2",
    downloadPdf: "Download PDF",
    downloadPng: "Download PNG",
    working: "Working …",
    failed: "Could not create the color card",
    logoColors: "Logo colors",
    supportColors: "Area colors",
    highlightColors: "Highlight colors",
    internalColors: "Extra colors (internal only)",
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
    tintNote:
      "The stripes to the right of each color are 60, 40 and 20% tints.",
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
