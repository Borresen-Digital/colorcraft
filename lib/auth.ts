import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { captcha, magicLink } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { loginMail } from "./authMail";

/**
 * Kontoer i ColorCraft (Better Auth): innlogging med e-postlenke og
 * passkey, uten passord. Data i D1 (`DB`).
 *
 * Kontoene er stengt til alt er satt opp. Mangler databasen, hemmeligheten,
 * e-post eller Turnstile, svarer innloggingen 503, aldri «åpen til vi får
 * satt det opp».
 *
 *   DB                    D1-databasen (wrangler.jsonc)
 *   BETTER_AUTH_URL       https://farger.borresendigital.no (vars)
 *   AUTH_FROM_EMAIL       avsender for innloggingslenker (vars)
 *   BETTER_AUTH_SECRET    minst 32 tilfeldige tegn (secret)
 *   RESEND_API_KEY        e-post via Resend (secret)
 *   TURNSTILE_SITE_KEY    Turnstile, offentlig (vars)
 *   TURNSTILE_SECRET_KEY  Turnstile, hemmelig (secret)
 *
 * Lokalt kan DEV_AUTH=1 brukes, men bare når adressen er localhost: da
 * skrives lenken til serverloggen i stedet for å sendes, og Turnstile hoppes
 * over.
 */

type Database = BetterAuthOptions["database"];

export interface AuthEnv {
  DB?: Database;
  BETTER_AUTH_URL?: string;
  AUTH_FROM_EMAIL?: string;
  BETTER_AUTH_SECRET?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  DEV_AUTH?: string;
}

const STRENGER = [
  "BETTER_AUTH_URL",
  "AUTH_FROM_EMAIL",
  "BETTER_AUTH_SECRET",
  "RESEND_API_KEY",
  "TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "DEV_AUTH",
] as const;

/** Bindingene og variablene fra Cloudflare, med process.env som reserve. */
export async function authEnv(): Promise<AuthEnv> {
  let cf: Record<string, unknown> = {};
  try {
    cf = (await getCloudflareContext({ async: true })).env as Record<
      string,
      unknown
    >;
  } catch {
    // Under bygging finnes ingen Cloudflare-kontekst.
  }
  const ut: AuthEnv = { DB: cf.DB as Database };
  for (const k of STRENGER) {
    const v = cf[k] ?? process.env[k];
    if (typeof v === "string" && v) ut[k] = v;
  }
  return ut;
}

/** Lokal testing: bare på localhost, aldri i produksjon. */
export function devAuth(env: AuthEnv): boolean {
  if (env.DEV_AUTH !== "1" || !env.BETTER_AUTH_URL) return false;
  try {
    return new URL(env.BETTER_AUTH_URL).hostname === "localhost";
  } catch {
    return false;
  }
}

/** Er alt på plass for å slå på kontoene? */
export function authReady(env: AuthEnv): boolean {
  const grunn =
    !!env.DB &&
    !!env.BETTER_AUTH_URL &&
    (env.BETTER_AUTH_SECRET?.length ?? 0) >= 32;
  if (!grunn) return false;
  if (devAuth(env)) return true;
  return (
    !!env.AUTH_FROM_EMAIL &&
    !!env.RESEND_API_KEY &&
    !!env.TURNSTILE_SITE_KEY &&
    !!env.TURNSTILE_SECRET_KEY
  );
}

/** Stiene med strengere fartsgrense. Innloggingslenker sendes på e-post. */
export const RATE_RULES = {
  "/sign-in/magic-link": { window: 300, max: 3 },
  "/magic-link/verify": { window: 60, max: 10 },
  "/passkey/generate-authenticate-options": { window: 60, max: 20 },
  "/delete-user": { window: 300, max: 5 },
} as const;

export function createAuth(env: AuthEnv) {
  const baseURL = env.BETTER_AUTH_URL!;
  const dev = devAuth(env);
  return betterAuth({
    appName: "ColorCraft",
    baseURL,
    secret: env.BETTER_AUTH_SECRET!,
    database: env.DB!,
    trustedOrigins: [baseURL],
    emailAndPassword: { enabled: false },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      // Sletting av konto krever en innlogging de siste ti minuttene.
      freshAge: 60 * 10,
    },
    user: { deleteUser: { enabled: true } },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: { ...RATE_RULES },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      useSecureCookies: baseURL.startsWith("https://"),
    },
    plugins: [
      magicLink({
        // Ti minutter: lenge nok til å finne e-posten, kort nok til å være trygt.
        expiresIn: 600,
        sendMagicLink: async ({ email, url, metadata }) => {
          const locale = metadata?.locale === "en" ? "en" : "nb";
          if (dev) {
            console.info(`[DEV_AUTH] Innloggingslenke til ${email}: ${url}`);
            return;
          }
          const mail = loginMail(locale, url);
          const svar = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: env.AUTH_FROM_EMAIL,
              to: [email],
              subject: mail.subject,
              text: mail.text,
              html: mail.html,
            }),
          });
          if (!svar.ok) {
            // Uten adresse eller lenke i loggen: bare at det feilet.
            console.error(`Innloggingslenken ble ikke sendt (${svar.status}).`);
            throw new Error("Kunne ikke sende e-post");
          }
        },
      }),
      passkey({
        rpID: new URL(baseURL).hostname,
        rpName: "ColorCraft",
        origin: baseURL,
      }),
      ...(dev
        ? []
        : [
            captcha({
              provider: "cloudflare-turnstile",
              secretKey: env.TURNSTILE_SECRET_KEY!,
              endpoints: ["/sign-in/magic-link"],
            }),
          ]),
      // Må stå sist: setter informasjonskapsler fra serverhandlinger.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

const cache = new WeakMap<object, Auth>();

/** Kontoene for denne forespørselen, eller null når de ikke er satt opp. */
export async function getAuth(): Promise<{ auth: Auth; env: AuthEnv } | null> {
  const env = await authEnv();
  if (!authReady(env)) return null;
  const nøkkel = env.DB as unknown as object;
  let auth = cache.get(nøkkel);
  if (!auth) {
    auth = createAuth(env);
    cache.set(nøkkel, auth);
  }
  return { auth, env };
}
