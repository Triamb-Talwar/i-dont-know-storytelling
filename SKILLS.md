# SKILLS.md

> Claude Code skills to install for this project. Install before starting Phase 1.

## What a skill is

A Claude Code skill is a SKILL.md file that gives the agent specialized instructions, context, and workflows for a specific task. Skills are invoked with a slash command (e.g. `/frontend-design`) or trigger automatically based on the task. The same SKILL.md format works across Claude Code, Cursor, Gemini CLI, and other compatible agents.

## Required: `frontend-design`

**Why this project needs it:** Without a skill like this, Claude Code tends to converge on generic output — Inter fonts, purple gradients, card grids. That's the *opposite* of what this project needs. Anthropic calls this "distributional convergence" — during sampling, models predict tokens based on statistical patterns in training data, and safe design choices that work universally and offend no one dominate web training data. Without direction, Claude samples from this high-probability center.

The frontend-design skill explicitly instructs Claude to pick a bold aesthetic direction and execute it with intentionality — which is exactly what we need for the five distinct category themes.

**Install:**
```bash
# From inside Claude Code (recommended)
/plugin install frontend-design@anthropic-agent-skills

# Or manually
git clone https://github.com/anthropics/skills.git /tmp/anthropic-skills
cp -r /tmp/anthropic-skills/skills/frontend-design .claude/skills/
```

**When it activates:** automatically when asked to build any UI component, page, or layout. Also explicitly invokable with `/frontend-design`.

## Recommended: `skill-creator`

**Why:** Over time we'll want our own ASCII-pipeline skill (deterministic procedural art generation patterns) and potentially a "category-theme" skill that encodes our per-category rules. `skill-creator` is Anthropic's meta-skill for authoring new skills.

**Install:**
```bash
/plugin install skill-creator@anthropic-agent-skills
```

## Optional: `web-design-guidelines` (Vercel)

**Why:** Good secondary reinforcement for accessibility and web best practices. Overlaps some with frontend-design but covers more of the engineering side (semantic HTML, Core Web Vitals awareness).

**Install:**
```bash
git clone https://github.com/vercel-labs/agent-skills.git /tmp/vercel-skills
cp -r /tmp/vercel-skills/skills/web-design-guidelines .claude/skills/
```

## Verify installation

```bash
ls -la .claude/skills/
# should show: frontend-design/, (skill-creator/), (web-design-guidelines/)

cat .claude/skills/frontend-design/SKILL.md | head -20
# sanity check: should show frontmatter with name and description
```

## Future skills to author for this project

Once Phase 1 ships, consider writing:

1. **`ascii-pipeline`** — rules for the Python ASCII generators: naming, output format, color map conventions, edge cases (transparent pixels, long animations).
2. **`category-theme`** — encoded rules for what makes each category visually distinct. Could be extracted from `DESIGN.md`.
3. **`post-scaffold`** — spins up a new MDX post with proper frontmatter, links-to-prompt, ASCII slot. Author invokes with `/post-scaffold "title" category`.

Use `skill-creator` to author these. Don't write them from scratch until you feel a repeated pain point — skills are most valuable when capturing patterns you've already found yourself explaining more than twice.
