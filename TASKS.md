# TASKS.md

> Ordered task list. Each task is atomic enough to execute in one Claude Code session and ship as a single commit. Do tasks in order unless blocked. If a task exposes a flaw in `ARCHITECTURE.md` or `DESIGN.md`, stop and flag it before continuing.

## Phase 0 — Project setup (est. ½ day)

### 0.1 — Scaffold Astro project
- `pnpm create astro@latest` in the repo root. Choose: empty project, TypeScript strict, install deps, git init.
- Add integrations: `@astrojs/react`, `@astrojs/mdx`, `@astrojs/tailwind` (or Tailwind v4 via Vite plugin).
- Commit: `chore: astro scaffold`

### 0.2 — Install runtime deps
- `pnpm add d3-force motion clsx`
- `pnpm add -D @types/d3-force vitest @playwright/test`
- Commit: `chore: add runtime and test deps`

### 0.3 — Create folder structure
- Match the target in `FOLDER_STRUCTURE.md`. Create empty directories with `.gitkeep` where needed.
- Add placeholder `src/content/config.ts` (empty Zod schemas, just imports).
- Commit: `chore: folder structure`

### 0.4 — Install Claude Code skills
- From the project root: `/plugin install frontend-design@anthropic-agent-skills`
- Verify `.claude/skills/frontend-design/SKILL.md` exists.
- Commit: `chore: install frontend-design skill`

### 0.5 — Base config files
- `astro.config.mjs` with integrations configured.
- `tailwind.config.ts` with extend block for CSS custom properties pass-through.
- `tsconfig.json` with path aliases: `@components/*`, `@lib/*`, `@content/*`, `@styles/*`.
- `.prettierrc`, `.editorconfig`.
- Commit: `chore: base configs`

## Phase 1 — Core MVP: Graph + basic post view (est. 3-4 days)

### 1.1 — Content schema and example posts
- Implement Zod schema in `src/content/config.ts` exactly as in `ARCHITECTURE.md`.
- Write 4 example posts in `src/content/posts/` — one per category (tech, personal, media, journal). Each with real-ish content (500-1000 words) so we can visually test. Interlink them.
- Commit: `feat: content schema + seed posts`

### 1.2 — Graph data builder
- `src/lib/graph-data.ts`: function `buildGraph(posts)` → `GraphData`.
- Unit tests in `src/lib/graph-data.test.ts`. Cover: public-only filter, size derivation, age_days, edge normalization (dedupe bidirectional).
- Hook it into Astro's build via a small integration or endpoint that emits `/public/graph.json`.
- Commit: `feat: graph data builder`

### 1.3 — Category tokens and theme CSS
- `src/lib/categories.ts`: single source of truth for category config (primary hue, accent, node shape ID, font-display-url, font-body-url).
- `src/styles/themes/`: one CSS file per category. Each defines CSS custom properties scoped to `[data-theme="tech"]`, etc.
- Base layout in `src/layouts/BaseLayout.astro` applies `data-theme` per post page.
- Commit: `feat: category theme tokens`

### 1.4 — Static post page
- `src/pages/posts/[...slug].astro`: renders a post from its MDX. Applies category theme. No interactivity yet.
- `src/components/post/PostHeader.astro`, `PostView.astro`, `BlockQuote.astro`.
- Use `frontend-design` skill when building these. One category at a time — start with `journal` (simplest), verify, then do the others.
- Commit: one per category theme completed.

### 1.5 — Graph island skeleton
- `src/components/graph/Graph.tsx` as a React island (`client:load`).
- Loads `/graph.json`. Runs d3-force simulation. Renders on canvas with placeholder circles (no category shapes yet).
- Pan, zoom (pinch + wheel), click-to-navigate. Navigation uses plain `location.href = ...` for now.
- Commit: `feat: graph island, plain circles`

### 1.6 — Category-aware node shapes
- `src/components/graph/NodeShapes.ts`: canvas path functions per category.
- Integrate into graph renderer. Color by category, size by visibility.
- Commit: `feat: category node shapes`

### 1.7 — Graph interactions
- Hover: node lift + connected-node lean (see `DESIGN.md` § 4).
- Edge highlighting on hover.
- Idle camera drift after 8s (§ 3).
- Respect `prefers-reduced-motion` (disable drift, shorten hover).
- Commit: `feat: graph hover + idle behaviors`

### 1.8 — View Transitions API (graph → post)
- Wire `document.startViewTransition` on node click.
- Set view-transition-name on clicked node and target post's hero.
- Tune CSS `::view-transition-old/new` for zoom feel.
- Fallback for unsupported browsers: Motion crossfade.
- **Test:** open graph, click node, land on post — transition should feel GTA-V, not jarring.
- Commit: `feat: graph-to-post view transition`

### 1.9 — Mobile list fallback
- Detect `window.matchMedia('(max-width: 768px)')` or `navigator.deviceMemory < 4`.
- Render `<MobilePostList>` instead of `<Graph>`. Category-grouped, themed section headers.
- Commit: `feat: mobile list fallback`

### 1.10 — Phase 1 smoke test
- Playwright test: homepage loads, graph renders ≥4 nodes, click first node navigates to its post, post content matches expected.
- Lighthouse CI run locally, ensure perf > 90 on desktop.
- Commit: `test: phase 1 smoke`

**Phase 1 exit criteria:** author can write a new `.mdx`, add it to the content dir, rebuild, and it appears as a new node connected to the ones it links to, with correct category theme on click.

## Phase 2 — ASCII system (est. 2-3 days)

### 2.1 — Python pipeline setup
- `scripts/ascii/README.md`: how to run, output format.
- `scripts/ascii/image_to_ascii.py` — image → single frame JSON.
- `scripts/ascii/explosion.py`, `scripts/ascii/rain.py`, `scripts/ascii/missile.py`, `scripts/ascii/glitch.py` — procedural.
- Output to `public/ascii/<n>.json`.
- Commit: `feat: ascii python pipeline`

### 2.2 — AsciiCanvas component
- `src/components/post/AsciiCanvas.tsx`: React island, `client:visible` hydration.
- Accepts `name: string`, `align: 'left' | 'center' | 'right'`, `size?: number`.
- Loads `/ascii/<n>.json`, renders to `<canvas>`.
- Uses CSS `animation-timeline: view()` for scroll-driven frame advance where supported. JS fallback using IntersectionObserver + rAF for Firefox pre-144.
- Commit: `feat: AsciiCanvas scroll-driven renderer`

### 2.3 — MDX integration
- Register `<AsciiCanvas>` in MDX components map in `src/layouts/BaseLayout.astro`.
- Update one seed post to use inline ASCII. Visually verify.
- Commit: `feat: ascii in MDX`

### 2.4 — Ambient ASCII watermarks
- Category-specific faint scrolling backgrounds (see `DESIGN.md` § 8).
- Pure CSS — a tiled SVG/PNG background with `translateY` animation. Per category.
- Commit: `feat: ambient ASCII watermarks`

**Phase 2 exit criteria:** author can write a post that includes `<AsciiCanvas name="missile" />` and see a missile glide across as the reader scrolls.

## Phase 3 — Polish + advanced transitions (est. 2-3 days)

### 3.1 — Two-rivers transition
- `src/components/transitions/TwoRivers.tsx`: overlay component.
- `src/components/post/InlineLink.tsx`: React island wrapping inline `<a>`. On click, determines source/target categories. If cross-category, mounts `<TwoRivers>` with the two hues, animates, swaps route mid-animation.
- Use `@property --progress` for GPU-compositable gradient interp.
- Reduced-motion fallback: crossfade.
- Commit: `feat: two-rivers transition`

### 3.2 — Breadcrumb trail
- Session-local array of traversed edge IDs in `sessionStorage`.
- Graph renderer draws these edges with decaying glow (30s total fade, 3 steps).
- Commit: `feat: breadcrumb edge trail`

### 3.3 — Node breathing + color temperature
- Node scale pulse keyed to `age_days` (§ 2 in DESIGN.md).
- Saturation decay for older posts (§ 5).
- Commit: `feat: node breathing and color temp`

### 3.4 — Private node teasers
- Render private posts (from `graph-full.json` if accessible) as 3px dots. On hover: lock icon. On click: `"🔒 private — ask me"`.
- Commit: `feat: private node teasers`

### 3.5 — Typewriter title + you-are-here ripple
- Apply to post entry transition (first visit per session per post).
- Commit: `feat: typewriter title + ripple`

### 3.6 — Tag constellations
- Hover a tag in post metadata → in the minimap (post-view corner graph), all posts with that tag pulse. Lets user discover by topic.
- Commit: `feat: tag constellations`

### 3.7 — Accessibility pass
- Parallel nav for screen readers.
- Keyboard navigation in graph (arrow keys move to connected node).
- `aria-label`s on ASCII canvases.
- Axe audit, fix issues.
- Commit: `chore: a11y pass`

### 3.8 — Performance audit
- Lighthouse on mobile (throttled). Must be >90 perf. If not, diagnose: bundle size, font loading, canvas cost.
- Check with 100 seeded nodes, then 200.
- Commit with fixes as needed.

**Phase 3 exit criteria:** the site ships. Author writes one "launch post" and deploys.

## Phase 4 — Post-launch iteration (as needed)

Not planned here. Driven by what actually breaks or feels off once the author is using it for real.

Candidates: reading time estimate, RSS feed, search (Pagefind integrates well with Astro), dark/light toggle, footnotes system, comments via webmentions.

## Dependency / unblocker map

- 1.2 blocks 1.5 (graph needs data builder)
- 1.3 blocks 1.4 (post page needs theme tokens)
- 1.5 blocks 1.6, 1.7, 1.8
- 1.8 blocks 3.1 (two-rivers is built on similar VT primitives)
- 2.1 blocks 2.2
- 2.2 blocks 2.3

Phases are sequential. Don't start Phase 2 before Phase 1's exit criteria are met.

## How to use this file as Claude Code

When starting a session, say: *"pick up from the next unchecked task in TASKS.md"*. Claude Code should:
1. Re-read `CLAUDE.md`, `DESIGN.md`, `ARCHITECTURE.md` (at least skim).
2. Identify the next unchecked task.
3. Confirm task scope in one sentence before coding.
4. Execute, commit, mark the task done in this file.
5. Suggest the next task or stop.
