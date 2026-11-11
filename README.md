<div align="center">
  <p>
    <img src="/public/images/MBlogo.png" alt="Personal Logo" width="150" />
  </p>
  <p>
    <img src="/public/images/logo.png" alt="Theme-Advisor Logo" width="150" />
  </p>

# ColorCraft

> Professional color palette testing and visualization tool – built with Next.js and Tailwind CSS

[![Next.js](https://img.shields.io/badge/Next.js-16-000000.svg)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
</div>

## Features

- 🎨 Professional color palette testing and visualization
- 🌓 Light and dark mode variants for each palette
- ✏️ Create, edit, and delete custom color palettes
- 💾 Local storage support for persistent custom palettes
- 🔍 Search and filter palettes by name or description
- 🎯 Live preview with realistic UI components
- ♿ Contrast check against WCAG 2.2 (AA/AAA) with suggested fixes
- 📋 Export as CSS variables with dark mode, Tailwind 4 `@theme`, or W3C Design Tokens (JSON)
- 🔗 Shareable links: the palette lives in the URL fragment, no database
- 🌍 Norwegian (`/`) and English (`/en`)
- 🏔️ Themed palettes named after places in Vestfold

Live at [farger.borresendigital.no](https://farger.borresendigital.no), a free tool from [Børresen Digital](https://www.borresendigital.no).

## Screenshot

<div align="center">
  <img src="/public/images/color-craft-screenshot.png" alt="ColorCraft Screenshot" width="900" />
</div>

## Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ColorCraft.git
cd ColorCraft
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm run dev
```

4. **Open your browser**

```
http://localhost:3000
```

## Built With

- **[Next.js](https://nextjs.org)** - React framework for production
- **[React](https://react.dev)** - JavaScript library for building user interfaces
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[TypeScript](https://www.typescriptlang.org)** - Typed superset of JavaScript
- **[Inter Font](https://fonts.google.com/specimen/Inter)** - Modern typography
- **[JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)** - Code display font

## Project Structure

```
ColorCraft/
├── app/
│   ├── globals.css         # Global styles and Tailwind imports
│   ├── layout.tsx          # Root layout with metadata
│   └── page.tsx            # Main application page
├── components/
│   ├── ColorDetails.tsx    # Color information and CSS export
│   ├── LivePreview.tsx     # Interactive palette preview
│   ├── Logo.tsx            # Reusable logo component
│   ├── PaletteEditor.tsx   # Palette creation and editing modal
│   └── PaletteSelector.tsx # Palette selection with search and pagination
├── data/
│   └── palettes.ts         # Default color palette definitions
├── types/
│   └── palette.ts          # TypeScript interfaces
├── utils/
│   └── localStorage.ts     # Browser storage utilities
└── public/
    └── images/
        └── logo.png        # Application logo
```

## Color Palette Structure

Each palette follows a consistent structure with 14 color properties:

```typescript
interface ColorPalette {
  name: string;
  id: string;
  description: string;
  colors: {
    primary: string; // Main brand color
    secondary: string; // Supporting color
    accent: string; // Highlight color
    warm: string; // Warm accent
    cool: string; // Cool accent
    background: string; // Page background
    surface: string; // Card/component background
    foreground: string; // Primary text color
    muted: string; // Secondary text color
    border: string; // Border and divider color
    success: string; // Success state color
    warning: string; // Warning state color
    error: string; // Error state color
    info: string; // Info state color
  };
}
```

## Usage

### Creating Custom Palettes

1. Click **"Add Palette"** in the header
2. Fill in palette name and description
3. Customize colors using color picker or hex input
4. Optionally create a dark mode variant
5. Save - palette is automatically stored locally

### Editing Existing Palettes

1. Select the palette you want to edit
2. Click **"Edit Palette"** in the header
3. Modify colors as needed
4. Save changes

### Exporting CSS

The **CSS Export** section provides ready-to-use CSS custom properties:

```css
root {
  --color-primary: #0284c7;
  --color-secondary: #e0f2fe;
  --color-accent: #0ea5e9;
  /* ... additional color variables */
}
```

## Included Palettes

ColorCraft comes with 15 palettes, each with a light and a dark variant. The themed palettes are named after places in Vestfold, Norway:

- **Havet** - Cool blues and teals
- **Solnedgang** - Warm oranges and reds
- **Skogen** - Rich greens and browns
- **Sande** - Calm greens and earthy tones
- **Verdens Ende** - Blues and purples of sea and sky
- **Ramnes** - Warm earth tones from open fields
- **Slottsfjellet** - Noble, regal colors
- **Kaldnes** - Steel and copper
- **Bøkeskogen** - Forest with gold and silver
- **Larvikitt** - Deep blue with a sheen, like the stone
- **Lardal** - Natural browns and greens
- **Borre** - Burgundy and gold
- **Mølen** - Light and pearl grey
- **Ula** - Sun, sand and terracotta
- **Svenner** - Cool teal and silver

Palette ids from V1 (for example `shire`) are mapped to the new ones in `data/palettes.ts`.

## Browser Support

- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Building for Production

```bash
npm run build
```

The optimized build will be available in the `.next/` directory.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/ColorCraft/issues).

### Development Guidelines

1. Follow TypeScript best practices
2. Use Tailwind utility classes for styling
3. Maintain component modularity
4. Ensure responsive design compatibility
5. Add proper TypeScript interfaces

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <i>"Design is not just what it looks like and feels like. Design is how it works."</i>
  <br>
  <sub>Built with ❤️ for designers and developers</sub>
</div>
