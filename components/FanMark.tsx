/**
 * Merket til ColorCraft: en fargevifte, slik designere fortsatt bruker den
 * fysiske. Bladene tar farge fra paletten som vises, så merket endrer seg med
 * det du jobber med. Uten farger brukes standardfargene under.
 */

const STANDARD = ["#C2410C", "#E9A23B", "#2F7D6D", "#3B5BA9"];

export function FanMark({
  colors = STANDARD,
  size = 36,
}: {
  colors?: string[];
  size?: number;
}) {
  const blader = [0, 1, 2, 3].map((i) => colors[i] ?? STANDARD[i]);
  const vinkler = [-36, -12, 12, 36];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {blader.map((farge, i) => (
        <rect
          key={i}
          x="15.5"
          y="5"
          width="9"
          height="29"
          rx="4.5"
          fill={farge}
          stroke="var(--cc-panel)"
          strokeWidth="1.5"
          transform={`rotate(${vinkler[i]} 20 32)`}
        />
      ))}
      <circle cx="20" cy="32" r="2.6" fill="var(--cc-ink)" />
    </svg>
  );
}
