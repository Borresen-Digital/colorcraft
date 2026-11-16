"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useI18n } from "@/components/I18nProvider";

/**
 * «For designere» (standard, `simple`): fargene fra manualen vises slik de er, uten
 * automatikk og ekstra valg. Bare lys modus, ingen «Valør og varme», ingen
 * forslag som endrer fargene, og ingen utviklerdel. «For utviklere» viser hele
 * verktøyet. Valget huskes i nettleseren.
 */
export const SIMPLE_KEY = "colorcraft-simple";

interface SimpleState {
  simple: boolean;
  setSimple: (v: boolean) => void;
}

const SimpleContext = createContext<SimpleState>({
  simple: true,
  setSimple: () => {},
});

export const useSimple = () => useContext(SimpleContext);

export function SimpleModeProvider({ children }: { children: ReactNode }) {
  const [simple, setState] = useState(true);

  // Det lagrede valget finnes bare i nettleseren, så det leses etter
  // hydrering, som valget av lys og mørk ramme.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(SIMPLE_KEY) === "0") setState(false);
    } catch {
      // Lagring sperret: enkel visning.
    }
  }, []);

  const setSimple = useCallback((v: boolean) => {
    setState(v);
    try {
      if (v) localStorage.removeItem(SIMPLE_KEY);
      else localStorage.setItem(SIMPLE_KEY, "0");
    } catch {
      // Lagring sperret: valget gjelder til siden lastes på nytt.
    }
  }, []);

  return (
    <SimpleContext.Provider value={{ simple, setSimple }}>
      {children}
    </SimpleContext.Provider>
  );
}

/** Bryteren i toppen: «For designere» eller «For utviklere». */
export function SimpleToggle() {
  const { simple, setSimple } = useSimple();
  const { t } = useI18n();
  const s = t.simple;
  return (
    <div
      role="group"
      aria-label={s.label}
      title={simple ? s.simpleHelp : s.allHelp}
      className="flex rounded-full border border-line bg-sunken p-0.5"
    >
      {(
        [
          [true, s.simple],
          [false, s.all],
        ] as const
      ).map(([verdi, navn]) => (
        <button
          key={navn}
          type="button"
          aria-pressed={simple === verdi}
          onClick={() => setSimple(verdi)}
          className={
            simple === verdi
              ? "rounded-full bg-panel px-3 py-1 text-xs font-semibold text-ink shadow-sm"
              : "rounded-full px-3 py-1 text-xs font-medium text-subtle hover:text-ink"
          }
        >
          {navn}
        </button>
      ))}
    </div>
  );
}
