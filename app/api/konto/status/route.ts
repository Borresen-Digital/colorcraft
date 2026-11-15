import { authEnv, authReady, devAuth } from "@/lib/auth";

/**
 * Om kontoene er slått på, og den offentlige Turnstile-nøkkelen. Brukes av
 * verktøyet for å vise «Logg inn» bare når det virker.
 */
export async function GET(): Promise<Response> {
  const env = await authEnv();
  const på = authReady(env);
  return Response.json(
    {
      enabled: på,
      turnstileSiteKey: på && !devAuth(env) ? env.TURNSTILE_SITE_KEY : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
