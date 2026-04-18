"""Glitch waves — character corruption sweeping across a block of text. Big, dramatic."""
from __future__ import annotations

import random
from _lib import blank, plot, write_frames

COLS = 110
ROWS = 26
FRAMES = 55
SEED = 41

BASE_TEXT = [
    "",
    "   the signal degrades every time you tell the story again",
    "",
    "   not forgotten. just moved to a different shelf.",
    "",
    "   i keep mistaking memory for the thing itself.",
    "",
    "   every recursion loses a little color.",
    "",
    "   i try to be honest. the edit is the honesty.",
    "",
    "   but the edit is also the lie.",
    "",
    "   i wonder if the first version of anything is the truest one.",
    "   or if honesty is just the last thing you were willing to say.",
    "",
    "   ---- END OF TRANSMISSION ----",
]


def main() -> None:
    random.seed(SEED)
    glitch_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~█▓▒░▀▄▌▐"
    frames: list[list[list[str]]] = []

    def place_base(g: list[list[str]]) -> None:
        start_y = (ROWS - len(BASE_TEXT)) // 2
        for i, ln in enumerate(BASE_TEXT):
            y = start_y + i
            x0 = max(0, (COLS - len(ln)) // 2)
            for j, ch in enumerate(ln):
                plot(g, x0 + j, y, ch)

    for fi in range(FRAMES):
        g = blank(ROWS, COLS)
        place_base(g)
        t = fi / FRAMES

        # wider sweeping band (3-5 rows)
        band_y = int(t * (ROWS + 8)) - 4
        for dy in range(-2, 3):
            y = band_y + dy
            if 0 <= y < ROWS:
                intensity = 0.7 - abs(dy) * 0.15
                for x in range(COLS):
                    if random.random() < intensity:
                        g[y][x] = random.choice(glitch_chars)

        # scattered pixel noise — more of it
        for _ in range(int(40 + fi * 0.8)):
            rx = random.randint(0, COLS - 1)
            ry = random.randint(0, ROWS - 1)
            if random.random() < 0.45:
                g[ry][rx] = random.choice(glitch_chars)

        # block corruption — random rectangular patches
        if fi % 5 == 0:
            bx = random.randint(0, COLS - 12)
            by = random.randint(0, ROWS - 3)
            bw = random.randint(6, 14)
            bh = random.randint(2, 4)
            for dy in range(bh):
                for dx in range(bw):
                    if random.random() < 0.6:
                        plot(g, bx + dx, by + dy, random.choice("█▓▒░"))

        # horizontal tearing lines
        if fi % 6 == 0:
            ty = random.randint(0, ROWS - 1)
            shift = random.randint(2, 8) * random.choice([-1, 1])
            for x in range(COLS):
                src_x = x - shift
                if 0 <= src_x < COLS:
                    g[ty][x] = g[ty][src_x] if g[ty][src_x] != " " else random.choice("─=-_")
                else:
                    g[ty][x] = random.choice("─=-_")

        frames.append(g)

    path = write_frames("glitch", COLS, ROWS, frames)
    print(f"wrote {path} ({len(frames)} frames, {COLS}x{ROWS})")


if __name__ == "__main__":
    main()
