import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfilePage } from "@/components/ProfilePage";
import { isLocale, MESSAGES } from "@/lib/i18n";
import { profilePath } from "@/lib/profile";

/**
 * Profilsiden. Selve profilen ligger i fragmentet (#…), som bare nettleseren
 * ser, så siden er den samme statiske siden for alle profiler. Den indekseres
 * ikke: uten fragment er den tom.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[lang]/profil">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const p = MESSAGES[lang].profile;
  return {
    title: p.metaTitle,
    description: p.metaDescription,
    alternates: { canonical: profilePath(lang) },
    openGraph: { title: p.metaTitle, description: p.metaDescription },
    robots: "noindex, follow",
  };
}

export default async function Page({ params }: PageProps<"/[lang]/profil">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <ProfilePage locale={lang} />;
}
