"use client";

import type { MouseEvent } from "react";
import { localePath, type Locale } from "@/lib/i18n";
import { profilePath } from "@/lib/profile";
import { sitePath } from "@/lib/site";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import { AccountLink } from "@/components/AccountLink";
import { FanMark } from "@/components/FanMark";
import { SimpleToggle } from "@/components/SimpleMode";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ViewSwitch } from "@/components/ViewSwitch";

type View = "tool" | "site" | "profile";

const STI: Record<View, (l: Locale) => string> = {
  tool: localePath,
  site: sitePath,
  profile: profilePath,
};

/**
 * Toppen på verktøyet, nettsiden og profilsiden. Den er lik på alle tre og
 * endrer seg ikke med «Designere / Utviklere», så ingenting flytter seg når
 * du bytter. Det som hører til én side (dele lenke, ny palett, «Laget av»)
 * står på siden selv.
 */
export function SiteHeader({
  active,
  hash,
  toolHash = hash,
  fanColors,
  lockTheme = false,
  sticky = true,
}: {
  active: View;
  /** Fragmentet som følger med til nettsiden og profilsiden. */
  hash: string;
  /** Fragmentet til verktøyet, hvis det er et annet. */
  toolHash?: string;
  fanColors?: string[];
  /** Profilsiden er alltid lys, så temaknappen er låst der. */
  lockTheme?: boolean;
  /** Profilsiden har sin egen faste meny, så der ruller toppen bort. */
  sticky?: boolean;
}) {
  const { locale, t } = useI18n();
  const annet: Locale = locale === "nb" ? "en" : "nb";
  // Fragmentet leses ved klikk, så endringer gjort på siden blir med.
  const byttSpråk = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.href = STI[active](annet) + window.location.hash;
  };

  return (
    <header
      className={cn(
        "z-30 border-b border-line bg-paper/90 backdrop-blur print:hidden",
        // På mobil ruller toppen bort, så den ikke tar skjermen.
        sticky && "sm:sticky sm:top-0",
      )}
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <a
          href={`${localePath(locale)}#${toolHash}`}
          className="flex min-w-0 items-center gap-2.5 rounded-lg"
          aria-label={t.app.home}
        >
          <FanMark colors={fanColors} size={32} />
          <span className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
            Color<span className="font-semibold text-subtle">Craft</span>
          </span>
        </a>
        <ViewSwitch
          active={active}
          toolHref={`${localePath(locale)}#${toolHash}`}
          siteHref={`${sitePath(locale)}#${hash}`}
          profileHref={`${profilePath(locale)}#${hash}`}
          className="sm:mr-auto"
        />
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <a
            href={STI[active](annet)}
            hrefLang={annet}
            lang={annet}
            aria-label={t.app.otherLanguageLabel}
            onClick={byttSpråk}
            className={btn("ghost", "sm")}
          >
            {t.app.otherLanguage}
          </a>
          <SimpleToggle />
          <ThemeToggle locked={lockTheme} />
          <AccountLink />
        </div>
      </div>
    </header>
  );
}
