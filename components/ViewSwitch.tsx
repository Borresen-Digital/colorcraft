"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";

/**
 * Bryteren mellom visningene: verktøyet der paletten lages, nettsiden der
 * den vises på en hel side, og profilsiden som sendes til kunden. Den står på samme sted i begge, og
 * begge lenkene tar med paletten, så du kan gå fram og tilbake.
 */
export function ViewSwitch({
  active,
  toolHref,
  profileHref,
  siteHref,
  className,
}: {
  active: "tool" | "profile" | "site";
  toolHref: string;
  profileHref: string;
  /** Nettsidevisningen: paletten på en hel nettside. */
  siteHref?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const v = t.views;
  const lenke = (
    key: "tool" | "profile" | "site",
    href: string,
    tekst: string,
  ) => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active === key
          ? "bg-panel text-ink shadow-sm"
          : "text-subtle hover:text-ink",
      )}
    >
      {tekst}
    </Link>
  );
  return (
    <nav
      aria-label={v.label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-line bg-sunken p-0.5",
        className,
      )}
    >
      {lenke("tool", toolHref, v.tool)}
      {siteHref && lenke("site", siteHref, v.site)}
      {lenke("profile", profileHref, v.profile)}
    </nav>
  );
}
