import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { personvernPath } from "@/lib/accountPaths";
import { isLocale, localePath, MESSAGES } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/personvern">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: MESSAGES[lang].privacy.metaTitle,
    alternates: { canonical: personvernPath(lang) },
  };
}

/** Personvern for kontoene. Verktøyet uten konto sender ingenting. */
export default async function Page({
  params,
}: PageProps<"/[lang]/personvern">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const p = MESSAGES[lang].privacy;
  return (
    <main className="mx-auto max-w-2xl space-y-6 bg-paper px-4 py-10 text-ink sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        {p.title}
      </h1>
      <p>{p.intro}</p>
      {p.sections.map((s) => (
        <section key={s.heading} className="space-y-1">
          <h2 className="font-display text-xl font-bold">{s.heading}</h2>
          <p className="text-sm leading-relaxed">{s.body}</p>
        </section>
      ))}
      <p>
        <Link href={localePath(lang)} className="underline">
          {p.back}
        </Link>
      </p>
    </main>
  );
}
