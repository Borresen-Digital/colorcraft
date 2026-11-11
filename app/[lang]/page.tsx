import { notFound } from "next/navigation";
import { ColorCraftApp } from "@/components/ColorCraftApp";
import { isLocale } from "@/lib/i18n";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <ColorCraftApp locale={lang} />;
}
