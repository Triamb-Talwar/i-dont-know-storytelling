# FOLDER_STRUCTURE.md

> The canonical layout. Don't add top-level dirs without updating this doc.

```
i-dont-know-storytelling/
│
├── .claude/
│   ├── skills/
│   │   ├── frontend-design/       # installed via /plugin install
│   │   └── (optionally) skill-creator/, web-design-guidelines/
│   └── settings.json              # Claude Code workspace settings (optional)
│
├── CLAUDE.md                      # project-level context
├── README.md                      # human-facing overview
├── ARCHITECTURE.md                # how pieces fit
├── DESIGN.md                      # visual/interaction bible
├── TASKS.md                       # ordered task list
├── FOLDER_STRUCTURE.md            # this file
├── SKILLS.md                      # which Claude Code skills to install
│
├── .gitignore
├── .editorconfig
├── .prettierrc
├── astro.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
│
├── public/
│   ├── fonts/                     # self-hosted woff2 files per category
│   │   ├── tech/
│   │   ├── personal/
│   │   ├── political/
│   │   ├── media/
│   │   └── journal/
│   ├── ascii/                     # generated ASCII frame JSON files
│   │   ├── missile.json
│   │   ├── explosion.json
│   │   └── ...
│   ├── graph.json                 # emitted at build time (public posts only)
│   └── favicon.svg
│
├── scripts/
│   └── ascii/                     # python ASCII generators
│       ├── README.md
│       ├── requirements.txt       # pillow, numpy
│       ├── image_to_ascii.py
│       ├── missile.py
│       ├── explosion.py
│       ├── rain.py
│       └── glitch.py
│
├── src/
│   ├── content/
│   │   ├── config.ts              # Zod schema for posts
│   │   └── posts/                 # MDX posts
│   │       ├── jonah-brute-force.mdx
│   │       ├── mimir-architecture.mdx
│   │       ├── god-of-war-ragnarok.mdx
│   │       └── ...
│   │
│   ├── components/
│   │   ├── graph/
│   │   │   ├── Graph.tsx
│   │   │   ├── GraphCanvas.tsx
│   │   │   ├── NodeShapes.ts
│   │   │   ├── useGraphPhysics.ts
│   │   │   ├── useCameraTransition.ts
│   │   │   ├── useBreadcrumbs.ts
│   │   │   └── GraphMinimap.tsx
│   │   │
│   │   ├── post/
│   │   │   ├── PostView.astro
│   │   │   ├── PostHeader.astro
│   │   │   ├── InlineLink.tsx
│   │   │   ├── AsciiCanvas.tsx
│   │   │   ├── BlockQuote.astro
│   │   │   └── ReadingProgress.tsx
│   │   │
│   │   ├── transitions/
│   │   │   ├── TwoRivers.tsx
│   │   │   ├── NodeBurst.tsx
│   │   │   └── Ripple.tsx
│   │   │
│   │   ├── nav/
│   │   │   ├── Home.astro
│   │   │   └── CategoryPill.astro
│   │   │
│   │   └── mobile/
│   │       └── MobilePostList.astro
│   │
│   ├── lib/
│   │   ├── graph-data.ts          # builds graph.json from frontmatter
│   │   ├── graph-data.test.ts
│   │   ├── categories.ts          # single source of truth for cat config
│   │   ├── theme-tokens.ts
│   │   └── utils.ts
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── PostLayout.astro
│   │
│   ├── pages/
│   │   ├── index.astro            # graph homepage
│   │   └── posts/
│   │       └── [...slug].astro    # dynamic post pages
│   │
│   └── styles/
│       ├── globals.css            # resets, base typography
│       ├── tokens.css             # design tokens (non-theme-specific)
│       └── themes/
│           ├── tech.css
│           ├── personal.css
│           ├── political.css
│           ├── media.css
│           └── journal.css
│
├── tests/
│   ├── e2e/
│   │   └── smoke.spec.ts
│   └── fixtures/
│       └── sample-posts/
│
└── docker/
    ├── Dockerfile
    └── Caddyfile
```

## Conventions

- **One component per file.** If a file has multiple, one is "main" and exported default.
- **Astro components** (`.astro`) for anything server-rendered and non-interactive.
- **React components** (`.tsx`) only for islands — interactive client-side things.
- **CSS custom properties** live in `src/styles/` and `src/lib/theme-tokens.ts`. No inline styles except for dynamic values (e.g., force-graph node positions).
- **Path aliases** via `tsconfig.json`: `@components/*`, `@lib/*`, `@content/*`, `@styles/*`.
- **Tests** colocated with source (`foo.ts` + `foo.test.ts`) for unit tests; e2e tests in `tests/e2e/`.
- **Content posts** use kebab-case slugs matching their filename.
