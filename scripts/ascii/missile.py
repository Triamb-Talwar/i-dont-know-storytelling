"""Missile drops vertically, accelerating under gravity, then detonates on impact."""
from __future__ import annotations

import math
import random
from _lib import blank, plot, write_frames

COLS = 60
ROWS = 44
FRAMES = 70
SEED = 7


def main() -> None:
    random.seed(SEED)
    frames: list[list[list[str]]] = []

    cx = COLS // 2
    ground_y = ROWS - 2
    drop_start = 2
    flight_frames = int(FRAMES * 0.55)
    explosion_frames = FRAMES - flight_frames

    trail: list[tuple[int, int, int]] = []
    smoke: list[tuple[int, int, int]] = []

    for fi in range(flight_frames):
        g = blank(ROWS, COLS)
        # eased drop (gravity: quadratic ease-in)
        t = fi / max(1, flight_frames - 1)
        t_eased = t * t  # accelerating
        my = drop_start + (ground_y - 4 - drop_start) * t_eased
        mx = cx + int(math.sin(t * 3) * 2)  # slight wobble
        iy = int(round(my))
        ix = int(round(mx))

        # trail
        trail = [(tx, ty, ta + 1) for tx, ty, ta in trail if ta + 1 < 22]
        trail.append((ix, iy, 0))

        # smoke puffs drift outward
        if fi > 3 and fi % 2 == 0:
            for dx in range(-1, 2):
                smoke.append((ix + dx + random.randint(-1, 1), iy - 2, 0))
        smoke = [(sx, sy - (1 if random.random() < 0.3 else 0), sa + 1)
                 for sx, sy, sa in smoke if sa < 16]

        # draw smoke
        for sx, sy, sa in smoke:
            ch = "░" if sa > 10 else ("▒" if sa > 5 else "▓")
            plot(g, sx + random.randint(-1, 0), sy, ch)

        # draw trail
        for tx, ty, ta in trail:
            if ta == 0:
                continue
            if ta < 3:
                ch = "║"
            elif ta < 6:
                ch = "│"
            elif ta < 12:
                ch = "¦"
            else:
                ch = "·"
            plot(g, tx, ty, ch)

        # missile body — pointing down
        missile = [
            "  ╱╲  ",
            " ╱  ╲ ",
            " │▓▓│ ",
            " │▓▓│ ",
            " │██│ ",
            "╱╲██╱╲",
            "╲╱╲╱╲╱",
        ]
        for dy, row_str in enumerate(missile):
            for dx, ch in enumerate(row_str):
                if ch != " ":
                    plot(g, ix - 3 + dx, iy + dy, ch)

        # flame exhaust shooting upward
        flame_w = 2 + (fi % 3)
        for fy in range(1, 4 + random.randint(0, 3)):
            for fdx in range(-flame_w, flame_w + 1):
                if random.random() < 0.5:
                    fch = random.choice("~≈≋∽^")
                    plot(g, ix + fdx, iy - fy, fch)

        # ground
        for gx in range(COLS):
            plot(g, gx, ground_y, "▔" if gx % 9 < 2 else "▁")
            plot(g, gx, ground_y + 1, "▓" if (gx + 3) % 7 < 2 else "░")

        frames.append(g)

    # EXPLOSION
    blast = ["█", "▓", "▒", "░", "#", "X", "x", "*", "+", ".", "·", " "]

    for fi in range(explosion_frames):
        g = blank(ROWS, COLS)
        t = fi / max(1, explosion_frames - 1)

        radius = 2 + t * (ROWS * 0.5)
        density = max(0.12, 1 - max(0, t - 0.2) / 0.8)

        # rings
        for r_off in range(-3, 5):
            rr = max(1, radius + r_off * 1.0)
            steps = max(20, int(2 * math.pi * rr * 1.3))
            for s in range(steps):
                a = (s / steps) * 2 * math.pi + fi * 0.06
                px = cx + math.cos(a) * rr * 1.1
                py = ground_y - 2 + math.sin(a) * rr * 0.85
                if random.random() > density:
                    continue
                rank = min(len(blast) - 1, int(t * (len(blast) - 1)) + max(0, r_off + 2) // 2)
                plot(g, int(round(px)), int(round(py)), blast[rank])

        # debris flying upward
        for _ in range(int(30 * density)):
            a = random.random() * 2 * math.pi
            rr = radius * (0.2 + random.random() * 0.9)
            dx = cx + int(round(math.cos(a) * rr * 1.1))
            dy = ground_y - 2 + int(round(math.sin(a) * rr * 0.85))
            plot(g, dx, dy, random.choice("*+x#@!%"))

        # shockwave
        if fi < explosion_frames * 0.5:
            sw_r = radius * 1.2
            sw_steps = max(20, int(2 * math.pi * sw_r))
            for s in range(sw_steps):
                a = (s / sw_steps) * 2 * math.pi
                sw_x = cx + int(round(math.cos(a) * sw_r * 1.1))
                sw_y = ground_y - 2 + int(round(math.sin(a) * sw_r * 0.85))
                if random.random() < 0.5:
                    plot(g, sw_x, sw_y, "·")

        # ground — cratered
        for gx in range(COLS):
            d = abs(gx - cx)
            if d < radius * 0.8 and t < 0.7:
                if random.random() < 0.25:
                    plot(g, gx, ground_y, random.choice("▁░"))
            else:
                plot(g, gx, ground_y, "▁")
                plot(g, gx, ground_y + 1, "░")

        frames.append(g)

    path = write_frames("missile", COLS, ROWS, frames)
    print(f"wrote {path} ({len(frames)} frames, {COLS}x{ROWS})")


if __name__ == "__main__":
    main()
