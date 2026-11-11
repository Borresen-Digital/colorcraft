import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { isLocale, LOCALES, localePath, MESSAGES } from "@/lib/i18n";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Rotlayouten ligger under [lang], slik Nexts i18n-guide gjør det, så <html>
 * får riktig lang på begge språk. Begge sidene gjengis ferdig ved bygg, og
 * andre verdier enn nb og en gir 404. Norsk serveres på `/` med en rewrite i
 * next.config.ts.
 */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const m = MESSAGES[lang].meta;
  return {
    metadataBase: new URL("https://farger.borresendigital.no"),
    title: m.title,
    description: m.description,
    alternates: {
      canonical: localePath(lang),
      languages: {
        nb: localePath("nb"),
        en: localePath("en"),
        "x-default": localePath("nb"),
      },
    },
    authors: [
      { name: "Børresen Digital", url: "https://www.borresendigital.no" },
    ],
    creator: "Børresen Digital",
    openGraph: {
      title: m.title,
      description: m.description,
      type: "website",
      locale: m.ogLocale,
      url: localePath(lang),
      siteName: "ColorCraft",
    },
    twitter: {
      card: "summary_large_image",
      title: m.title,
      description: m.description,
    },
    robots: "index, follow",
  };
}

// Next 16 tar ikke lenger viewport og themeColor i metadata.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3B82F6",
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} className="scroll-smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-gray-50 text-gray-900`}
        suppressHydrationWarning={true}
      >
        <div id="root" className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
