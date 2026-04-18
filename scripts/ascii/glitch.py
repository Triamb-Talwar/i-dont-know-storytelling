"""Glitch waves — character corruption sweeping across a block of text."""
from __future__ import annotations

import random
from _lib import blank, plot, write_frames

COLS = 72
ROWS = 14
FRAMES = 50
SEED = 41

BASE_TEXT = [
    "the signal degrades every time you tell the story again",
    "not forgotten. just moved to a different shelf.",
    "i keep mistaking memory for the thing itself.",
    "every recursion loses a little color.",
    "i try to be honest. the edit is the honesty.",
    "---- END OF TRANSMISSION ----",
]


def main() -> None:
    random.seed(SEED)
    glitch_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~█▓▒░"
    frames: list[list[list[str]]] = []

    # layout base text centered vertically
    def place_base(g: list[list[str]]) -> None:
        start_y = (ROWS - len(BASE_TEXT)) // 2
        for i, line in enumerate(BASE_TEXT):
            y = start_y + i
            x0 = max(0, (COLS - len(line)) // 2)
            for j, ch in enumerate(line):
                plot(g, x0 + j, y, ch)

    for fi in range(FRAMES):
        g = blank(ROWS, COLS)
        place_base(g)
        t = fi / FRAMES
        # sweeping band
        band_y = int(t * (ROWS + 4)) - 2
        for dy in range(-1, 2):
            y = band_y + dy
            if 0 <= y < ROWS:
                for x in range(COLS):
                    if random.random() < 0.55:
                        g[y][x] = random.choice(glitch_chars)
        # scattered pixel noise
        for _ in range(int(20 + fi * 0.5)):
            rx = random.randint(0, COLS - 1)
            ry = random.randint(0, ROWS - 1)
            if random.random() < 0.4:
                g[ry][rx] = random.choice(glitch_chars)
        # horizontal tearing lines occasionally
        if fi % 7 == 0:
            ty = random.randint(0, ROWS - 1)
            for x in range(COLS):
                g[ty][x] = random.choice("─=-_")
        frames.append(g)

    path = write_frames("glitch", COLS, ROWS, frames)
    print(f"wrote {path} ({len(frames)} frames, {COLS}x{ROWS})")


if __name__ == "__main__":
    main()
