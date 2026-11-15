import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountPage } from "@/components/AccountPage";
import { kontoPath } from "@/lib/accountPaths";
import { isLocale, MESSAGES } from "@/lib/i18n";

/** Kontosiden. Status og innlogging hentes i nettleseren. */
export async function generateMetadata({
  params,
}: PageProps<"/[lang]/konto">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: MESSAGES[lang].account.metaTitle,
    alternates: { canonical: kontoPath(lang) },
    robots: "noindex, follow",
  };
}

export default async function Page({ params }: PageProps<"/[lang]/konto">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <AccountPage locale={lang} />;
}
