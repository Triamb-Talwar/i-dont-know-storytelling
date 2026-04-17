# CLAUDE.md

> Read this file before doing anything. It's the source of truth for the project's intent, stack, and non-obvious constraints.

## Project

**Name:** `i-dont-know-storytelling` (working title, from the tagline *"I don't know storytelling but I have stories to tell"*)

**What it is:** A personal blog where every post is a node on a single, interconnected graph rendered on the homepage. Posts link to other posts inline, and those links aren't just hyperlinks — they're edges on the graph and they're themed by category (tech / personal / political / media / journal). Each category has its own visual identity. The graph IS the narrative mechanism: the author digresses mid-post, circles back, branches into tangents, and the graph makes those tangents explorable as first-class things.

**What it is NOT:** A generic blog with a sidebar of "related posts." The graph is the thesis. Without it, this project doesn't exist.

## Non-negotiables

1. **The graph is the homepage.** No fallback list view on desktop. (Mobile gets a degraded list — see `DESIGN.md`.)
2. **Node-to-post transition must feel like the GTA V character-switch camera pull.** Zoom out of graph, pan to target, zoom into the node, node expands into full post view. One continuous spatial move. No page reload.
3. **Different categories have different aesthetics.** Not just accent colors — different fonts, spacing, mood. See `DESIGN.md` § Category Themes.
4. **ASCII animations are a first-class content element.** Scroll-driven, category-aware, cheap to render. See `DESIGN.md` § ASCII System.
5. **Performance budget:** Lighthouse performance > 90 on mid-tier mobile. Graph stays 60fps on desktop with 200+ nodes. If a feature can't meet this, it gets cut or degraded — see § Performance Budget.
6. **SSR the post content** so readers on slow networks see text before the graph JS loads, and so search engines can find it. Interactivity is layered on top.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Meta-framework | **Astro** | Zero JS by default, islands architecture, MDX built-in, perfect for content-heavy + selective interactivity |
| Interactive islands | **React 19** + TypeScript | Claude Code productivity, massive ecosystem, force-graph libs mature. Chosen over SolidJS (faster but smaller eco) and Svelte (tiny bundles but less battle-tested graph tooling) |
| Graph physics | **d3-force** | Proven, lightweight, we render ourselves on canvas for creative control |
| Graph rendering | **Canvas 2D** (custom) | WebGL overkill for ≤500 nodes; Canvas 2D gives us custom node shapes per category, full creative control, easy debugging |
| Styling | **Tailwind v4** + CSS custom properties (tokens) | Tailwind for speed, CSS vars for per-category theme swaps |
| Animation | **Motion** (formerly Framer Motion) for React + **native CSS scroll-driven animations** where possible | Native CSS runs off main thread (compositor), use it for scroll-linked stuff. Motion for imperative/orchestrated sequences. |
| Page transitions | **View Transitions API** (native, cross-document) | Handles the GTA-V zoom for graph→post and back |
| Content | **MDX** (via Astro content collections) | Posts are `.mdx` files, can import React components inline (e.g., `<AsciiCanvas name="missile" />`) |
| ASCII generation | **Python scripts** in `/scripts/ascii/` | Deterministic, author runs locally, commits generated art as `.txt` or `.json` frame data |
| Host | **Self-hosted** (Docker + Caddy or similar) | Author's preference — no Vercel/AWS/GCP |

## Performance budget

Enforce in every PR:

- Graph interaction: 60fps with 200 nodes on a 2023 MacBook Air / mid-range Android.
- Initial HTML for a post: < 50 KB before any JS loads, fully readable as prose.
- Graph island JS: < 120 KB gzipped (d3-force + renderer).
- Per-post JS additions (ASCII canvases, etc.): < 20 KB each.
- `content-visibility: auto` on all post sections, paragraphs, and the graph minimap.
- `prefers-reduced-motion`: respected everywhere. ASCII animations become static; graph transitions become fades.
- Mobile: Graph degrades to a vertical node list grouped by category if viewport width < 768px OR `navigator.deviceMemory < 4`.

If you're about to add a dependency larger than 30 KB gzipped, ask first.

## Data model

Posts are MDX files. Frontmatter defines the graph:

```yaml
---
title: "Why Jonah brute-forces SQL"
slug: "jonah-brute-force-sql"
category: tech              # tech | personal | political | media | journal
visibility: public          # public | private
created: 2026-03-14
tags: [jonah, agents, sql, openclaw]
links:                      # edges out of this node
  - slug: "mimir-home-assistant"
    reason: "same agentic architecture pattern"
  - slug: "god-of-war-ragnarok"
    reason: "mimir naming"
  - slug: "hmcl-demo-retrospective"
    reason: "where jonah shipped"
---
```

- `category` controls theme, node color, node shape, and typography.
- `visibility: public` → large node, full URL, indexed. `visibility: private` → small dot, requires auth or a secret query param, not indexed.
- `links` defines outbound edges. Edges are one-directional in data but rendered undirected unless the reason differs per direction.

Graph is built at build-time from frontmatter. See `src/lib/graph-data.ts` (to be implemented per `TASKS.md`).

## Folder structure (target)

See `FOLDER_STRUCTURE.md`. Don't invent new top-level directories without updating that doc.

## How to work on this project

1. **Read `DESIGN.md` before writing any UI.** The creative vision is specific — skip this and you'll build something generic.
2. **Check `TASKS.md` for what's next.** Tasks are ordered. Phase 1 is the MVP graph + transitions. Phase 2 is ASCII. Phase 3 is polish.
3. **Use the `frontend-design` skill (installed in `.claude/skills/`).** It explicitly trains Claude to avoid "AI slop" aesthetics. Let it activate — don't reach for Inter + purple gradients.
4. **Before building a component, check if a category-specific variant is needed.** Many components (post header, inline link, block quote) render differently per category.
5. **Write tests for the graph data layer and visibility filtering, not for visual components.** Visual fidelity is reviewed by the author.
6. **When in doubt about aesthetics, lean bolder.** The author's default is "fantastic, not minimalist" for this project even though they prefer minimal at work. See `DESIGN.md`.

## Author's communication style

- Casual, direct, typo-tolerant. Don't over-apologize or hedge.
- No sycophancy. If a plan has a hole, call it out before executing.
- Short is better than long. Code comments only where non-obvious.
- Prefers commits that ship working things end-to-end over ones that scaffold everything at once.

## Running

```bash
pnpm install
pnpm dev         # astro dev server on :4321
pnpm build       # static build
pnpm preview     # serve static build locally
pnpm ascii <name># run a python ascii generator from /scripts/ascii
```

## Where to ask for clarification

If a task in `TASKS.md` is ambiguous or conflicts with `DESIGN.md`, stop and ask in chat. Don't guess on aesthetic calls — they're load-bearing for this project.
