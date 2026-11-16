"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

export interface NavItem {
  /** id-en til overskriften seksjonen starter med. */
  id: string;
  label: string;
}

/**
 * Menyen «På denne siden» på profilsiden. Den står fast øverst mens du
 * ruller, og viser hvilken seksjon du er i.
 *
 * Lenkene ruller med JavaScript i stedet for å endre adressen: paletten
 * ligger i #-delen av lenken, og en vanlig #-lenke ville erstattet den.
 */
export function SectionNav({
  label,
  items,
}: {
  label: string;
  items: NavItem[];
}) {
  const [aktiv, setAktiv] = useState<string | null>(null);
  // Etter et klikk står valget mens siden ruller dit, selv om en kort
  // seksjon nederst ikke når opp til linjen.
  const låst = useRef(0);

  // Listen lages på nytt ved hver gjengivelse. id-ene avgjør om den er ny.
  const nøkkel = items.map((i) => i.id).join(",");

  useEffect(() => {
    const ider = nøkkel.split(",");
    // Aktiv er den siste seksjonen der overskriften har passert linjen en
    // tredjedel ned i vinduet. Nederst på siden er det den siste. Regnes ved
    // rulling, så korte seksjoner (som en lukket tonetrapp) ikke henger igjen.
    let ramme = 0;
    const oppdater = () => {
      ramme = 0;
      if (performance.now() < låst.current) return;
      const mål = ider
        .map((id) => document.getElementById(id))
        .filter((e): e is HTMLElement => e !== null);
      if (mål.length === 0) return;
      const linje = window.innerHeight / 3;
      const bunn =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      let valgt = mål[0];
      for (const m of mål)
        if (m.getBoundingClientRect().top <= linje) valgt = m;
      setAktiv(bunn ? mål[mål.length - 1].id : valgt.id);
    };
    const planlegg = () => {
      if (!ramme) ramme = requestAnimationFrame(oppdater);
    };
    oppdater();
    window.addEventListener("scroll", planlegg, { passive: true });
    window.addEventListener("resize", planlegg);
    return () => {
      window.removeEventListener("scroll", planlegg);
      window.removeEventListener("resize", planlegg);
      if (ramme) cancelAnimationFrame(ramme);
    };
  }, [nøkkel]);

  const gåTil = (e: MouseEvent, id: string) => {
    const mål = document.getElementById(id);
    if (!mål) return;
    e.preventDefault();
    const rolig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mål.scrollIntoView({ behavior: rolig ? "auto" : "smooth", block: "start" });
    // Fokus til overskriften, så tastatur og skjermleser følger med.
    if (!mål.hasAttribute("tabindex")) mål.setAttribute("tabindex", "-1");
    mål.focus({ preventScroll: true });
    låst.current = e.timeStamp + 1000;
    setAktiv(id);
  };

  return (
    <nav
      aria-label={label}
      className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur print:hidden"
    >
      <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {items.map((i) => (
          <li key={i.id} className="shrink-0">
            <a
              href={`#${i.id}`}
              onClick={(e) => gåTil(e, i.id)}
              aria-current={aktiv === i.id ? "location" : undefined}
              className={cn(
                "block rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                aktiv === i.id
                  ? "bg-ink text-paper"
                  : "text-subtle hover:bg-sunken hover:text-ink",
              )}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
