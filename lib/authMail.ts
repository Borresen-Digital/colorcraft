/**
 * E-posten med innloggingslenken. Kort, uten sporing og uten bilder, med
 * både tekst og HTML. Lenken er vår egen, men escapes likevel i HTML-en.
 */

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const TEKST = {
  nb: {
    subject: "Logg inn i ColorCraft",
    intro: "Trykk på lenken for å logge inn i ColorCraft:",
    button: "Logg inn",
    expires: "Lenken virker i ti minutter og kan bare brukes én gang.",
    ignore:
      "Har du ikke bedt om dette, kan du se bort fra e-posten. Ingen kan logge inn uten lenken.",
    footer: "ColorCraft · farger.borresendigital.no · Børresen Digital",
  },
  en: {
    subject: "Sign in to ColorCraft",
    intro: "Press the link to sign in to ColorCraft:",
    button: "Sign in",
    expires: "The link works for ten minutes and can only be used once.",
    ignore:
      "If you did not ask for this, you can ignore this email. Nobody can sign in without the link.",
    footer: "ColorCraft · farger.borresendigital.no · Børresen Digital",
  },
} as const;

export function loginMail(locale: "nb" | "en", url: string) {
  const t = TEKST[locale];
  const text = [t.intro, "", url, "", t.expires, t.ignore, "", t.footer].join(
    "\n",
  );
  const html = `<!doctype html>
<html lang="${locale}"><body style="font-family:system-ui,sans-serif;color:#1c1917;line-height:1.5;max-width:32rem;margin:0 auto;padding:24px">
<p>${esc(t.intro)}</p>
<p><a href="${esc(url)}" style="display:inline-block;background:#1c1917;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">${esc(t.button)}</a></p>
<p style="font-size:14px;color:#57534e">${esc(t.expires)}<br>${esc(t.ignore)}</p>
<p style="font-size:12px;color:#78716c">${esc(t.footer)}</p>
</body></html>`;
  return { subject: t.subject, text, html };
}
