/**
 * Felles knappestiler, så knappene ser like ut overalt. Fargene kommer fra
 * tokens i app/globals.css og følger lys og mørk ramme.
 */

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const størrelse = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

const variant = {
  /** Hovedhandlingen: blekk på papir. */
  primary: "bg-ink text-paper hover:bg-ink/85",
  /** Signaturfargen, brukt sparsomt. */
  accent: "bg-accent text-accent-ink hover:bg-accent/90",
  /** Vanlig knapp med kant. */
  outline: "border border-line bg-panel text-ink hover:bg-sunken",
  /** Rolig knapp uten kant, for handlinger i en verktøylinje. */
  ghost: "text-subtle hover:bg-sunken hover:text-ink",
  /** Sletting og annet som ikke kan angres. */
  danger: "text-bad hover:bg-bad-soft",
};

export function btn(
  v: keyof typeof variant = "outline",
  s: keyof typeof størrelse = "md",
): string {
  return `${base} ${størrelse[s]} ${variant[v]}`;
}

/** Tekstfelt og nedtrekk. Kanten (field) holder 3:1 mot panelet. */
export const field =
  "rounded-lg border border-field bg-panel px-3 py-2 text-sm text-ink placeholder:text-subtle focus:border-accent focus:outline-none aria-[invalid=true]:border-bad";

/** Et panel i rammen: kant, ikke skygge. */
export const panel = "rounded-2xl border border-line bg-panel";
