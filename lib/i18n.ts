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
  account: {
    metaTitle: "Konto · ColorCraft",
    title: "Logg inn",
    titleSignedIn: "Kontoen din",
    loading: "Henter …",
    notEnabled:
      "Kontoer er på vei, men ikke slått på ennå. Verktøyet virker som før uten konto.",
    intro:
      "Ingen passord. Du får en innloggingslenke på e-post, og kan legge til en passkey (Face ID, fingeravtrykk eller Windows Hello) for neste gang.",
    email: "E-postadresse",
    sendLink: "Send innloggingslenke",
    sending: "Sender …",
    sentTitle: "Sjekk e-posten din",
    sent: (epost: string) =>
      `Vi har sendt en innloggingslenke til ${epost}. Den virker i ti minutter.`,
    tryAgain: "Bruk en annen adresse eller send på nytt",
    sendFailed: "Kunne ikke sende lenken. Prøv igjen om litt.",
    rateLimited: "For mange forsøk. Vent noen minutter og prøv igjen.",
    passkeyIntro: "Har du lagt til en passkey, kan du logge inn med den.",
    passkeySignIn: "Logg inn med passkey",
    passkeyFailed: "Innloggingen med passkey ble avbrutt eller virket ikke.",
    signedInAs: "Logget inn som",
    signOut: "Logg ut",
    passkeys: "Passkeys",
    passkeysHelp:
      "En passkey lar deg logge inn uten e-postlenke. Den private nøkkelen blir på enheten din.",
    noPasskeys: "Ingen passkeys ennå.",
    addPasskey: "Legg til passkey",
    passkeyDefaultName: "Passkey",
    passkeyAdded: "Passkeyen er lagt til.",
    passkeyAddFailed: "Passkeyen ble ikke lagt til.",
    passkeyRemoveFailed: "Kunne ikke fjerne passkeyen.",
    remove: "Fjern",
    profiles: "Mine profiler",
    profilesHelp:
      "Profiler du har lagret fra profilsiden. Den korte lenken viser alltid siste lagrede versjon.",
    noProfiles:
      "Ingen lagrede profiler ennå. Åpne en profilside og trykk «Lagre i kontoen».",
    open: "Åpne",
    copyLink: "Kopier lenke",
    copied: "Kopiert",
    deleteProfile: "Slett",
    deleteProfileConfirm: (tittel: string) =>
      `Slette «${tittel}»? Den korte lenken slutter å virke.`,
    updated: "Oppdatert",
    mcp: "AI og MCP",
    mcpHelp:
      "Med et MCP-token kan en AI som Claude lese, lage og oppdatere profilene dine. Den kan ikke slette dem. Tokenet vises bare én gang, og du kan trekke det tilbake når som helst.",
    mcpName: "Navn på tokenet",
    mcpNamePlaceholder: "f.eks. Claude på jobb-PC-en",
    mcpCreate: "Lag token",
    mcpCreated:
      "Kopier tokenet nå. Det vises ikke igjen. Legg det inn i Claude Code med kommandoen under.",
    mcpCopyToken: "Kopier token",
    mcpCopyCommand: "Kopier kommandoen",
    mcpNone: "Ingen tokens.",
    mcpLastUsed: "Sist brukt",
    mcpNeverUsed: "Aldri brukt",
    mcpRevoke: "Trekk tilbake",
    mcpRevokeConfirm: (navn: string) =>
      `Trekke tilbake «${navn}»? Det slutter å virke med en gang.`,
    mcpLimit: "Du kan ha opptil 10 tokens. Trekk tilbake ett først.",
    yourData: "Dine data",
    exportHelp: "Last ned alt vi har lagret om kontoen din, som en JSON-fil.",
    export: "Last ned mine data",
    deleteTitle: "Slett kontoen",
    deleteHelp:
      "Kontoen, innloggingene, passkeyene, MCP-tokenene og de lagrede profilene slettes for godt, og de korte lenkene slutter å virke. Paletter i nettleseren og vanlige lenker du har delt, påvirkes ikke.",
    deleteConfirm: (epost: string) => `Skriv ${epost} for å bekrefte`,
    deleteButton: "Slett kontoen for godt",
    deleteNeedsFresh:
      "Av sikkerhetshensyn må du ha logget inn de siste ti minuttene. Logg ut, logg inn på nytt og prøv igjen.",
    privacyNote:
      "Vi lagrer e-postadressen din og det som trengs for innloggingen.",
    privacyLink: "Les om personvern",
    signIn: "Logg inn",
    account: "Konto",
  },
  privacy: {
    metaTitle: "Personvern · ColorCraft",
    title: "Personvern i ColorCraft",
    intro:
      "ColorCraft kan brukes uten konto. Da ligger alt i nettleseren din og i lenken, og ingenting sendes til oss. Denne siden gjelder deg som lager en konto.",
    sections: [
      {
        heading: "Behandlingsansvarlig",
        body: "Børresen Digital (org.nr. 938 537 720), et enkeltpersonforetak drevet av Marcus Børresen. Spørsmål om personvern sendes via kontaktskjemaet på borresendigital.no.",
      },
      {
        heading: "Hva vi lagrer",
        body: "E-postadressen din. For hver innlogging: når den startet og utløper, og IP-adressen og nettleseren du brukte, for sikkerhet og mot misbruk. For passkeys: navnet, når den ble laget og den offentlige nøkkelen. Den private nøkkelen forlater aldri enheten din. Innloggingslenken har en engangskode som virker i ti minutter. Profilene du lagrer, med farger, tekst og logo, vises for alle som har den korte lenken. For MCP-tokens lagrer vi navnet, starten av tokenet og når det sist ble brukt, ikke selve tokenet.",
      },
      {
        heading: "Hvorfor",
        body: "For å gi deg kontoen du har bedt om (avtale, personvernforordningen artikkel 6 nr. 1 b), og for å beskytte tjenesten mot misbruk (berettiget interesse, artikkel 6 nr. 1 f).",
      },
      {
        heading: "Hvor",
        body: "I ColorCraft sin database hos Cloudflare (D1), lagret i EU. Innloggingslenker sendes med e-postleverandøren Resend. Cloudflare Turnstile sjekker at det er et menneske som ber om en lenke.",
      },
      {
        heading: "Informasjonskapsler",
        body: "Bare den som holder deg innlogget, som er nødvendig for at kontoen skal virke. Ingen sporing og ingen reklame.",
      },
      {
        heading: "Hvor lenge",
        body: "Til du sletter kontoen. En innlogging utløper etter 30 dager uten bruk.",
      },
      {
        heading: "Rettighetene dine",
        body: "På kontosiden kan du laste ned alle opplysningene og slette kontoen selv. Du har også rett til innsyn, retting, begrensning, protest og dataportabilitet. Mener du at opplysningene behandles i strid med regelverket, kan du klage til Datatilsynet.",
      },
    ],
    back: "Tilbake til ColorCraft",
  },
  views: {
    label: "Sider",
    tool: "Verktøy",
    profile: "Profilside",
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
    editRoles: "Juster roller",
    editRolesTitle:
      "Endre hver rolle for seg (hovedfarge, tekst, bakgrunn …). Endringene forsvinner hvis du senere endrer merkefargene.",
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
    profile: "Profilside",
    profileTitle: "Åpne fargeprofilen som en side du kan sende til kunden",
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
    importButton: "Importer profil (JSON)",
    importHelp:
      "Har du en profilfil fra profilsiden? Importer den, så fylles skjemaet ut. Du ser over fargene før paletten lages.",
    imported: (navn: string, farger: number) =>
      `Importert «${navn}» med ${farger} ${farger === 1 ? "farge" : "farger"}. Se over fargene og trykk «Lag palett».`,
    importedExtras:
      "Typografi, bruksregler, Pantone og «Laget av» fra filen følger med til profilsiden.",
    importedDropped: (n: number) =>
      `${n} ${n === 1 ? "farge" : "farger"} fikk ikke plass i gruppen sin og er utelatt.`,
    importErrors: {
      size: "Filen er for stor til å være en profil.",
      json: "Filen er ikke gyldig JSON.",
      format:
        "Dette er ikke en profilfil fra ColorCraft. Bruk «Profil (JSON)» under Eksport på profilsiden.",
      version: "Profilfilen er fra en nyere versjon av ColorCraft.",
      colors: "Profilfilen har ingen gyldige farger.",
    },
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
    pickColor: "Velg farge",
    colorNamePlaceholder: "For eksempel Varm rørfarge",
    add: "Legg til farge",
    remove: (n: number) => `Fjern farge ${n}`,
    invalid: "Ugyldig farge. Skriv HEX, for eksempel #F2B705.",
    preview: "Slik blir paletten",
    light: "Lys",
    dark: "Mørk",
    allPass: "Alle kontrastparene består AA i begge moduser.",
    allPassLight: "Alle kontrastparene består AA.",
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
    editTitle: (name: string) => `Endre «${name}»`,
    save: "Lagre endringer",
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
  profile: {
    metaTitle: "Fargeprofil · ColorCraft",
    metaDescription:
      "Fargeprofilen til en merkevare: fargene med HEX, RGB og CMYK, tinter, kontrast og eksempler i bruk.",
    eyebrow: "Fargeprofil",
    madeBy: (navn: string) => `Laget av ${navn}`,
    madeWith: "Laget med ColorCraft",
    usage: {
      logo: "Fargene i logoen. De bærer merket og brukes der det skal kjennes igjen.",
      support:
        "Flatefarger: heldekkende bakgrunner, inndeling av større områder, infobokser og kapitler. Tintene kan brukes som lysere flater.",
      highlight:
        "Brukes i små doser: knapper, linjer, ikoner og enkeltord. Ikke som flate.",
      internal:
        "Bare til intern bruk, for eksempel i presentasjoner. Ikke en del av den eksterne profilen.",
      main: "Hovedfargene i paletten.",
    },
    copy: (verdi: string) => `Kopier ${verdi}`,
    copied: "Kopiert",
    tints: "Tinter",
    cmykManual: "CMYK fra manualen",
    cmykApprox: "CMYK omtrentlig, se merknaden nederst",
    whiteText: "Hvit tekst",
    blackText: "Svart tekst",
    belowAA: "under AA",
    inUse: "Slik ser det ut",
    surfaces: "Flatene",
    contrast: "Kontrast i paletten",
    contrastHelp: "Tekst skal ha minst 4,5:1 (AA etter WCAG 2.2).",
    download: "Fargekort til utskrift",
    empty: "Det er ingen fargeprofil i denne lenken.",
    emptyHelp:
      "Lag eller velg en palett i ColorCraft, og trykk «Profilside» øverst.",
    openTool: "Åpne ColorCraft",
    toolbar: "For deg som designer",
    toolbarHelp:
      "Denne linjen og knappene for bruksregler vises ikke for utskrift. Lenken til kunden inneholder fargene, navnet ditt, typografien, bruksreglene og logoen, og åpner siden uten knappene for redigering.",
    maker: "Laget av",
    makerPlaceholder: "Ditt navn eller firma",
    copyLink: "Kopier lenke til kunden",
    previewClient: "Se kundens visning",
    linkCopied: "Lenke kopiert!",
    copyFailed: "Kunne ikke kopiere",
    print: "Skriv ut",
    edit: "Rediger i ColorCraft",
    logo: "Last opp logo",
    logoInLink: "Ta med logoen i lenken",
    logoWorking: "Gjør logoen klar …",
    logoSize: (tegn: number) =>
      `Logoen gjør lenken ${tegn.toLocaleString("nb-NO")} tegn lengre.`,
    logoTooBig:
      "Logoen er for stor til å ligge i lenken. Prøv en SVG eller et mindre bilde.",
    rules: "Bruksregler",
    rulesWrite: "Skriv egne bruksregler",
    rulesChange: "Endre bruksreglene",
    rulesAdd: "Legg til generelle bruksregler",
    rulesDone: "Ferdig",
    rulesReset: "Bruk standardteksten",
    rulesRemove: "Fjern reglene",
    rulesLabel: (gruppe: string) => `Bruksregler for ${gruppe.toLowerCase()}`,
    rulesHelp: (maks: number) =>
      `Én regel per linje blir en punktliste. Lagres i lenken, opptil ${maks} tegn.`,
    rulesGeneralHelp:
      "For eksempel hvor logoen kan stå, minste størrelse, eller farger som ikke skal brukes sammen.",
    pantoneAdd: "+ Pantone",
    pantoneChange: "Endre Pantone",
    pantoneLabel: (farge: string) => `Pantone for ${farge}`,
    pantonePlaceholder: "f.eks. 2945 C",
    pantoneHelp:
      "Skriv nummeret fra manualen. ColorCraft regner ikke om til Pantone.",
    pantoneSource: "Pantone fra manualen",
    onThisPage: "På denne siden",
    navColors: "Farger",
    navInUse: "I bruk",
    navContrast: "Kontrast",
    export: "Eksport",
    exportHelp:
      "Fargene, tonetrappen og typografien i formatet du trenger. Filene lages i nettleseren.",
    exportCode: "Filer til nettside, app og Figma",
    exportCodeHelp:
      "For den som lager nettsiden eller appen. Velg format, og kopier eller last ned.",
    exportFormats: "Format",
    exportGroups: {
      web: "Nett",
      design: "Design",
      apps: "Apper",
      data: "Data",
    },
    exportHints: {
      css: "CSS-variabler i :root. Lim inn i stilarket og bruk var(--color-navn).",
      scss: "Sass-variabler, og et kart per tonetrapp: map.get($color-navn-tones, 500).",
      tailwind:
        "Tailwind 4: @theme gir klasser som bg-navn-500 og font-overskrifter.",
      tokens:
        "Design tokens (DTCG) med HEX. Leses av Style Dictionary og Tokens Studio.",
      figma:
        "Figma: åpne Variables, lag en ny samling og dra filen inn. Hver fil blir en modus.",
      swift:
        "SwiftUI: Color.navn og Color.navn500, og fontnavnene i BrandFont.",
      flutter: "Flutter: BrandColors.navn og BrandFonts med vekt.",
      android: "Android: colors.xml i res/values. Bruk @color/navn.",
      profile:
        "Hele profilen som data: farger, tonetrapp, typografi, bruksregler og Pantone. Tenkt for andre verktøy, og for AI som skal lese eller lage en profil.",
    },
    figmaNames: {
      colors: "Farger",
      tones: "Tonetrapp",
      typography: "Typografi",
      font: "Font",
      fallback: "Reservefont",
      weight: "Vekt",
      size: "Størrelse",
      note: "Merknad",
    },
    saveToAccount: "Lagre i kontoen",
    saveUpdate: "Oppdater lagret profil",
    saveAsNew: "Lagre som ny",
    saveSignIn: "Logg inn for å lagre",
    saving: "Lagrer …",
    saved: "Lagret.",
    saveFailed: "Kunne ikke lagre profilen.",
    saveLimit: "Du har nådd grensen på 100 profiler. Slett noen på kontosiden.",
    shortLink: "Kort lenke",
    copyShort: "Kopier",
    tones: "Tonetrapp",
    tonesHelp:
      "Hver merkefarge i elleve trinn fra lys til mørk, til nettsider og apper. Fargen selv står uendret på trinnet som passer best.",
    tonesShow: "Vis tonetrappen",
    tonesBase: "fargen selv",
    tonesCopy: "Kopier som CSS",
    tonesCopyAll: "Kopier alle som CSS",
    tonesCopied: "Kopiert",
    tonesCssNote:
      "Trinnene går fra 50 (lysest) til 950 (mørkest), som i de fleste designsystemer, og fargen selv er merket med en prikk. Variablene (--color-navn-500) virker i vanlig CSS og i @theme i Tailwind 4.",
    vision: "Se siden som",
    visionNormal: "Vanlig fargesyn",
    visions: {
      protanopia: "Protanopi (rødblind)",
      deuteranopia: "Deuteranopi (grønnblind)",
      tritanopia: "Tritanopi (blå-gul)",
      achromatopsia: "Akromatopsi (uten farger)",
    },
    visionsShort: {
      protanopia: "Protanopi",
      deuteranopia: "Deuteranopi",
      tritanopia: "Tritanopi",
      achromatopsia: "Akromatopsi",
    },
    colorblind: "Fargeblindhet",
    colorblindHelp:
      "Slik ser fargene ut med de vanligste formene for nedsatt fargesyn. Rød-grønn fargeblindhet (protanopi og deuteranopi) er vanligst, særlig hos menn. Simuleringen er en modell (Machado 2009) og viser full fargeblindhet. De fleste har en mildere form.",
    colorblindColor: "Farge",
    colorblindSimilar: (a: string, b: string) =>
      `${a} og ${b} blir vanskelige å skille.`,
    colorblindNone: "Ingen av fargene blir for like.",
    colorblindTip:
      "Farger som blir like, bør ikke være det eneste som skiller ting fra hverandre. Bruk også tekst, ikoner, mønster eller ulik lyshet.",
    type: "Typografi",
    typeAdd: "Legg til typografi",
    typeChange: "Endre typografien",
    typeAddFont: "Legg til font",
    typeRemoveFont: "Fjern",
    typeHelp:
      "Fontene lastes ikke ned. Prøven vises med fonten hvis den er installert på maskinen, ellers med reservefonten.",
    typeRole: "Brukes til",
    typeFont: "Font",
    typeWeight: "Vekt",
    typeSize: "Størrelse",
    typeSizePlaceholder: "f.eks. 32–48 pt",
    typeFallback: "Reservefont",
    typeFallbackPlaceholder: "f.eks. Arial i Office",
    typeNote: "Merknad",
    typeDefaults: ["Overskrifter", "Brødtekst"],
    typeSample: "Blåbærsyltetøy på hjemmebakt brød, Æ Ø Å 0123456789",
    typeFallbackLabel: (font: string) => `Reservefont: ${font}`,
    typeMissing: (font: string, reserve: string) =>
      `${font} er ikke installert på denne maskinen, så prøven vises med ${reserve || "en reservefont"}.`,
    weights: {
      100: "Tynn",
      200: "Ekstra lett",
      300: "Lett",
      400: "Normal",
      500: "Medium",
      600: "Halvfet",
      700: "Fet",
      800: "Ekstra fet",
      900: "Svart",
    } as Record<number, string>,
  },
  simple: {
    label: "Visning",
    simple: "Enkel",
    all: "Alt",
    simpleHelp:
      "Enkel: fargene vises slik de står i manualen, i lys modus, uten automatikk og ekstra valg. Velg «Alt» for hele verktøyet.",
    allHelp:
      "Alt: hele verktøyet, med mørk modus, valør og varme, forslag, flere valg og utviklerdelen.",
  },
  logoColors: {
    title: "Farger fra logoen",
    help: "Fargene i logoen du har lastet opp, største først. Legg dem i listene under, eller bruk de fargerike som logofarger. Står fargen alt i en liste, flyttes den.",
    helpNoLogo:
      "Har du ikke fargene fra manualen, kan verktøyet lese dem fra logoen. Bildet blir i nettleseren.",
    upload: "Last opp logoen i farge",
    reading: "Leser fargene …",
    none: "Fant ingen farger i bildet. Er logoen hvit eller gjennomsiktig?",
    share: (p: number) => `${p} %`,
    neutral: "nøytral",
    asLogo: "Logo",
    asSupport: "Flate",
    asHighlight: "Utheving",
    addLabel: (rolle: string, hex: string) => `Legg ${hex} til som ${rolle}`,
    useAsLogo: "Bruk som logofarger",
    note: "Lest fra bildet, så fargene kan avvike litt fra manualen. HEX eller CMYK fra manualen er riktigst.",
  },
  logo: {
    button: "Din logo",
    help: "Last opp logoen i farge, sort og hvit (SVG, PNG, JPG eller WebP). Den vises i forhåndsvisningen og på fargekortet i stedet for plassholderen: fargeversjonen der logoen står i logofargen, og sort eller hvit der flaten krever det.",
    privacy:
      "Logoen blir i nettleseren og sendes ingen steder. Den lagres ikke og forsvinner når du lukker siden.",
    variants: { color: "Farge", black: "Sort", white: "Hvit" },
    choose: "Velg eller slipp fil",
    upload: (v: string) => `Last opp logo: ${v}`,
    remove: "Fjern",
    removeLabel: (v: string) => `Fjern logo: ${v}`,
    alt: "Logoen",
    errorType: "Bruk SVG, PNG, JPG eller WebP.",
    errorSize: "Filen er større enn 5 MB.",
  },
  values: {
    title: "HEX, RGB og CMYK",
    outOfGamut: "kan ikke trykkes likt",
    note: "CMYK er omtrentlig: regnet ut fra vanlig offset på bestrøket papir (Coated FOGRA39), uten fargestyring. Til trykk gjelder verdiene fra trykkeriets profil. Farger merket «kan ikke trykkes likt» er mer mettede på skjerm enn trykkfargene klarer.",
    cmykHelp:
      "Skriv HEX og CMYK slik de står i manualen, for eksempel 0 25 100 0. Har manualen bare CMYK, regnes HEX ut omtrentlig.",
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
    withLogo: "Ta med logoen du har lastet opp",
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
  account: {
    metaTitle: "Account · ColorCraft",
    title: "Sign in",
    titleSignedIn: "Your account",
    loading: "Loading …",
    notEnabled:
      "Accounts are on the way but not switched on yet. The tool works as before without an account.",
    intro:
      "No passwords. You get a sign-in link by email, and can add a passkey (Face ID, fingerprint or Windows Hello) for next time.",
    email: "Email address",
    sendLink: "Send sign-in link",
    sending: "Sending …",
    sentTitle: "Check your email",
    sent: (email: string) =>
      `We have sent a sign-in link to ${email}. It works for ten minutes.`,
    tryAgain: "Use another address or send again",
    sendFailed: "Could not send the link. Try again in a moment.",
    rateLimited: "Too many attempts. Wait a few minutes and try again.",
    passkeyIntro: "If you have added a passkey, you can sign in with it.",
    passkeySignIn: "Sign in with passkey",
    passkeyFailed: "Signing in with a passkey was cancelled or did not work.",
    signedInAs: "Signed in as",
    signOut: "Sign out",
    passkeys: "Passkeys",
    passkeysHelp:
      "A passkey lets you sign in without an email link. The private key stays on your device.",
    noPasskeys: "No passkeys yet.",
    addPasskey: "Add passkey",
    passkeyDefaultName: "Passkey",
    passkeyAdded: "The passkey was added.",
    passkeyAddFailed: "The passkey was not added.",
    passkeyRemoveFailed: "Could not remove the passkey.",
    remove: "Remove",
    profiles: "My profiles",
    profilesHelp:
      "Profiles you have saved from the profile page. The short link always shows the latest saved version.",
    noProfiles:
      "No saved profiles yet. Open a profile page and press “Save to account”.",
    open: "Open",
    copyLink: "Copy link",
    copied: "Copied",
    deleteProfile: "Delete",
    deleteProfileConfirm: (title: string) =>
      `Delete “${title}”? The short link stops working.`,
    updated: "Updated",
    mcp: "AI and MCP",
    mcpHelp:
      "With an MCP token, an AI such as Claude can read, create and update your profiles. It cannot delete them. The token is shown only once, and you can revoke it at any time.",
    mcpName: "Token name",
    mcpNamePlaceholder: "e.g. Claude on my work laptop",
    mcpCreate: "Create token",
    mcpCreated:
      "Copy the token now. It is not shown again. Add it to Claude Code with the command below.",
    mcpCopyToken: "Copy token",
    mcpCopyCommand: "Copy command",
    mcpNone: "No tokens.",
    mcpLastUsed: "Last used",
    mcpNeverUsed: "Never used",
    mcpRevoke: "Revoke",
    mcpRevokeConfirm: (name: string) =>
      `Revoke “${name}”? It stops working immediately.`,
    mcpLimit: "You can have up to 10 tokens. Revoke one first.",
    yourData: "Your data",
    exportHelp:
      "Download everything we store about your account, as a JSON file.",
    export: "Download my data",
    deleteTitle: "Delete the account",
    deleteHelp:
      "The account, sign-ins, passkeys, MCP tokens and saved profiles are deleted for good, and the short links stop working. Palettes in your browser and regular links you have shared are not affected.",
    deleteConfirm: (email: string) => `Type ${email} to confirm`,
    deleteButton: "Delete the account for good",
    deleteNeedsFresh:
      "For security, you must have signed in within the last ten minutes. Sign out, sign in again and try again.",
    privacyNote:
      "We store your email address and what is needed for signing in.",
    privacyLink: "Read about privacy",
    signIn: "Sign in",
    account: "Account",
  },
  privacy: {
    metaTitle: "Privacy · ColorCraft",
    title: "Privacy in ColorCraft",
    intro:
      "ColorCraft can be used without an account. Then everything stays in your browser and in the link, and nothing is sent to us. This page applies to you if you create an account.",
    sections: [
      {
        heading: "Controller",
        body: "Børresen Digital (org. no. 938 537 720), a sole proprietorship run by Marcus Børresen. Questions about privacy go through the contact form on borresendigital.no.",
      },
      {
        heading: "What we store",
        body: "Your email address. For each sign-in: when it started and expires, and the IP address and browser you used, for security and against abuse. For passkeys: the name, when it was created and the public key. The private key never leaves your device. The sign-in link has a one-time code that works for ten minutes. The profiles you save, with colors, text and logo, are shown to anyone who has the short link. For MCP tokens we store the name, the start of the token and when it was last used, not the token itself.",
      },
      {
        heading: "Why",
        body: "To provide the account you asked for (contract, GDPR Article 6(1)(b)), and to protect the service against abuse (legitimate interest, Article 6(1)(f)).",
      },
      {
        heading: "Where",
        body: "In ColorCraft's database at Cloudflare (D1), stored in the EU. Sign-in links are sent with the email provider Resend. Cloudflare Turnstile checks that a human asks for a link.",
      },
      {
        heading: "Cookies",
        body: "Only the one that keeps you signed in, which is needed for the account to work. No tracking and no ads.",
      },
      {
        heading: "How long",
        body: "Until you delete the account. A sign-in expires after 30 days without use.",
      },
      {
        heading: "Your rights",
        body: "On the account page you can download all the data and delete the account yourself. You also have the right to access, rectification, restriction, objection and data portability. If you believe your data is processed unlawfully, you can complain to the Norwegian Data Protection Authority (Datatilsynet).",
      },
    ],
    back: "Back to ColorCraft",
  },
  views: {
    label: "Pages",
    tool: "Tool",
    profile: "Profile page",
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
    editRoles: "Adjust roles",
    editRolesTitle:
      "Change each role on its own (main color, text, background …). The changes are lost if you later change the brand colors.",
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
    profile: "Profile page",
    profileTitle: "Open the color profile as a page you can send to the client",
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
    importButton: "Import profile (JSON)",
    importHelp:
      "Do you have a profile file from the profile page? Import it to fill in the form. You review the colors before the palette is created.",
    imported: (name: string, colors: number) =>
      `Imported “${name}” with ${colors} ${colors === 1 ? "color" : "colors"}. Review the colors and press “Create palette”.`,
    importedExtras:
      "Typography, usage rules, Pantone and “Made by” from the file carry over to the profile page.",
    importedDropped: (n: number) =>
      `${n} ${n === 1 ? "color" : "colors"} did not fit in their group and were left out.`,
    importErrors: {
      size: "The file is too large to be a profile.",
      json: "The file is not valid JSON.",
      format:
        "This is not a ColorCraft profile file. Use “Profile (JSON)” under Export on the profile page.",
      version: "The profile file is from a newer version of ColorCraft.",
      colors: "The profile file has no valid colors.",
    },
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
    pickColor: "Pick color",
    colorNamePlaceholder: "For example Warm pipe color",
    add: "Add color",
    remove: (n) => `Remove color ${n}`,
    invalid: "Invalid color. Use HEX, for example #F2B705.",
    preview: "Your palette",
    light: "Light",
    dark: "Dark",
    allPass: "All contrast pairs pass AA in both modes.",
    allPassLight: "All contrast pairs pass AA.",
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
    editTitle: (name) => `Edit “${name}”`,
    save: "Save changes",
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
  profile: {
    metaTitle: "Color profile · ColorCraft",
    metaDescription:
      "A brand's color profile: the colors with HEX, RGB and CMYK, tints, contrast and examples in use.",
    eyebrow: "Color profile",
    madeBy: (name: string) => `Made by ${name}`,
    madeWith: "Made with ColorCraft",
    usage: {
      logo: "The colors in the logo. They carry the brand and are used where it should be recognized.",
      support:
        "Surface colors: full-bleed backgrounds, dividing larger areas, info boxes and chapters. The tints can be used as lighter surfaces.",
      highlight:
        "Used in small doses: buttons, lines, icons and single words. Not as a surface.",
      internal:
        "For internal use only, for example in presentations. Not part of the external profile.",
      main: "The main colors of the palette.",
    },
    copy: (value: string) => `Copy ${value}`,
    copied: "Copied",
    tints: "Tints",
    cmykManual: "CMYK from the brand guide",
    cmykApprox: "CMYK approximate, see the note at the bottom",
    whiteText: "White text",
    blackText: "Black text",
    belowAA: "below AA",
    inUse: "How it looks",
    surfaces: "The surfaces",
    contrast: "Contrast in the palette",
    contrastHelp: "Text needs at least 4.5:1 (AA under WCAG 2.2).",
    download: "Color card for print",
    empty: "There is no color profile in this link.",
    emptyHelp:
      "Create or pick a palette in ColorCraft, and press “Profile page” at the top.",
    openTool: "Open ColorCraft",
    toolbar: "For you as the designer",
    toolbarHelp:
      "This bar and the usage rule buttons are hidden when printing. The link for your client contains the colors, your name, the typography, the usage rules and the logo, and opens the page without the editing buttons.",
    maker: "Made by",
    makerPlaceholder: "Your name or company",
    copyLink: "Copy link for the client",
    previewClient: "See the client’s view",
    linkCopied: "Link copied!",
    copyFailed: "Could not copy",
    print: "Print",
    edit: "Edit in ColorCraft",
    logo: "Upload logo",
    logoInLink: "Include the logo in the link",
    logoWorking: "Preparing the logo …",
    logoSize: (chars: number) =>
      `The logo makes the link ${chars.toLocaleString("en-GB")} characters longer.`,
    logoTooBig:
      "The logo is too large to fit in the link. Try an SVG or a smaller image.",
    rules: "Usage rules",
    rulesWrite: "Write your own usage rules",
    rulesChange: "Edit the usage rules",
    rulesAdd: "Add general usage rules",
    rulesDone: "Done",
    rulesReset: "Use the default text",
    rulesRemove: "Remove the rules",
    rulesLabel: (group: string) => `Usage rules for ${group.toLowerCase()}`,
    rulesHelp: (max: number) =>
      `One rule per line becomes a bulleted list. Saved in the link, up to ${max} characters.`,
    rulesGeneralHelp:
      "For example where the logo may be placed, minimum size, or colors that must not be used together.",
    pantoneAdd: "+ Pantone",
    pantoneChange: "Edit Pantone",
    pantoneLabel: (color: string) => `Pantone for ${color}`,
    pantonePlaceholder: "e.g. 2945 C",
    pantoneHelp:
      "Enter the number from the brand guide. ColorCraft does not convert to Pantone.",
    pantoneSource: "Pantone from the brand guide",
    onThisPage: "On this page",
    navColors: "Colors",
    navInUse: "In use",
    navContrast: "Contrast",
    export: "Export",
    exportHelp:
      "The colors, tone scale and typography in the format you need. The files are made in the browser.",
    exportCode: "Files for websites, apps and Figma",
    exportCodeHelp:
      "For whoever builds the website or app. Pick a format, then copy or download.",
    exportFormats: "Format",
    exportGroups: {
      web: "Web",
      design: "Design",
      apps: "Apps",
      data: "Data",
    },
    exportHints: {
      css: "CSS variables in :root. Paste into the stylesheet and use var(--color-name).",
      scss: "Sass variables, and a map per tone scale: map.get($color-name-tones, 500).",
      tailwind:
        "Tailwind 4: @theme gives classes like bg-name-500 and font-headings.",
      tokens:
        "Design tokens (DTCG) with HEX. Read by Style Dictionary and Tokens Studio.",
      figma:
        "Figma: open Variables, create a new collection and drag the file in. Each file becomes a mode.",
      swift:
        "SwiftUI: Color.name and Color.name500, and the font names in BrandFont.",
      flutter: "Flutter: BrandColors.name and BrandFonts with weight.",
      android: "Android: colors.xml in res/values. Use @color/name.",
      profile:
        "The whole profile as data: colors, tone scale, typography, usage rules and Pantone. Meant for other tools, and for AI that reads or builds a profile.",
    },
    figmaNames: {
      colors: "Colors",
      tones: "Tone scale",
      typography: "Typography",
      font: "Font",
      fallback: "Fallback font",
      weight: "Weight",
      size: "Size",
      note: "Note",
    },
    saveToAccount: "Save to account",
    saveUpdate: "Update saved profile",
    saveAsNew: "Save as new",
    saveSignIn: "Sign in to save",
    saving: "Saving …",
    saved: "Saved.",
    saveFailed: "Could not save the profile.",
    saveLimit:
      "You have reached the limit of 100 profiles. Delete some on the account page.",
    shortLink: "Short link",
    copyShort: "Copy",
    tones: "Tone scale",
    tonesHelp:
      "Each brand color in eleven steps from light to dark, for websites and apps. The color itself stays unchanged at the step that fits best.",
    tonesShow: "Show the tone scale",
    tonesBase: "the color itself",
    tonesCopy: "Copy as CSS",
    tonesCopyAll: "Copy all as CSS",
    tonesCopied: "Copied",
    tonesCssNote:
      "The steps go from 50 (lightest) to 950 (darkest), as in most design systems, and the color itself is marked with a dot. The variables (--color-name-500) work in plain CSS and in @theme in Tailwind 4.",
    vision: "View the page as",
    visionNormal: "Normal color vision",
    visions: {
      protanopia: "Protanopia (red-blind)",
      deuteranopia: "Deuteranopia (green-blind)",
      tritanopia: "Tritanopia (blue-yellow)",
      achromatopsia: "Achromatopsia (no color)",
    },
    visionsShort: {
      protanopia: "Protanopia",
      deuteranopia: "Deuteranopia",
      tritanopia: "Tritanopia",
      achromatopsia: "Achromatopsia",
    },
    colorblind: "Color blindness",
    colorblindHelp:
      "How the colors look with the most common forms of color vision deficiency. Red-green color blindness (protanopia and deuteranopia) is the most common, especially in men. The simulation is a model (Machado 2009) and shows full color blindness. Most people have a milder form.",
    colorblindColor: "Color",
    colorblindSimilar: (a: string, b: string) =>
      `${a} and ${b} become hard to tell apart.`,
    colorblindNone: "None of the colors become too similar.",
    colorblindTip:
      "Colors that become similar should not be the only thing that sets things apart. Also use text, icons, patterns or different lightness.",
    type: "Typography",
    typeAdd: "Add typography",
    typeChange: "Edit the typography",
    typeAddFont: "Add font",
    typeRemoveFont: "Remove",
    typeHelp:
      "The fonts are not downloaded. The sample uses the font if it is installed on the computer, otherwise the fallback font.",
    typeRole: "Used for",
    typeFont: "Font",
    typeWeight: "Weight",
    typeSize: "Size",
    typeSizePlaceholder: "e.g. 32–48 pt",
    typeFallback: "Fallback font",
    typeFallbackPlaceholder: "e.g. Arial in Office",
    typeNote: "Note",
    typeDefaults: ["Headings", "Body text"],
    typeSample: "The quick brown fox jumps over the lazy dog 0123456789",
    typeFallbackLabel: (font: string) => `Fallback: ${font}`,
    typeMissing: (font: string, fallback: string) =>
      `${font} is not installed on this computer, so the sample uses ${fallback || "a fallback font"}.`,
    weights: {
      100: "Thin",
      200: "Extra light",
      300: "Light",
      400: "Regular",
      500: "Medium",
      600: "Semibold",
      700: "Bold",
      800: "Extra bold",
      900: "Black",
    } as Record<number, string>,
  },
  simple: {
    label: "View",
    simple: "Simple",
    all: "All",
    simpleHelp:
      "Simple: the colors are shown as they are in the brand guide, in light mode, without automation and extra options. Choose “All” for the whole tool.",
    allHelp:
      "All: the whole tool, with dark mode, tints and temperature, suggestions, more options and the developer section.",
  },
  logoColors: {
    title: "Colors from the logo",
    help: "The colors in the logo you uploaded, largest first. Add them to the lists below, or use the colorful ones as logo colors. A color already in a list is moved.",
    helpNoLogo:
      "If you don't have the colors from the brand guide, the tool can read them from the logo. The image stays in your browser.",
    upload: "Upload the logo in color",
    reading: "Reading the colors …",
    none: "Found no colors in the image. Is the logo white or transparent?",
    share: (p) => `${p}%`,
    neutral: "neutral",
    asLogo: "Logo",
    asSupport: "Area",
    asHighlight: "Highlight",
    addLabel: (rolle, hex) => `Add ${hex} as ${rolle}`,
    useAsLogo: "Use as logo colors",
    note: "Read from the image, so the colors may differ slightly from the brand guide. HEX or CMYK from the guide is more accurate.",
  },
  logo: {
    button: "Your logo",
    help: "Upload the logo in colour, black and white (SVG, PNG, JPG or WebP). It replaces the placeholder in the preview and on the color card: the colour version where the logo appears in the logo colour, and black or white where the surface calls for it.",
    privacy:
      "The logo stays in your browser and is sent nowhere. It is not saved and disappears when you close the page.",
    variants: { color: "Colour", black: "Black", white: "White" },
    choose: "Choose or drop a file",
    upload: (v: string) => `Upload logo: ${v}`,
    remove: "Remove",
    removeLabel: (v: string) => `Remove logo: ${v}`,
    alt: "The logo",
    errorType: "Use SVG, PNG, JPG or WebP.",
    errorSize: "The file is larger than 5 MB.",
  },
  values: {
    title: "HEX, RGB and CMYK",
    outOfGamut: "can't be printed exactly",
    note: "CMYK is approximate: calculated for standard offset on coated paper (Coated FOGRA39), without color management. For print, use the values from your printer's profile. Colors marked “can't be printed exactly” are more saturated on screen than process inks can reach.",
    cmykHelp:
      "Enter HEX and CMYK as they appear in the brand guide, for example 0 25 100 0. If the guide only has CMYK, HEX is calculated approximately.",
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
    withLogo: "Include the logo you uploaded",
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
