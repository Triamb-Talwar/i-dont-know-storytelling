# ARCHITECTURE.md

> How the pieces fit. Read after `CLAUDE.md` and before any implementation task.

## System at a glance

```
┌──────────────────────────────────────────────────────────────────┐
│                         BUILD TIME (Astro)                        │
│                                                                   │
│  src/content/posts/*.mdx                                          │
│         │                                                         │
│         │  (frontmatter parsed, body compiled to HTML+React)      │
│         ▼                                                         │
│  src/lib/graph-data.ts  ────►  /dist/graph.json                   │
│         │                      (all public nodes + edges,          │
│         │                       served as static asset)            │
│         ▼                                                         │
│  Static HTML for every post + static graph.json                   │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                         RUNTIME (Browser)                         │
│                                                                   │
│  /  (index.astro)                                                 │
│   ├─ Static shell (SEO text, nav)                                 │
│   └─ <Graph client:load />  ◄── React island                      │
│        ├─ Fetches /graph.json                                     │
│        ├─ d3-force simulation                                     │
│        ├─ Canvas 2D renderer                                      │
│        └─ Click → View Transitions API → /posts/<slug>            │
│                                                                   │
│  /posts/<slug>  ([...slug].astro)                                 │
│   ├─ Static HTML body (SSR from MDX)                              │
│   ├─ Category theme CSS loaded via <link>                         │
│   ├─ <AsciiCanvas client:visible />  ◄── React islands (per-post) │
│   └─ <InlineLink client:load />     ◄── Tiny island for two-       │
│                                         rivers transition        │
└──────────────────────────────────────────────────────────────────┘
```

## Build-time data flow

1. Every `.mdx` in `src/content/posts/` is validated against the schema in `src/content/config.ts`.
2. `src/lib/graph-data.ts` runs at build time, reads all public post frontmatter, and emits:
   - `/public/graph.json` — all nodes and edges, minus private posts (unless a `?preview=<token>` query is present, handled differently)
   - `/public/graph-full.json` — includes private, served behind a token check at request time if we add that later
3. Astro generates static HTML for each post under `/posts/<slug>/index.html`.
4. Category theme CSS files are generated from `src/lib/theme-tokens.ts` at build time into `/dist/themes/<category>.css`.

## Runtime islands

Astro ships zero JS by default. We add JS only where needed, as "islands":

| Island | Location | Hydration | Why |
|---|---|---|---|
| `<Graph>` | `/` (homepage) | `client:load` | Main interactive. Needs to be live immediately. |
| `<AsciiCanvas>` | Inside posts | `client:visible` | Only hydrate when scrolled near viewport. |
| `<InlineLink>` | Inside posts | `client:load` | Tiny (<5KB). Wraps inline `<a>` to trigger two-rivers transition. |
| `<ReadingProgress>` | Inside posts | `client:idle` | Background priority, just a scrollbar indicator. |

Everything else — post content, nav, footer, category theme switching — is pure HTML/CSS.

## Component tree

```
src/components/
├── graph/
│   ├── Graph.tsx                  # top-level island, orchestrates
│   ├── GraphCanvas.tsx            # the <canvas> + renderer
│   ├── NodeShapes.ts              # hex, blob, diamond, etc.
│   ├── useGraphPhysics.ts         # d3-force wrapper hook
│   ├── useCameraTransition.ts     # zoom/pan logic for GTA-V effect
│   ├── useBreadcrumbs.ts          # session-local edge highlight memory
│   └── GraphMinimap.tsx           # post-view: tiny corner graph
│
├── post/
│   ├── PostView.astro             # Astro component, server-rendered
│   ├── PostHeader.astro           # category-specific styling
│   ├── InlineLink.tsx             # React island — triggers two-rivers
│   ├── AsciiCanvas.tsx            # scroll-driven ASCII renderer
│   ├── BlockQuote.astro           # category-specific quote style
│   └── ReadingProgress.tsx
│
├── transitions/
│   ├── TwoRivers.tsx              # two-rivers overlay + animation
│   ├── NodeBurst.tsx              # node → post expand
│   └── Ripple.tsx
│
└── nav/
    ├── Home.astro                 # always-present home-pill nav
    └── CategoryPill.astro         # shows current category, clickable to filter graph
```

```
src/lib/
├── categories.ts                  # single source of truth for cat config
├── graph-data.ts                  # builds graph.json from frontmatter
├── graph-data.test.ts
├── seed.ts                        # mulberry32 PRNG, hash(slug) -> rng
├── seed.test.ts                   # determinism + distribution tests
└── variations/                    # per-category variation pickers
    ├── index.ts                   # category -> picker dispatch
    ├── tech.ts
    ├── personal.ts
    ├── political.ts
    ├── media.ts
    └── journal.ts
```

## Data model (detailed)

### Post frontmatter schema (zod, in `src/content/config.ts`)

```ts
const postSchema = z.object({
  title: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum(['tech', 'personal', 'political', 'media', 'journal']),
  visibility: z.enum(['public', 'private']).default('public'),
  created: z.date(),
  updated: z.date().optional(),
  tags: z.array(z.string()).default([]),
  links: z.array(z.object({
    slug: z.string(),
    reason: z.string().optional(),
    strength: z.number().min(0).max(1).default(0.5),
  })).default([]),
  hero: z.object({
    type: z.enum(['ascii', 'image', 'none']).default('none'),
    src: z.string().optional(),
  }).optional(),
});
```

### Graph JSON shape (emitted)

```ts
interface GraphData {
  nodes: Array<{
    id: string;            // slug
    title: string;
    category: Category;
    visibility: 'public' | 'private';
    size: number;          // derived: public=large, private=small
    age_days: number;      // derived: used for color-temp decay
    tags: string[];
  }>;
  edges: Array<{
    source: string;
    target: string;
    reason?: string;
    strength: number;
  }>;
}
```

### Seeded variations

Each post's slug is hashed at build time into a 32-bit seed via `hashSlug(slug)` in `src/lib/seed.ts`. The seed is passed to the matching category picker (`src/lib/variations/<category>.ts`), which returns an object of chosen variants (ornament glyph, version tag, film ratio, etc.). Variants are written into the post HTML as `data-*` attributes on the post root element (e.g. `<article data-variant-ornament="❦" data-variant-rule="dotted">`), then consumed by CSS rules like `[data-variant-ornament="❦"] .section-break::after { content: "❦"; }`. No runtime JS required for CSS-driven variants. SVG-driven variants (ink blots, stamps, circuit traces) render server-side into the HTML via small Astro components that accept the seed and emit inline SVG.

## Transition architecture

### Graph → post (GTA-V)

1. User clicks node. Handler intercepts default nav.
2. `document.startViewTransition(async () => { ... })` kicks off.
3. Before transition: set `view-transition-name: node-<slug>` on the clicked node and `view-transition-name: post-hero-<slug>` on the incoming post's hero area.
4. Inside the transition callback, `router.push(/posts/<slug>)` (or direct location change).
5. Browser's View Transition engine morphs between the two named elements. We supplement with CSS `::view-transition-old(*)` and `::view-transition-new(*)` rules for the zoom/pan feel.
6. Fallback (no VT support): a plain Motion-driven fade + slide.

### Post → post via inline link (two-rivers)

1. `<InlineLink>` intercepts click.
2. Determine current and target categories. If same category, use plain View Transition crossfade. Else, two-rivers.
3. Two-rivers overlay mounts, animates. Mid-animation (~350ms), swap DOM to new post (under the overlay).
4. Animate overlay out. New post's `InlineLink` back to origin gets a one-shot pulse class applied for 2s.

### Post → graph (reverse)

Same View Transition mechanism, reversed. Slightly faster easing. The node snaps back into its graph position with a tiny overshoot-spring on the final frame (~15px).

## State management

No heavy state libraries. Use:
- **URL** for current post (Astro routes)
- **React `useState` / `useReducer`** within `<Graph>` for hover, selection, camera
- **`sessionStorage`** for breadcrumb trail (cleared on tab close, intentional)
- **`localStorage`** for user prefs (reduced-motion override, theme override if we add light mode) — *only* these two keys, nothing else.

No Redux, no Zustand, no context providers beyond the theme token provider (which is just a CSS-variable attachment, zero React context).

## Accessibility baseline

- Graph has a parallel `<nav role="navigation">` with all posts in categorized lists, visually hidden but keyboard- and screen-reader-accessible. Tab order: sections, then posts within.
- ASCII animations have `role="img"` with `aria-label` describing the animation ("missile flies across, then explodes").
- All transitions respect `prefers-reduced-motion: reduce`.
- All interactive elements keyboard-reachable. Graph supports arrow-key navigation between connected nodes (advanced, Phase 3).
- Color contrast: body text ≥ 7:1 (WCAG AAA), UI ≥ 4.5:1 (AA).

## Security / privacy

- Private posts never appear in `graph.json` (the public graph). They live in `graph-full.json` which is either (a) not built for production or (b) gated behind a server-side auth check if we add a backend.
- No analytics tracking by default. If added later, self-hosted Plausible or similar, no Google.
- CSP headers set by Caddy/hosting layer: no inline scripts (Astro builds all scripts as files).

## Testing

- **Vitest** for unit tests on `src/lib/` (graph data builder, category resolver, etc.)
- **Playwright** for one smoke test per phase: Phase 1 = graph renders + click works. Phase 2 = ASCII canvas visible. Phase 3 = transitions complete.
- No snapshot tests for UI. Visual review by author.

## Deployment

- Build outputs to `/dist/`.
- Dockerfile uses multi-stage build: node-alpine for build, `caddy:alpine` for serve.
- Single `docker compose up` on the VPS.
- Caddy config handles: gzip/brotli, cache headers (1y for `/fonts/`, `/ascii/`, `/graph.json` with cache-bust query on new builds), CSP headers.

## What is explicitly NOT in this architecture

- No CMS / admin UI. Posts are MDX files committed to the repo.
- No database. Graph comes from static JSON built from frontmatter.
- No server-side rendering beyond Astro's static build. No SSR server process.
- No user accounts, comments, or social features.
- No email newsletter integration in Phase 1.
