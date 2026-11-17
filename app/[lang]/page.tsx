import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { isLocale, LEGACY_REDIRECT_SCRIPT } from "@/lib/i18n";

/**
 * Forsiden er landingssiden. Verktøyet ligger på /verktoy. Delte lenker fra
 * før flyttingen (`/#p=…`) sendes dit av skriptet øverst, før siden tegnes.
 */
export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: LEGACY_REDIRECT_SCRIPT }} />
      <LandingPage locale={lang} />
    </>
  );
}
