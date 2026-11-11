import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const erUtvikling = process.env.NODE_ENV === "development";

/**
 * Gir `next dev` de samme bindingene som workeren. ColorCraft har ingen ennå,
 * men kallet gjør ingenting under `next build` og koster ingenting å ha med.
 */
initOpenNextCloudflareForDev();

/**
 * Content Security Policy.
 *
 * Alt i ColorCraft kjører i nettleseren, og ingenting sendes noe sted. Derfor
 * er `connect-src 'self'` den viktigste linjen: et skript som skulle slippe
 * inn, har ingen vei ut.
 *
 * `'unsafe-inline'` på script-src: Next legger RSC-nyttelasten i inline-skript
 * i hver side, og nonce krever at siden gjengis på nytt ved hvert besøk. Sidene
 * her er statiske og ligger ferdige på kanten, så det byttet tar vi ikke.
 *
 * `style-src-attr 'unsafe-inline'`: forhåndsvisningen fargelegger komponentene
 * med style-attributter fra paletten, og de står i HTML-en fra serveren. Selve
 * stilarkene (`style-src-elem`) er fortsatt bare våre egne. I utvikling setter
 * Next stilene inline, så der åpnes begge.
 */
const CSP = [
  "default-src 'self'",
  ["script-src 'self' 'unsafe-inline'", erUtvikling ? "'unsafe-eval'" : ""]
    .join(" ")
    .trim(),
  erUtvikling
    ? "style-src 'self' 'unsafe-inline'"
    : "style-src 'self'; style-src-elem 'self'; style-src-attr 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  ["connect-src 'self'", erUtvikling ? "ws: wss:" : ""].join(" ").trim(),
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SIKKERHETSHODER = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Overflødig ved siden av frame-ancestors, men for eldre nettlesere.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Bildeoptimering krever en egen bildetjeneste på Workers. Logoen er det
  // eneste bildet, og den er liten nok til å serveres som den er.
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/(.*)", headers: SIKKERHETSHODER }];
  },
  /**
   * Norsk er standard og skal ligge på `/`, ikke `/nb`. Siden bygges som
   * app/[lang] med lang=nb, og `/` peker dit internt. `/nb` sender videre til
   * `/`, så det bare finnes én adresse for den norske siden.
   */
  async rewrites() {
    return [{ source: "/", destination: "/nb" }];
  },
  async redirects() {
    return [{ source: "/nb", destination: "/", permanent: true }];
  },
};

export default nextConfig;
