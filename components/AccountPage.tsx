"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  authClient,
  hentKontoStatus,
  type KontoStatus,
} from "@/lib/authClient";
import { localePath, type Locale } from "@/lib/i18n";
import { kontoPath, personvernPath } from "@/lib/accountPaths";
import { profilePath } from "@/lib/profile";
import { shortPath, withSaved } from "@/lib/savedProfiles";
import { btn, field, panel } from "@/lib/ui";
import { FanMark } from "@/components/FanMark";
import { I18nProvider, useI18n } from "@/components/I18nProvider";
import { Turnstile } from "@/components/Turnstile";

/**
 * Kontosiden: logg inn med e-postlenke eller passkey, og styr kontoen
 * (passkeys, last ned data, slett, logg ut). Ingen passord.
 */
export function AccountPage({ locale }: { locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <Account />
    </I18nProvider>
  );
}

function Account() {
  const { locale, t } = useI18n();
  const k = t.account;
  const [status, setStatus] = useState<KontoStatus | null>(null);
  const { data: økt, isPending } = authClient.useSession();

  useEffect(() => {
    hentKontoStatus().then(setStatus);
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3 sm:px-6">
          <Link
            href={localePath(locale)}
            className="flex items-center gap-2 rounded-lg"
          >
            <FanMark size={28} />
            <span className="font-display text-lg font-extrabold tracking-tight">
              Color<span className="font-semibold text-subtle">Craft</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {økt ? k.titleSignedIn : k.title}
        </h1>
        {status === null || isPending ? (
          <p className="text-subtle" role="status">
            {k.loading}
          </p>
        ) : !status.enabled ? (
          <p className={`${panel} p-4`}>{k.notEnabled}</p>
        ) : økt ? (
          <SignedIn email={økt.user.email} />
        ) : (
          <SignIn siteKey={status.turnstileSiteKey} />
        )}
        <p className="text-xs text-subtle">
          {k.privacyNote}{" "}
          <Link href={personvernPath(locale)} className="underline">
            {k.privacyLink}
          </Link>
        </p>
      </main>
    </div>
  );
}

function SignIn({ siteKey }: { siteKey: string | null }) {
  const { locale, t } = useI18n();
  const k = t.account;
  const [epost, setEpost] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [tilstand, setTilstand] = useState<
    "" | "sending" | "sent" | "error" | "rate" | "passkey-error"
  >("");

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (siteKey && !token) return;
    setTilstand("sending");
    const { error } = await authClient.signIn.magicLink({
      email: epost.trim(),
      callbackURL: kontoPath(locale),
      metadata: { locale },
      fetchOptions: token
        ? { headers: { "x-captcha-response": token } }
        : undefined,
    });
    setNonce((n) => n + 1);
    if (!error) setTilstand("sent");
    else setTilstand(error.status === 429 ? "rate" : "error");
  };

  const medPasskey = async () => {
    setTilstand("");
    const r = await authClient.signIn.passkey();
    if (r?.error) setTilstand("passkey-error");
  };

  if (tilstand === "sent") {
    return (
      <div className={`${panel} space-y-2 p-5`} role="status">
        <p className="font-semibold">{k.sentTitle}</p>
        <p className="text-sm">{k.sent(epost.trim())}</p>
        <button
          type="button"
          onClick={() => setTilstand("")}
          className="text-sm text-subtle underline hover:text-ink"
        >
          {k.tryAgain}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-subtle">{k.intro}</p>
      <form onSubmit={send} className={`${panel} space-y-3 p-5`}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {k.email}
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={epost}
            onChange={(e) => setEpost(e.target.value)}
            className={field}
          />
        </label>
        {siteKey && (
          <Turnstile
            siteKey={siteKey}
            locale={locale}
            onToken={setToken}
            nonce={nonce}
          />
        )}
        <button
          type="submit"
          disabled={tilstand === "sending" || (!!siteKey && !token)}
          className={btn("primary", "md")}
        >
          {tilstand === "sending" ? k.sending : k.sendLink}
        </button>
        {(tilstand === "error" || tilstand === "rate") && (
          <p role="alert" className="text-sm font-medium text-bad">
            {tilstand === "rate" ? k.rateLimited : k.sendFailed}
          </p>
        )}
      </form>
      <div className={`${panel} space-y-2 p-5`}>
        <p className="text-sm">{k.passkeyIntro}</p>
        <button
          type="button"
          onClick={medPasskey}
          className={btn("outline", "md")}
        >
          {k.passkeySignIn}
        </button>
        {tilstand === "passkey-error" && (
          <p role="alert" className="text-sm font-medium text-bad">
            {k.passkeyFailed}
          </p>
        )}
      </div>
    </div>
  );
}

interface PasskeyRad {
  id: string;
  name?: string | null;
  createdAt?: string | Date | null;
}

function SignedIn({ email }: { email: string }) {
  const { locale, t } = useI18n();
  const k = t.account;
  const [passkeys, setPasskeys] = useState<PasskeyRad[] | null>(null);
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(
    null,
  );
  const [bekreft, setBekreft] = useState("");
  const [sletter, setSletter] = useState(false);

  const hent = async () => {
    const { data } = await authClient.passkey.listUserPasskeys();
    setPasskeys((data as PasskeyRad[] | null) ?? []);
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    hent();
  }, []);

  const leggTil = async () => {
    setMelding(null);
    const navn = `${k.passkeyDefaultName} ${new Date().toLocaleDateString(
      locale === "en" ? "en-GB" : "nb-NO",
    )}`;
    const r = await authClient.passkey.addPasskey({ name: navn });
    if (r?.error) setMelding({ ok: false, tekst: k.passkeyAddFailed });
    else {
      setMelding({ ok: true, tekst: k.passkeyAdded });
      hent();
    }
  };

  const fjern = async (id: string) => {
    const { error } = await authClient.passkey.deletePasskey({ id });
    if (error) setMelding({ ok: false, tekst: k.passkeyRemoveFailed });
    else hent();
  };

  const slett = async () => {
    setSletter(true);
    const { error } = await authClient.deleteUser();
    setSletter(false);
    if (error) {
      setMelding({ ok: false, tekst: k.deleteNeedsFresh });
      return;
    }
    window.location.href = localePath(locale);
  };

  const loggUt = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  const dato = (d?: string | Date | null) =>
    d
      ? new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "nb-NO")
      : "";

  return (
    <div className="space-y-6">
      <div
        className={`${panel} flex flex-wrap items-center justify-between gap-3 p-5`}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-subtle">
            {k.signedInAs}
          </p>
          <p className="font-medium">{email}</p>
        </div>
        <button type="button" onClick={loggUt} className={btn("outline", "sm")}>
          {k.signOut}
        </button>
      </div>

      {melding && (
        <p
          role={melding.ok ? "status" : "alert"}
          className={`text-sm font-medium ${melding.ok ? "text-ok" : "text-bad"}`}
        >
          {melding.tekst}
        </p>
      )}

      <SavedProfiles />

      <McpTokens />

      <section
        aria-labelledby="konto-passkeys"
        className={`${panel} space-y-3 p-5`}
      >
        <h2 id="konto-passkeys" className="font-display text-xl font-bold">
          {k.passkeys}
        </h2>
        <p className="text-sm text-subtle">{k.passkeysHelp}</p>
        {passkeys === null ? (
          <p className="text-sm text-subtle">{k.loading}</p>
        ) : passkeys.length === 0 ? (
          <p className="text-sm">{k.noPasskeys}</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {passkeys.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span>
                  {p.name || k.passkeyDefaultName}
                  <span className="text-subtle"> · {dato(p.createdAt)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => fjern(p.id)}
                  className="text-xs text-subtle underline hover:text-ink"
                >
                  {k.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={leggTil}
          className={btn("primary", "sm")}
        >
          {k.addPasskey}
        </button>
      </section>

      <section
        aria-labelledby="konto-data"
        className={`${panel} space-y-3 p-5`}
      >
        <h2 id="konto-data" className="font-display text-xl font-bold">
          {k.yourData}
        </h2>
        <p className="text-sm text-subtle">{k.exportHelp}</p>
        <a href="/api/konto/eksport" className={btn("outline", "sm")} download>
          {k.export}
        </a>
      </section>

      <section
        aria-labelledby="konto-slett"
        className="space-y-3 rounded-2xl border border-bad/40 p-5"
      >
        <h2 id="konto-slett" className="font-display text-xl font-bold">
          {k.deleteTitle}
        </h2>
        <p className="text-sm">{k.deleteHelp}</p>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {k.deleteConfirm(email)}
          <input
            type="email"
            value={bekreft}
            onChange={(e) => setBekreft(e.target.value)}
            autoComplete="off"
            className={field}
          />
        </label>
        <button
          type="button"
          onClick={slett}
          disabled={
            sletter || bekreft.trim().toLowerCase() !== email.toLowerCase()
          }
          className="rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {k.deleteButton}
        </button>
      </section>
    </div>
  );
}

interface LagretProfil {
  id: string;
  slug: string;
  locale: Locale;
  title: string;
  updatedAt: number;
}

/** Profilene lagret i kontoen, med kort lenke, åpne og slett. */
function SavedProfiles() {
  const { locale, t } = useI18n();
  const k = t.account;
  const router = useRouter();
  const [liste, setListe] = useState<LagretProfil[] | null>(null);
  const [kopiert, setKopiert] = useState<string | null>(null);
  const [feil, setFeil] = useState(false);

  const hent = async () => {
    try {
      const r = await fetch("/api/profiler", { cache: "no-store" });
      const d = (await r.json()) as { profiles?: LagretProfil[] };
      setListe(r.ok ? (d.profiles ?? []) : []);
    } catch {
      setListe([]);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    hent();
  }, []);

  const kort = (p: LagretProfil) =>
    `${window.location.origin}${shortPath(p.slug, p.locale)}`;

  const åpne = async (p: LagretProfil) => {
    const r = await fetch(`/api/profiler/${p.id}`, { cache: "no-store" });
    if (!r.ok) return setFeil(true);
    const d = (await r.json()) as { hash: string };
    router.push(`${profilePath(p.locale)}#${withSaved(d.hash, p.id)}`);
  };

  const kopier = async (p: LagretProfil) => {
    try {
      await navigator.clipboard.writeText(kort(p));
      setKopiert(p.id);
      setTimeout(() => setKopiert(null), 2000);
    } catch {
      setFeil(true);
    }
  };

  const slett = async (p: LagretProfil) => {
    if (!window.confirm(k.deleteProfileConfirm(p.title))) return;
    const r = await fetch(`/api/profiler/${p.id}`, { method: "DELETE" });
    if (!r.ok) setFeil(true);
    hent();
  };

  const dato = (ms: number) =>
    new Date(ms).toLocaleDateString(locale === "en" ? "en-GB" : "nb-NO");

  return (
    <section
      aria-labelledby="konto-profiler"
      className={`${panel} space-y-3 p-5`}
    >
      <h2 id="konto-profiler" className="font-display text-xl font-bold">
        {k.profiles}
      </h2>
      <p className="text-sm text-subtle">{k.profilesHelp}</p>
      {liste === null ? (
        <p className="text-sm text-subtle">{k.loading}</p>
      ) : liste.length === 0 ? (
        <p className="text-sm">{k.noProfiles}</p>
      ) : (
        <ul className="divide-y divide-line text-sm">
          {liste.map((p) => (
            <li key={p.id} className="space-y-1 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{p.title}</span>
                <span className="text-xs text-subtle">
                  {k.updated} {dato(p.updatedAt)}
                </span>
              </div>
              <a
                href={shortPath(p.slug, p.locale)}
                target="_blank"
                rel="noopener"
                className="block truncate font-mono text-xs underline"
              >
                {shortPath(p.slug, p.locale)}
              </a>
              <div className="flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => åpne(p)}
                  className="font-medium underline"
                >
                  {k.open}
                </button>
                <button
                  type="button"
                  onClick={() => kopier(p)}
                  className="underline"
                >
                  {kopiert === p.id ? k.copied : k.copyLink}
                </button>
                <button
                  type="button"
                  onClick={() => slett(p)}
                  className="text-bad underline"
                >
                  {k.deleteProfile}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {feil && (
        <p role="alert" className="text-sm font-medium text-bad">
          {k.sendFailed}
        </p>
      )}
    </section>
  );
}

interface TokenRad {
  id: string;
  name: string;
  label: string;
  createdAt: number;
  lastUsedAt: number | null;
}

/** MCP-tokens: lag, se og trekk tilbake. Tokenet vises bare én gang. */
function McpTokens() {
  const { locale, t } = useI18n();
  const k = t.account;
  const [liste, setListe] = useState<TokenRad[] | null>(null);
  const [navn, setNavn] = useState("");
  const [nytt, setNytt] = useState<string | null>(null);
  const [kopiert, setKopiert] = useState<"" | "token" | "cmd">("");
  const [feil, setFeil] = useState<string | null>(null);

  const hent = async () => {
    try {
      const r = await fetch("/api/konto/tokens", { cache: "no-store" });
      const d = (await r.json()) as { tokens?: TokenRad[] };
      setListe(r.ok ? (d.tokens ?? []) : []);
    } catch {
      setListe([]);
    }
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    hent();
  }, []);

  const kommando = (token: string) =>
    `claude mcp add --transport http colorcraft ${window.location.origin}/mcp --header "Authorization: Bearer ${token}"`;

  const lag = async (e: FormEvent) => {
    e.preventDefault();
    setFeil(null);
    const r = await fetch("/api/konto/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: navn }),
    });
    const d = (await r.json()) as { token?: string; error?: string };
    if (!r.ok || !d.token) {
      setFeil(d.error === "limit" ? k.mcpLimit : k.sendFailed);
      return;
    }
    setNytt(d.token);
    setNavn("");
    hent();
  };

  const kopier = async (hva: "token" | "cmd") => {
    if (!nytt) return;
    try {
      await navigator.clipboard.writeText(
        hva === "token" ? nytt : kommando(nytt),
      );
      setKopiert(hva);
      setTimeout(() => setKopiert(""), 2000);
    } catch {
      setFeil(k.sendFailed);
    }
  };

  const trekk = async (rad: TokenRad) => {
    if (!window.confirm(k.mcpRevokeConfirm(rad.name))) return;
    const r = await fetch(`/api/konto/tokens/${rad.id}`, { method: "DELETE" });
    if (!r.ok) setFeil(k.sendFailed);
    hent();
  };

  const dato = (ms: number) =>
    new Date(ms).toLocaleDateString(locale === "en" ? "en-GB" : "nb-NO");

  return (
    <section aria-labelledby="konto-mcp" className={`${panel} space-y-3 p-5`}>
      <h2 id="konto-mcp" className="font-display text-xl font-bold">
        {k.mcp}
      </h2>
      <p className="text-sm text-subtle">{k.mcpHelp}</p>
      {nytt && (
        <div
          role="status"
          className="space-y-2 rounded-xl border border-line bg-sunken p-3 text-sm"
        >
          <p className="font-medium">{k.mcpCreated}</p>
          <code className="block break-all font-mono text-xs">{nytt}</code>
          <code className="block break-all font-mono text-[11px] text-subtle">
            {kommando(nytt)}
          </code>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => kopier("token")}
              className={btn("outline", "sm")}
            >
              {kopiert === "token" ? k.copied : k.mcpCopyToken}
            </button>
            <button
              type="button"
              onClick={() => kopier("cmd")}
              className={btn("outline", "sm")}
            >
              {kopiert === "cmd" ? k.copied : k.mcpCopyCommand}
            </button>
          </div>
        </div>
      )}
      <form onSubmit={lag} className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm font-medium">
          {k.mcpName}
          <input
            type="text"
            value={navn}
            maxLength={40}
            placeholder={k.mcpNamePlaceholder}
            onChange={(e) => setNavn(e.target.value)}
            className={field}
          />
        </label>
        <button type="submit" className={btn("primary", "sm")}>
          {k.mcpCreate}
        </button>
      </form>
      {liste === null ? (
        <p className="text-sm text-subtle">{k.loading}</p>
      ) : liste.length === 0 ? (
        <p className="text-sm">{k.mcpNone}</p>
      ) : (
        <ul className="divide-y divide-line text-sm">
          {liste.map((rad) => (
            <li
              key={rad.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
              <span>
                <span className="font-medium">{rad.name}</span>{" "}
                <span className="font-mono text-xs text-subtle">
                  {rad.label}
                </span>
                <span className="block text-xs text-subtle">
                  {rad.lastUsedAt
                    ? `${k.mcpLastUsed} ${dato(rad.lastUsedAt)}`
                    : k.mcpNeverUsed}
                </span>
              </span>
              <button
                type="button"
                onClick={() => trekk(rad)}
                className="text-xs text-bad underline"
              >
                {k.mcpRevoke}
              </button>
            </li>
          ))}
        </ul>
      )}
      {feil && (
        <p role="alert" className="text-sm font-medium text-bad">
          {feil}
        </p>
      )}
    </section>
  );
}
