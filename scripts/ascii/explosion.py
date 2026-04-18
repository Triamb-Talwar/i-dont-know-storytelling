"""Standalone concentric ASCII explosion — grows outward then fades."""
from __future__ import annotations

import math
import random
from _lib import blank, plot, write_frames

COLS = 60
ROWS = 20
FRAMES = 40
SEED = 23


def main() -> None:
    random.seed(SEED)
    cx, cy = COLS // 2, ROWS // 2
    frames: list[list[list[str]]] = []
    ramp = ["·", ".", ":", "*", "+", "x", "X", "#", "*", ".", " "]

    for fi in range(FRAMES):
        g = blank(ROWS, COLS)
        t = fi / (FRAMES - 1)
        radius = 1 + t * (COLS * 0.45)
        density = 1 - max(0, t - 0.35) / 0.65  # fade out in second half

        # multiple rings
        for r_off in range(-2, 3):
            rr = max(0.5, radius + r_off * 0.8)
            steps = max(16, int(2 * math.pi * rr))
            for s in range(steps):
                a = (s / steps) * 2 * math.pi + fi * 0.03
                px = cx + math.cos(a) * rr * 1.5
                py = cy + math.sin(a) * rr * 0.75
                if random.random() > density:
                    continue
                ix, iy = int(round(px)), int(round(py))
                rank = min(len(ramp) - 1, int(t * (len(ramp) - 1)) + (r_off + 2) // 2)
                plot(g, ix, iy, ramp[rank])

        # some random sparks near the front
        for _ in range(int(20 * density)):
            a = random.random() * 2 * math.pi
            rr = radius * (0.85 + random.random() * 0.3)
            ix = cx + int(round(math.cos(a) * rr * 1.5))
            iy = cy + int(round(math.sin(a) * rr * 0.75))
            plot(g, ix, iy, random.choice("*+x."))
        frames.append(g)

    path = write_frames("explosion", COLS, ROWS, frames)
    print(f"wrote {path} ({len(frames)} frames, {COLS}x{ROWS})")


if __name__ == "__main__":
    main()
