import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { ProfilePage } from "@/components/ProfilePage";
import { authEnv } from "@/lib/auth";
import { isLocale, MESSAGES } from "@/lib/i18n";
import {
  cleanLocale,
  getBySlug,
  isSlug,
  shortPath,
  type D1,
} from "@/lib/savedProfiles";

/**
 * Den korte lenken til en lagret profil. Hentes fra databasen ved hvert
 * besøk, så kunden alltid ser siste lagrede versjon. Ren visning, uten
 * redigering, og indekseres ikke.
 */
export const dynamic = "force-dynamic";

const hent = cache(async (slug: string) => {
  if (!isSlug(slug)) return null;
  const env = await authEnv();
  if (!env.DB) return null;
  try {
    return await getBySlug(env.DB as unknown as D1, slug);
  } catch (e) {
    // Uten tabeller (en tom testdatabase) eller ved feil: ikke funnet.
    console.error("Kunne ikke hente lagret profil", e);
    return null;
  }
});

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/p/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = await hent(slug);
  if (!p || !isLocale(lang)) return { robots: "noindex, nofollow" };
  const m = MESSAGES[lang].profile;
  return {
    title: `${p.title} · ${m.eyebrow}`,
    robots: "noindex, nofollow",
    referrer: "no-referrer",
  };
}

export default async function Page({ params }: PageProps<"/[lang]/p/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const p = await hent(slug);
  if (!p) notFound();
  // Lenken viser profilen på språket den ble lagret på.
  const locale = cleanLocale(p.locale);
  if (locale !== lang) redirect(shortPath(p.slug, locale));
  return <ProfilePage locale={locale} initialHash={p.hash} readonly />;
}
