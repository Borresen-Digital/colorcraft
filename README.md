<div align="center">
  <img src="app/[lang]/icon.svg" alt="" width="72" />

# ColorCraft

> Build a colour profile from a brand manual or a logo, test it on real components, check contrast against WCAG 2.2, and export it for print and code. A free tool from Børresen Digital.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000.svg)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
</div>

ColorCraft is a free tool from [Børresen Digital](https://www.borresendigital.no), live at [farger.borresendigital.no](https://farger.borresendigital.no). It runs in the browser: palettes are kept in local storage or in the link you share, and nothing is sent to a server.

## Features

### For designers and brand work

- **Palette from a brand manual** («Fra profilmanual»): enter the logo colours and support colours, and ColorCraft builds the full palette around them. Brand colours stay as they are in light mode; text, borders, background and status colours are adjusted so contrast holds.
- **Palette from a logo image**: upload the logo and the colours are read from the pixels in the browser.
- **Highlight as its own role**: colours used in small doses (buttons, single words), never as surfaces.
- **Customer direction and internal profile**: pick a direction (neutral, exclusive, sales, tonal, playful), and get freer extra colours marked for internal use only (presentations, internal documents).
- **Logo upload** in colour, black and white, shown in the previews and on the colour card. Logos stay in the browser and are not included in shared links.
- **Surfaces**: preview of the support colours as full-bleed sections and info boxes.
- **«I bruk» (in use)**: the palette on a rollup, an ad, a business card and a slide.
- **Approximate CMYK** based on Coated FOGRA39, plus tints (100–20 %). For print, use the values from the printer's profile.
- **Check the values in a manual**: HEX, RGB and CMYK for a colour are compared, and likely typos are flagged.
- **Tone, warmth and saturation** for the brand colours, calculated in OKLCH.
- **Colour card** for the customer as PDF or PNG, with HEX, RGB, CMYK, tints, contrast and a second page showing the palette in use.
- **Profile page** (prototype, `/profil`): the colour profile as a clean page the designer can send to the customer.
- **Glossary**: what each colour is called in ColorCraft and what other people call it.
- **Simple mode** is the default and shows the manual's colours as they are. «Alt» opens the full tool. The choice is remembered.

### For developers

- **Export** as CSS variables with dark mode, Tailwind 4 `@theme`, or W3C Design Tokens (JSON).
- **Shareable links**: the palette lives in the URL fragment (after `#`), which the browser never sends to the server. No database.
- **Live preview** on realistic UI components, in light and dark mode.
- **Built-in palettes** can be edited and the changes saved, and you can create, edit and delete your own palettes. Both are stored in local storage.
- **Search** palettes by name or description.

### Accessibility

- **Contrast check against WCAG 2.2** (AA/AAA) for the colour pairs in the palette, with suggested fixes you can apply.
- Contrast for white and black text on each colour, and for text and logo on the «I bruk» surfaces.
- Responsive layout for mobile and tablet.
- Norwegian on `/` and English on `/en`.

## Who it's for

- Designers making brand profiles for small businesses, who start with a logo or a brand manual and need a palette that works on screen and in print.
- Developers who need the palette as tokens, CSS variables or Tailwind config.

## Getting started

Requires Node.js 22 or newer.

```bash
git clone https://github.com/Borresen-Digital/colorcraft.git
cd colorcraft
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

| Script               | What it does                                           |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Start the development server                           |
| `npm run build`      | Production build                                       |
| `npm test`           | Run the tests (Vitest)                                 |
| `npm run lint`       | Lint with ESLint                                       |
| `npm run typecheck`  | Generate route types and run `tsc --noEmit`            |
| `npm run preview:cf` | Build with OpenNext and preview on the Workers runtime |
| `npm run deploy:cf`  | Build with OpenNext and deploy to Cloudflare Workers   |

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) 4
- [TypeScript](https://www.typescriptlang.org) 5
- [Vitest](https://vitest.dev) for tests
- [pdf-lib](https://pdf-lib.js.org) for the colour card PDF, loaded only when someone asks for a PDF
- [OpenNext](https://opennext.js.org/cloudflare) on [Cloudflare Workers](https://workers.cloudflare.com)
- Fonts via `next/font`: Bricolage Grotesque, Instrument Sans and JetBrains Mono

## Project structure

```
colorcraft/
├── app/
│   ├── globals.css
│   └── [lang]/              # nb on /, en on /en
│       ├── layout.tsx
│       ├── page.tsx         # The tool
│       ├── icon.svg
│       └── profil/
│           └── page.tsx     # Profile page (prototype)
├── components/              # UI: ColorCraftApp, BrandBuilder, ContrastPanel,
│                            # ExportPanel, ColorCardPanel, InUsePreview, ...
├── lib/                     # Colour logic, each module with a *.test.ts next to it
│   ├── brand.ts             # Palette from a brand manual
│   ├── cmyk.ts              # Approximate CMYK (FOGRA39)
│   ├── colorCard.ts         # Colour card model and layout
│   ├── cardRender.ts        # Colour card to PDF and PNG
│   ├── contrast.ts          # WCAG contrast and suggestions
│   ├── export.ts            # CSS, Tailwind and design tokens
│   ├── i18n.ts              # Norwegian and English texts
│   ├── inUse.ts             # Colours for «I bruk»
│   ├── logoColors.ts        # Colours read from a logo image
│   ├── share.ts             # Shareable links
│   ├── tones.ts             # OKLCH tone, warmth and saturation
│   └── ...
├── data/
│   └── palettes.ts          # Built-in palettes
├── types/
│   └── palette.ts           # ColorPalette
└── utils/
    └── localStorage.ts      # Own palettes and changes to built-in ones
```

## Palette structure

Each palette has 14 colour roles:

```typescript
interface ColorPalette {
  name: string;
  id: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    warm: string;
    cool: string;
    background: string;
    surface: string;
    foreground: string;
    muted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}
```

In `data/palettes.ts`, a palette can also have a `darkVariant` and, for palettes built from a brand manual, a `brand` object with the logo, support, highlight and internal colours, CMYK from the manual, colour names and the customer's direction.

## Included palettes

ColorCraft comes with 15 palettes, each with a light and a dark variant, named after places in Vestfold, Norway:

- **Havet** – cool blues and teals
- **Solnedgang** – warm oranges and reds
- **Skogen** – deep greens and browns
- **Sande** – calm greens and earthy tones
- **Verdens Ende** – blues and purples of sea and sky
- **Ramnes** – warm earth tones from open fields
- **Slottsfjellet** – noble, regal colours
- **Kaldnes** – steel and copper
- **Bøkeskogen** – forest with gold and silver
- **Larvikitt** – deep blue with a sheen, like the stone
- **Lardal** – natural browns and greens
- **Borre** – burgundy and gold
- **Mølen** – light and pearl grey
- **Ula** – sun, sand and terracotta
- **Svenner** – cool teal and silver

Palette ids from V1 (for example `shire`) are mapped to the new ones in `data/palettes.ts`, so old shared links still work.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) (in Norwegian) and the [issues page](https://github.com/Borresen-Digital/colorcraft/issues). Before opening a PR, run `npm test`, `npm run lint` and `npm run typecheck`.

## License

MIT. See [LICENSE](LICENSE).
