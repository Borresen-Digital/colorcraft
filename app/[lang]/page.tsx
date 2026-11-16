import { notFound } from "next/navigation";
import { ColorCraftApp } from "@/components/ColorCraftApp";
import { isLocale } from "@/lib/i18n";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // Logoen ligger i LogoProvider i layouten, så profilsiden får den også.
  return <ColorCraftApp locale={lang} />;
}
