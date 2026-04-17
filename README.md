# i don't know storytelling but i have stories to tell

A personal blog rendered as an interconnected graph. Each post is a node. Inline links are edges. Categories have distinct aesthetics. ASCII animations live inline.

Not a blog template. Not meant to be reused. But the architecture is open to read.

## Quick start

```bash
pnpm install
pnpm dev
```

Server runs on `http://localhost:4321`.

## Writing a post

Create a file in `src/content/posts/<slug>.mdx`:

```mdx
---
title: "Title"
slug: "kebab-case-slug"
category: tech        # tech | personal | political | media | journal
visibility: public    # public | private
created: 2026-04-18
tags: [agents, sql]
links:
  - slug: "mimir-architecture"
    reason: "same agentic pattern"
---

Your content here. You can use MDX, including:

<AsciiCanvas name="missile" align="left" />

And regular markdown.
```

Rebuild. New node appears on the graph, connected to `mimir-architecture`.

## Docs

- `CLAUDE.md` — context for Claude Code
- `DESIGN.md` — visual/interaction vision
- `ARCHITECTURE.md` — how it's built
- `TASKS.md` — phased task list
- `FOLDER_STRUCTURE.md` — directory layout
- `SKILLS.md` — Claude Code skills setup

## License

MIT for code. Content (posts, ASCII art) © the author, all rights reserved.
