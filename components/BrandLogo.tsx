"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  checkLogoFile,
  LOGO_VARIANTS,
  pickLogo,
  type LogoFileError,
  type LogoVariant,
  type UploadedLogos,
} from "@/lib/logo";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";

interface LogoState {
  logos: UploadedLogos;
  set: (v: LogoVariant, file: File) => LogoFileError | null;
  remove: (v: LogoVariant) => void;
}

const LogoContext = createContext<LogoState>({
  logos: {},
  set: () => null,
  remove: () => {},
});

export const useLogos = () => useContext(LogoContext);

/**
 * Holder de opplastede logoene mens siden er åpen. Bildene blir blob-adresser
 * i nettleseren og sendes ingen steder.
 */
export function LogoProvider({ children }: { children: ReactNode }) {
  const [logos, setLogos] = useState<UploadedLogos>({});
  const aktive = useRef<UploadedLogos>({});
  useEffect(() => {
    aktive.current = logos;
  }, [logos]);

  // Frigjør bildene når forhåndsvisningen forsvinner.
  useEffect(
    () => () => {
      for (const url of Object.values(aktive.current)) {
        if (url) URL.revokeObjectURL(url);
      }
    },
    [],
  );

  const set = useCallback((v: LogoVariant, file: File) => {
    const feil = checkLogoFile(file);
    if (feil) return feil;
    const url = URL.createObjectURL(file);
    setLogos((l) => {
      if (l[v]) URL.revokeObjectURL(l[v]);
      return { ...l, [v]: url };
    });
    return null;
  }, []);

  const remove = useCallback((v: LogoVariant) => {
    setLogos((l) => {
      if (l[v]) URL.revokeObjectURL(l[v]);
      const rest = { ...l };
      delete rest[v];
      return rest;
    });
  }, []);

  return (
    <LogoContext.Provider value={{ logos, set, remove }}>
      {children}
    </LogoContext.Provider>
  );
}

const HØYDE = { xs: 12, sm: 18, md: 28, lg: 44 } as const;

/**
 * Kundens logo hvis den er lastet opp, ellers plassholderen (gitt som
 * children). `inColor` sier om logoen her står i logofargen, eller i én farge
 * på en flate der fargeversjonen ikke er tenkt brukt.
 */
export function BrandLogo({
  bg,
  inColor,
  size = "md",
  children,
}: {
  bg: string;
  inColor: boolean;
  size?: keyof typeof HØYDE;
  children: ReactNode;
}) {
  const { logos } = useLogos();
  const { t } = useI18n();
  const valgt = pickLogo(logos, bg, inColor);
  if (!valgt) return <>{children}</>;
  return (
    // Blob-adresser fra brukerens egen fil. next/image gir ingenting her.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={valgt.src}
      alt={t.logo.alt}
      style={{ height: HØYDE[size] }}
      className="block w-auto max-w-full object-contain"
    />
  );
}

/** Opplasting av logoen i farge, sort og hvit, over forhåndsvisningen. */
export function LogoUpload() {
  const { logos, set, remove } = useLogos();
  const { t } = useI18n();
  const l = t.logo;
  const [feil, setFeil] = useState<string | null>(null);
  const [over, setOver] = useState<LogoVariant | null>(null);

  const last = (v: LogoVariant, file: File | undefined) => {
    if (!file) return;
    const e = set(v, file);
    setFeil(e ? (e === "type" ? l.errorType : l.errorSize) : null);
  };

  // Hvit logo trenger mørk bakgrunn for å synes i miniatyren.
  const prøvebg: Record<LogoVariant, string> = {
    color:
      "repeating-conic-gradient(#e5e5e5 0 25%, #ffffff 0 50%) 0 0 / 12px 12px",
    black: "#ffffff",
    white: "#2b2b2b",
  };

  return (
    <div className="space-y-2 border-b border-line bg-panel px-3 py-3 sm:px-4">
      <p className="text-xs text-subtle">{l.help}</p>
      <ul className="grid grid-cols-3 gap-2">
        {LOGO_VARIANTS.map((v) => (
          <li key={v} className="min-w-0 space-y-1">
            <label
              className={cn(
                "flex h-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed p-1.5 text-center text-xs text-subtle transition-colors focus-within:ring-2 focus-within:ring-signal",
                over === v ? "border-signal" : "border-line hover:border-ink",
              )}
              style={logos[v] ? { background: prøvebg[v] } : undefined}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(v);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                last(v, e.dataTransfer.files[0]);
              }}
            >
              <input
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg"
                className="sr-only"
                aria-label={l.upload(l.variants[v])}
                onChange={(e) => {
                  last(v, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {logos[v] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logos[v]}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span>
                  <span className="block font-semibold text-ink">
                    {l.variants[v]}
                  </span>
                  {l.choose}
                </span>
              )}
            </label>
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="truncate font-medium">{l.variants[v]}</span>
              {logos[v] && (
                <button
                  type="button"
                  onClick={() => remove(v)}
                  className="shrink-0 text-subtle underline hover:text-ink"
                  aria-label={l.removeLabel(l.variants[v])}
                >
                  {l.remove}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {feil && (
        <p role="alert" className="text-xs font-medium text-bad">
          {feil}
        </p>
      )}
      <p className="text-[11px] text-subtle">{l.privacy}</p>
    </div>
  );
}
