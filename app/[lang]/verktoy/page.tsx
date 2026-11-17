import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ColorCraftApp } from "@/components/ColorCraftApp";
import { isLocale, MESSAGES, toolPath } from "@/lib/i18n";

/**
 * Verktøyet. Paletten ligger i fragmentet (#…), som bare nettleseren ser.
 * Forsiden er landingssiden, og gamle lenker dit sendes hit.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[lang]/verktoy">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const m = MESSAGES[lang].meta;
  return {
    title: m.toolTitle,
    description: m.toolDescription,
    alternates: {
      canonical: toolPath(lang),
      languages: {
        nb: toolPath("nb"),
        en: toolPath("en"),
        "x-default": toolPath("nb"),
      },
    },
    openGraph: {
      title: m.toolTitle,
      description: m.toolDescription,
      url: toolPath(lang),
    },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/verktoy">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // Logoen ligger i LogoProvider i layouten, så profilsiden får den også.
  return <ColorCraftApp locale={lang} />;
}
