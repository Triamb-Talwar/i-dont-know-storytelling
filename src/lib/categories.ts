// Single source of truth for category configuration.
// Referenced by:
//   - content schema (valid enum values)
//   - graph data builder (Category type)
//   - graph renderer (node shape + palette)
//   - BaseLayout (which Google Fonts to preload per data-theme)
//
// Font substitutions from DESIGN.md:
//   - "iA Writer Quattro S" / "Söhne" → IBM Plex Sans (tech body)
//   - "iA Writer Mono/Duo" → IBM Plex Mono (journal)
//   - "Druk" / "Acumin Pro Condensed" → Bebas Neue (media display)
// These are free Google Fonts stand-ins until woff2 files land in public/fonts/.

export const CATEGORIES = ['tech', 'personal', 'political', 'media', 'journal'] as const;
export type Category = (typeof CATEGORIES)[number];

export type NodeShape = 'hexagon' | 'blob' | 'diamond' | 'notched-square' | 'circle';

export interface CategoryConfig {
  id: Category;
  label: string;
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  shape: NodeShape;
  fontDisplay: string;
  fontBody: string;
  googleFontsParam: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  tech: {
    id: 'tech',
    label: 'tech',
    primary: '#41D982',
    accent: '#FFB74D',
    background: '#0E0E10',
    foreground: '#E6EDE5',
    shape: 'hexagon',
    fontDisplay: '"JetBrains Mono"',
    fontBody: '"IBM Plex Sans"',
    googleFontsParam:
      'family=JetBrains+Mono:wght@400;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;1,400',
  },
  personal: {
    id: 'personal',
    label: 'personal',
    primary: '#B4461D',
    accent: '#7F2A12',
    background: '#F2ECE0',
    foreground: '#171410',
    shape: 'blob',
    fontDisplay: '"Playfair Display"',
    fontBody: '"Crimson Pro"',
    googleFontsParam:
      'family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400',
  },
  political: {
    id: 'political',
    label: 'political',
    primary: '#7A1C1C',
    accent: '#2A2420',
    background: '#F7F4EE',
    foreground: '#141210',
    shape: 'diamond',
    fontDisplay: '"PT Serif"',
    fontBody: '"Source Serif 4"',
    googleFontsParam:
      'family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;1,400',
  },
  media: {
    id: 'media',
    label: 'media',
    primary: '#4FD1E3',
    accent: '#C8321C',
    background: '#0A0E1A',
    foreground: '#E3EEF7',
    shape: 'notched-square',
    fontDisplay: '"Bebas Neue"',
    fontBody: '"Inter Tight"',
    googleFontsParam:
      'family=Bebas+Neue&family=Inter+Tight:ital,wght@0,400;0,600;1,400',
  },
  journal: {
    id: 'journal',
    label: 'journal',
    primary: '#2C2C2A',
    accent: '#8C7D68',
    background: '#FCFAF6',
    foreground: '#2C2C2A',
    shape: 'circle',
    fontDisplay: '"IBM Plex Mono"',
    fontBody: '"IBM Plex Mono"',
    googleFontsParam:
      'family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400',
  },
};

export function googleFontsHref(theme: Category): string {
  return `https://fonts.googleapis.com/css2?${CATEGORY_CONFIG[theme].googleFontsParam}&display=swap`;
}
