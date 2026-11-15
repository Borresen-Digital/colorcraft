import { notFound } from "next/navigation";
import { ColorCraftApp } from "@/components/ColorCraftApp";
import { LogoProvider } from "@/components/BrandLogo";
import { SimpleModeProvider } from "@/components/SimpleMode";
import { isLocale } from "@/lib/i18n";

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // Logoen deles av forhåndsvisningen og fargekortet, og blir i nettleseren.
  return (
    <SimpleModeProvider>
      <LogoProvider>
        <ColorCraftApp locale={lang} />
      </LogoProvider>
    </SimpleModeProvider>
  );
}
