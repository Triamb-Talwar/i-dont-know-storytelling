"""Missile glides left -> right leaving a dotted trail, arcs downward, impacts, explodes."""
from __future__ import annotations

import math
import random
from _lib import blank, plot, write_frames

COLS = 80
ROWS = 20
FRAMES = 60
SEED = 7


def main() -> None:
    random.seed(SEED)
    frames: list[list[list[str]]] = []

    # flight path: parabolic arc from (2, 14) to (COLS-4, 16)
    start_x, start_y = 2, 14
    impact_x, impact_y = COLS - 6, 16
    apex_y = 3
    flight_frames = int(FRAMES * 0.7)
    impact_frame = flight_frames
    explosion_frames = FRAMES - flight_frames

    trail: list[tuple[int, int, int]] = []  # (x, y, age)

    for fi in range(flight_frames):
        g = blank(ROWS, COLS)
        t = fi / max(1, flight_frames - 1)
        # quadratic bezier-ish: ease arc, apex at midpoint
        x = start_x + (impact_x - start_x) * t
        y = (1 - t) * (1 - t) * start_y + 2 * (1 - t) * t * apex_y + t * t * impact_y
        ix, iy = int(round(x)), int(round(y))

        # age trail
        trail = [(tx, ty, ta + 1) for (tx, ty, ta) in trail if ta + 1 < 18]
        trail.append((ix, iy, 0))

        for (tx, ty, ta) in trail:
            if ta == 0:
                continue
            ch = "." if ta > 10 else ("·" if ta > 5 else "∙")
            plot(g, tx, ty, ch)

        # missile body: > with a small flame tail
        plot(g, ix, iy, ">")
        plot(g, ix - 1, iy, "=")
        plot(g, ix - 2, iy, "-")
        if fi % 2 == 0:
            plot(g, ix - 3, iy, "~")

        # ground line
        for gx in range(COLS):
            plot(g, gx, ROWS - 1, "_")

        frames.append(g)

    # explosion: expanding concentric burst
    chars = ["*", "+", "x", "o", ".", " "]
    for fi in range(explosion_frames):
        g = blank(ROWS, COLS)
        # keep fading trail ghost
        trail = [(tx, ty, ta + 1) for (tx, ty, ta) in trail if ta + 1 < 24]
        for (tx, ty, ta) in trail:
            if ta < 12:
                plot(g, tx, ty, "." if ta < 6 else " ")

        radius = fi + 1
        density = max(0.25, 1 - fi / explosion_frames)
        for ring_r in range(radius):
            steps = max(8, int(2 * math.pi * ring_r))
            for s in range(steps):
                a = (s / steps) * 2 * math.pi
                ex = impact_x + int(round(math.cos(a) * ring_r * 1.6))
                ey = impact_y + int(round(math.sin(a) * ring_r * 0.8))
                if random.random() < density:
                    idx = min(len(chars) - 1, fi // 2 + (ring_r == radius - 1))
                    plot(g, ex, ey, chars[idx])

        # ground
        for gx in range(COLS):
            plot(g, gx, ROWS - 1, "_")

        frames.append(g)

    path = write_frames("missile", COLS, ROWS, frames)
    print(f"wrote {path} ({len(frames)} frames, {COLS}x{ROWS})")


if __name__ == "__main__":
    main()
