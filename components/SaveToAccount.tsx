"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient, hentKontoStatus } from "@/lib/authClient";
import { kontoPath } from "@/lib/accountPaths";
import type { Locale } from "@/lib/i18n";
import { readSaved, shortPath } from "@/lib/savedProfiles";
import { btn } from "@/lib/ui";
import { useI18n } from "@/components/I18nProvider";

interface Props {
  /** Fragmentet slik det står, med `sid` hvis profilen er lagret. */
  hash: string;
  /** Fragmentet som skal lagres (med logoen hvis den er med). */
  lagreHash: () => string;
  title: string;
  locale: Locale;
  /** Får id-en etter første lagring, så neste lagring oppdaterer. */
  onSaved: (id: string) => void;
}

/**
 * «Lagre i kontoen» på profilsiden. Vises bare når kontoene er på. Gir en
 * kort lenke som alltid viser siste lagrede versjon.
 */
export function SaveToAccount(props: Props) {
  const [på, setPå] = useState(false);
  useEffect(() => {
    hentKontoStatus().then((s) => setPå(s.enabled));
  }, []);
  return på ? <Lagre {...props} /> : null;
}

function Lagre({ hash, lagreHash, title, locale, onSaved }: Props) {
  const { t } = useI18n();
  const p = t.profile;
  const { data: økt, isPending } = authClient.useSession();
  const sid = readSaved(hash);
  const [kort, setKort] = useState<string | null>(null);
  const [tilstand, setTilstand] = useState<
    "" | "saving" | "saved" | "error" | "limit" | "copied"
  >("");

  // En åpnet, lagret profil: vis den korte lenken med en gang.
  useEffect(() => {
    if (!sid || !økt) return;
    let avbrutt = false;
    fetch(`/api/profiler/${sid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { slug?: string; locale?: Locale } | null) => {
        if (!avbrutt && d?.slug) {
          setKort(
            `${window.location.origin}${shortPath(d.slug, d.locale ?? locale)}`,
          );
        }
      })
      .catch(() => {});
    return () => {
      avbrutt = true;
    };
  }, [sid, økt, locale]);

  if (isPending) return null;
  if (!økt) {
    return (
      <Link href={kontoPath(locale)} className={btn("ghost", "md")}>
        {p.saveSignIn}
      </Link>
    );
  }

  const lagre = async (ny: boolean) => {
    setTilstand("saving");
    try {
      const r = await fetch("/api/profiler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hash: lagreHash(),
          title,
          locale,
          id: ny ? undefined : (sid ?? undefined),
        }),
      });
      const d = (await r.json()) as {
        id?: string;
        slug?: string;
        locale?: Locale;
        error?: string;
      };
      if (!r.ok || !d.id || !d.slug) {
        setTilstand(d.error === "limit" ? "limit" : "error");
        return;
      }
      setKort(
        `${window.location.origin}${shortPath(d.slug, d.locale ?? locale)}`,
      );
      onSaved(d.id);
      setTilstand("saved");
    } catch {
      setTilstand("error");
    }
  };

  const kopier = async () => {
    if (!kort) return;
    try {
      await navigator.clipboard.writeText(kort);
      setTilstand("copied");
      setTimeout(() => setTilstand(""), 2000);
    } catch {
      setTilstand("error");
    }
  };

  return (
    <div className="flex basis-full flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => lagre(false)}
        disabled={tilstand === "saving"}
        className={btn("outline", "sm")}
      >
        {tilstand === "saving"
          ? p.saving
          : sid
            ? p.saveUpdate
            : p.saveToAccount}
      </button>
      {sid && (
        <button
          type="button"
          onClick={() => lagre(true)}
          disabled={tilstand === "saving"}
          className={btn("ghost", "sm")}
        >
          {p.saveAsNew}
        </button>
      )}
      {kort && (
        <span className="flex min-w-0 items-center gap-2">
          <span className="font-semibold">{p.shortLink}:</span>
          <a
            href={kort}
            target="_blank"
            rel="noopener"
            className="truncate font-mono underline"
          >
            {kort.replace(/^https?:\/\//, "")}
          </a>
          <button
            type="button"
            onClick={kopier}
            className="shrink-0 underline hover:text-ink"
          >
            {tilstand === "copied" ? p.linkCopied : p.copyShort}
          </button>
        </span>
      )}
      <span role="status" className="text-subtle">
        {tilstand === "saved" && p.saved}
      </span>
      {(tilstand === "error" || tilstand === "limit") && (
        <span role="alert" className="font-medium text-bad">
          {tilstand === "limit" ? p.saveLimit : p.saveFailed}
        </span>
      )}
    </div>
  );
}
