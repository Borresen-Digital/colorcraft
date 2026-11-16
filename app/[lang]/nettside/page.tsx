import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SitePage } from "@/components/SitePage";
import { isLocale, MESSAGES } from "@/lib/i18n";
import { sitePath } from "@/lib/site";

/**
 * Nettsidevisningen. Paletten ligger i fragmentet (#…), som bare nettleseren
 * ser, så siden er den samme statiske siden for alle paletter. Den indekseres
 * ikke: uten fragment er den tom.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[lang]/nettside">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const s = MESSAGES[lang].site;
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: { canonical: sitePath(lang) },
    openGraph: { title: s.metaTitle, description: s.metaDescription },
    robots: "noindex, follow",
  };
}

export default async function Page({ params }: PageProps<"/[lang]/nettside">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <SitePage locale={lang} />;
}
