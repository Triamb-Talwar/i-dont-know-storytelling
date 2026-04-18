"""Standalone concentric ASCII explosion — grows outward then fades. Big and dramatic."""
from __future__ import annotations

import math
import random
from _lib import blank, plot, write_frames

COLS = 120
ROWS = 34
FRAMES = 50
SEED = 23


def main() -> None:
    random.seed(SEED)
    cx, cy = COLS // 2, ROWS // 2
    frames: list[list[list[str]]] = []
    ramp = ["█", "▓", "▒", "░", "#", "X", "x", "*", "+", ".", "·", " "]

    for fi in range(FRAMES):
        g = blank(ROWS, COLS)
        t = fi / (FRAMES - 1)
        radius = 1 + t * (min(COLS * 0.45, ROWS * 0.9))
        density = 1 - max(0, t - 0.3) / 0.7

        # core glow in early frames
        if t < 0.4:
            core_r = max(1, int(3 * (1 - t / 0.4)))
            for dy in range(-core_r, core_r + 1):
                for dx in range(-core_r * 2, core_r * 2 + 1):
                    if abs(dx) + abs(dy) * 2 <= core_r * 2:
                        plot(g, cx + dx, cy + dy, random.choice("█▓▓"))

        # multiple rings
        for r_off in range(-3, 5):
            rr = max(0.5, radius + r_off * 1.5)
            steps = max(24, int(2 * math.pi * rr * 1.5))
            for s in range(steps):
                a = (s / steps) * 2 * math.pi + fi * 0.04 + r_off * 0.12
                px = cx + math.cos(a) * rr * 2.0
                py = cy + math.sin(a) * rr * 0.75
                if random.random() > density:
                    continue
                ix, iy = int(round(px)), int(round(py))
                rank = min(len(ramp) - 1, int(t * (len(ramp) - 1)) + max(0, r_off + 2) // 2)
                plot(g, ix, iy, ramp[rank])

        # sparks
        for _ in range(int(50 * density)):
            a = random.random() * 2 * math.pi
            rr = radius * (0.4 + random.random() * 0.7)
            ix = cx + int(round(math.cos(a) * rr * 2.0))
            iy = cy + int(round(math.sin(a) * rr * 0.75))
            plot(g, ix, iy, random.choice("*+x#!@"))

        # shockwave leading edge
        if fi < FRAMES * 0.65:
            sw_r = radius * 1.25
            sw_steps = max(30, int(2 * math.pi * sw_r * 1.5))
            for s in range(sw_steps):
                a = (s / sw_steps) * 2 * math.pi
                ix = cx + int(round(math.cos(a) * sw_r * 2.0))
                iy = cy + int(round(math.sin(a) * sw_r * 0.75))
                if random.random() < 0.5:
                    plot(g, ix, iy, random.choice("·."))

        frames.append(g)

    path = write_frames("explosion", COLS, ROWS, frames)
    print(f"wrote {path} ({len(frames)} frames, {COLS}x{ROWS})")


if __name__ == "__main__":
    main()
