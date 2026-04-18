# DESIGN.md

> The visual/interaction bible. This is the most important doc for aesthetics. Read it fully before touching UI.

## North star

*"I don't know storytelling but I have stories to tell."*

The graph is a physical manifestation of how the author thinks: topics sprawl, digress, reconnect. Every design decision should reinforce this — the site should feel like walking through someone's brain, not clicking through a CMS.

**Aesthetic bar:** distinctive, not generic. If a screenshot could belong to any other blog, it's wrong. The author prefers minimal design professionally and is explicitly asking for the opposite here — this is a personal project and should feel personal, expressive, and crafted.

Explicitly avoid: Inter, Roboto, Space Grotesk, purple gradients on white, generic card grids, "hero section → features → CTA" structure, dashboard aesthetics.

## The graph homepage

### Visual concept

Dark canvas. Nodes float, held in place by force-directed physics (d3-force). Each node is a shape sized by visibility (public = large, private = small dot). Each node is colored by its category's primary hue. Edges are thin, slightly curved, with opacity proportional to connection strength (number of inbound links).

The graph is alive but calm. Idle drift is a slow, ambient orbital motion — not a hyperactive spring simulation. The user should feel like they're looking at constellations, not at a panicked physics demo.

### Node shapes per category

Category identity starts with shape, not just color. Subtle but consistent:

- **Tech** → hexagon (circuit-board reference)
- **Personal** → hand-drawn irregular blob (SVG path with slight imperfections)
- **Political** → sharp-edged diamond / isosceles (tension, edge)
- **Media** (games, film, books) → rounded square with a notched corner (screen reference)
- **Journal** → pure circle (minimal, diaristic)

All shapes drawn via Canvas 2D path commands. Easy to author — see `src/components/graph/NodeShapes.ts`.

### Edges

- Base edge: 1px, category-neutral color (a dim neutral), 40% opacity.
- Edges from hovered node: highlight to the source category's color, 100% opacity, animate width from 1px → 2px over 200ms.
- "Breadcrumb" trail (see below): the edges the user has traversed in this session glow faintly for ~30 seconds before fading back to base.

## Category themes

Each category has its OWN visual identity beyond color. When a user enters a post, the site *feels* different. This is the whole point.

### Tech
- **Palette:** deep charcoal background `#0E0E10`, accent terminal green `#41D982`, optional amber `#FFB74D` for callouts
- **Font display:** `JetBrains Mono` or `Berkeley Mono` (monospace) for headings
- **Font body:** `iA Writer Quattro S` or `Söhne` (characterful sans, not Inter)
- **Layout:** strict grid, generous line-height for code, block quotes styled like terminal output (`│` on the left)
- **Motion:** sharp, mechanical. No springs. Linear or `steps()` easings.
- **Mood:** terminal / maker-space / lab notebook

### Personal
- **Palette:** warm cream background `#F2ECE0`, ink black text, accent rust `#B4461D`
- **Font display:** `Playfair Display` or similar high-contrast serif with real italic
- **Font body:** `Crimson Pro` or `Lora`
- **Layout:** generous whitespace, asymmetric, text can drift slightly off-grid. Drop caps on first paragraph.
- **Motion:** organic, soft springs. Things sigh rather than snap.
- **Mood:** essay / personal letter / journal entry

### Political
- **Palette:** newsprint off-white `#F7F4EE`, high-contrast black, accent oxblood `#7A1C1C`
- **Font display:** heavy serif, tight tracking — think `Tiempos Headline` or `Canela` (or free: `PT Serif` headed tight)
- **Font body:** `Source Serif`
- **Layout:** multi-column (2-col on desktop, 1 on mobile), hard rules between sections, date/byline up top
- **Motion:** minimal — text doesn't move, this is a "read" mood
- **Mood:** op-ed / broadsheet column / dispatch

### Media (games, film, music, books)
- **Palette:** deep navy `#0A0E1A`, phosphor cyan `#4FD1E3`, blood crimson `#C8321C` (pick one of cyan/crimson per post based on vibe)
- **Font display:** `Druk` or `Acumin Pro Condensed` (cinematic, condensed)
- **Font body:** `Inter Tight` *(allowed here — its condensed cousin is fine)* or `Neue Haas Grotesk`
- **Layout:** wide, cinematic. Letterbox-style margins top/bottom on hero image. Large pull quotes.
- **Motion:** slow crossfades, long eases. Filmic.
- **Mood:** criticism / liner notes / cinematography

### Journal
- **Palette:** paper white `#FCFAF6`, soft charcoal `#2C2C2A`
- **Font display:** quiet sans or even the same as body
- **Font body:** `iA Writer Mono` or `iA Writer Duo`
- **Layout:** narrow column (~600px max), lots of whitespace, sparse
- **Motion:** almost none. Fades only.
- **Mood:** commonplace book / notes-to-self

## The GTA V transition (graph → post)

**Sequence:**
1. User clicks a node.
2. Camera zooms out slightly (scale graph canvas 0.85) over 180ms — creates "sucking in a breath" pause.
3. Camera pans to center target node over 260ms with custom ease (`cubic-bezier(0.7, 0, 0.3, 1)`).
4. Camera zooms into node (scale 1.0 → 4.0) over 320ms while node's fill color bleeds outward to fill the screen.
5. Node "bursts" into post view: full category theme locks in, post title types itself in (200ms), body content fades up with staggered paragraphs (`animation-delay: 0ms, 40ms, 80ms...`).

Total: ~900ms. Long enough to feel cinematic, short enough to not annoy on repeat visits.

Implement using the **View Transitions API** (cross-document) + a shared `view-transition-name` on the node and the post's hero area. Fallback (no VT API support): a clean crossfade + the post content slide-up.

**Reverse transition (post → graph):** inverse, but slightly faster (~700ms). The post title "implodes" back into the node, graph fades in behind.

## The "two rivers" transition (post → post via inline link)

> Author's own idea, verbatim: *"lets say im talking about jonah and its like tech blog then in that blog id say the idea of using openclaw came from e tryna making mimir and and i chose mimir because i love god of war, so in that god of war is like some other color sdo when user clicks gow they reach another node where ive expressed my love for gow and its a personal node so colors are different but general ui is same."*

When navigating between two posts in different categories via an inline link, we do NOT return to the graph. We do a **color merge transition**:

**Sequence:**
1. User clicks inline link. The clicked word stays anchored.
2. A full-viewport overlay fades in, containing two animated gradient "blobs" — one in the *current* category's color, one in the *target* category's color.
3. The two blobs flow toward each other like rivers meeting — conic gradient or SVG-animated Bezier blobs (cheap, GPU-compositable).
4. At the midpoint (~350ms in), they collide. Brief burst of both colors swirling. (~150ms)
5. Target category color dominates, washes out from the collision point, and the new post materializes behind it.
6. Overlay lifts. Inline link in the new post (pointing back to where we came from) briefly pulses the old category color, reminding the user where they came from.

**Implementation:**
- Two SVG `<path>` elements with CSS `filter: blur(40px)` for the "river" look.
- Animate with Motion, using CSS `@property --progress` registered custom properties for GPU-accelerated gradient transitions.
- Total duration: ~700ms.
- On `prefers-reduced-motion`: crossfade only.

**Why this is cheap:** Two blurred SVG paths with animated `d` attributes + a CSS gradient. No particles, no WebGL, no physics. Compositor-only. Should run at 60fps on a 2018 phone.

## ASCII system

Scroll-driven ASCII animations inline in posts. Author's vision: missile glides through a paragraph, then the next paragraph gets "exploded" into colorful ASCII dots.

### How they work

- Each ASCII animation is a **sequence of frames** stored as a JSON file in `/public/ascii/<name>.json`.
- Format: `{ frames: string[], width: number, height: number, fps: number, colormap?: { [char: string]: string } }`
- A React component `<AsciiCanvas name="missile" align="left" />` renders a canvas and ties frame progress to **scroll position** via CSS `animation-timeline: view()` (native, runs on compositor).
- As the element scrolls through the viewport, frames advance 0 → N.
- Rendered on a `<canvas>` with monospace font, one character per cell, `fillText` per char per frame (cheap: a 40×20 grid is 800 chars × 30fps = 24k ops/sec, trivial).

### Generating ASCII art

Python scripts in `/scripts/ascii/`. Deterministic — check outputs into the repo.

- `image_to_ascii.py` — single image → ASCII frame. Uses `pillow` for edge detection and brightness-to-char mapping.
- `missile.py` — procedural. Generates a missile glide + explosion sequence across N frames.
- `explosion.py` — dot-burst, colorful.
- `rain.py` — looping rain pattern.
- `glitch.py` — text-glitch effect for the hero paragraph of a post.

Library grows over time. Target: 15-20 primitives by month 3 so new posts can mostly reuse.

### Bespoke art

When the author wants something specific for a post, they'll describe it in chat and we hand-craft a new frame JSON or procedural Python script. Over time these pile up and become the library.

## More creative UI elements to implement

These are cheap (compositor-only or very light JS) but make the site feel alive.

### 1. Breadcrumb trail
Edges the user traverses in a session store in memory. They glow at 80% opacity for 30s then fade to 60%, 40%, and finally back to base. Shows the user's reading path as a visible trail through the graph.

### 2. Node breathing
Each node has a subtle scale pulse. Amplitude = 2%. Period = tied to post age (newer posts breathe faster, ~2s cycle; year-old posts breathe slow, ~6s). CSS animation only, zero JS per-node. Makes the graph feel like lungs, not a static diagram.

### 3. Idle camera drift
After 8s of no interaction on the graph, camera begins slow orbital drift (~10px/s) with a gentle Perlin noise offset. First interaction snaps it back. Feels like a living archive, like something is breathing.

### 4. Hover "lean"
Hovering a node: connected nodes lean toward it (1-3% displacement) and brighten slightly. Unconnected nodes desaturate 20%. One d3-force perturbation pulse, no ongoing cost.

### 5. Color temperature by time
Posts older than 6 months render with slightly desaturated nodes (saturation × 0.85). Older than 1 year × 0.7. Creates a visible "weathering" — readers can feel the archive aging without any UI chrome.

### 6. Private node teasers
Hidden posts render as tiny 3px dots in the graph with a lock icon on hover. Clicking them shows "🔒 private — ask me" and nothing else. Creates intrigue, doesn't hide the existence of private thoughts (which itself is honest).

### 7. Typewriter title on entry
On post entry transition, the post title types itself out over 200ms with a blinking cursor. Only the first time per session per post. Nostalgic, cheap.

### 8. Ambient ASCII watermark (category-specific)
A very faint (`opacity: 0.03`), slowly drifting ASCII pattern in the background of the post view. Different pattern per category:
- Tech: faint circuit/schematic glyphs
- Personal: rain or static
- Political: faint newspaper column rules and ornament dividers
- Media: film perforations along the edges
- Journal: graph paper grid

Rendered once as a tiling background CSS pattern, no animation cost beyond a slow CSS `transform: translateY()`.

### 9. "You are here" ripple
On entering a node, a single concentric ripple emanates from the center in the node's color. One CSS animation, then gone. ~400ms.

### 10. Tag constellations
Hovering a tag in post metadata: all other nodes with that tag pulse gently. Temporary "tag graph" overlay on the regular graph. Lets users explore by topic, not just by link.

## Per-post seeded variation ("siblings not clones")

Within a category, every post should feel like a member of a family but visually distinct. Achieved with seeded determinism: `seed = hash(slug)`, then all variations are chosen from banks using that seed. Same post → same visual every time. Different post → different visual.

Implementation lives in `src/lib/seed.ts` (mulberry32 PRNG) and per-category variation pickers in `src/lib/variations/<category>.ts` that consume the seed.

### Variation banks per category

**Tech** — header version tag (`v0.3.17` from hash), prompt char (`$ > # ~ ❯`), bullet glyph (`• ▸ ▪ ◦ › ▫`), scanline gap (1/2/3px), seeded circuit-trace SVG along one edge, corner watermark (`[CTRL+C]` / `[ESC]` / `[^Z]` / `[TAB]`) at seeded position.

**Personal** — wobbly rough.js underline on links (seeded roughness 0.5–1.5), ink-blot SVG in margin at seeded position + rotation, drop-cap font from a 3-font bank, marginalia rotation (2–8°), rough.js bullets.

**Political** — section-break ornament (`✦ ❦ § ¶ ❧ ❖ ✧`), column-rule style (solid / dotted / double), masthead "Issue №" (deterministic from date + slug), weathered stamp SVG in corner (seeded rotation 3–15°, opacity 0.08–0.15).

**Media** — filmic tint (warm / cool / neutral), letterbox ratio (2.39:1 / 2.35:1 / 1.85:1), film-reel countdown number (1–9), subtitle-style timestamp at top (`00:01:24` from hash).

**Journal** — paper-corner-fold (TL / TR / BL / BR), date-stamp style (3 variants), margin-note position, seeded coffee-ring blot SVG at low opacity and seeded position.

### Rules

- Variations are chosen at build time in the post layout and passed as `data-*` attrs / CSS custom props. Zero runtime cost per post load for CSS-driven variants.
- Every variation must be cheap: a glyph, a CSS property value, or an SVG with ≤10 path commands.
- New variations require adding to the bank plus a visual review of 5 random seeds to ensure all combinations look intentional.
- Variations must respect `prefers-reduced-motion` (drop any animated ones) and may be simplified or dropped on mobile.
- Start with 3–4 variants per category. Grow the banks over time as posts start feeling samey. Resist the urge to design 20 variants up front.
- Libraries: **rough.js** (<9kB gzipped, for personal/journal only — don't add to other categories), **simplex-noise** (~2kb, only if genuinely needed), **mulberry32** inlined (zero deps).

## Typography rules (project-wide)

- **NEVER use:** Inter, Roboto, Arial, generic system font stack, Space Grotesk
- **Display fonts:** at least one self-hosted woff2 in `/public/fonts/` per category
- **Font loading:** `font-display: swap` always. Preload the first-paint font for the category on each page.
- **Fluid type:** use `clamp()` so body and headings scale with viewport, no media-query breakpoints for size.
- **Line-height:** 1.55 for body prose (generous), 1.15 for display.

## Motion principles

- **Off the main thread or don't do it.** Prefer CSS animation + `transform` + `opacity`. Prefer native scroll-driven animations (`animation-timeline: scroll() | view()`) over JS scroll listeners. Use Motion library only for orchestrated sequences (the GTA-V and two-rivers transitions).
- **Respect `prefers-reduced-motion` at every animation.** Degrade to instant or crossfade.
- **Duration budget:** most UI micro-interactions ≤ 200ms. Narrative transitions (node entry, river merge) 600-900ms. Nothing beyond 1s without a reason.
- **Easing default:** `cubic-bezier(0.4, 0, 0.2, 1)`. For narrative transitions use custom `cubic-bezier(0.7, 0, 0.3, 1)` (anticipation + settle).

## Mobile degradation

- Graph → vertical scrolling list grouped by category, category theme applied per group header. Node shape becomes an inline 20px icon next to post title.
- ASCII animations → static middle frame, rendered once.
- GTA-V transition → slide transition (category theme swaps on navigation).
- Two-rivers transition → crossfade.

Mobile should still feel crafted, not like a fallback. Each category header on the list is a chance for bold typography.

## What success looks like

- A reader lands on the homepage and spends >30s just exploring the graph without clicking.
- A reader opens a post, gets pulled into three more via inline links, and ends up somewhere totally different than where they started.
- Someone screenshots it and posts it to Twitter/X without prompting, because it doesn't look like any other blog.
- The author enjoys writing for it enough that post cadence stays at least monthly.
