"""Missile glides left -> right leaving a heavy smoke trail, arcs downward, impacts, BIG explosion."""
from __future__ import annotations

import math
import random
from _lib import blank, plot, write_frames

COLS = 140
ROWS = 38
FRAMES = 72
SEED = 7


def main() -> None:
    random.seed(SEED)
    frames: list[list[list[str]]] = []

    start_x, start_y = 4, 28
    impact_x, impact_y = COLS - 12, 30
    apex_y = 5
    flight_frames = int(FRAMES * 0.6)
    explosion_frames = FRAMES - flight_frames

    trail: list[tuple[int, int, int]] = []
    smoke: list[tuple[int, int, int, str]] = []

    for fi in range(flight_frames):
        g = blank(ROWS, COLS)
        t = fi / max(1, flight_frames - 1)
        x = start_x + (impact_x - start_x) * t
        y = (1 - t) * (1 - t) * start_y + 2 * (1 - t) * t * apex_y + t * t * impact_y
        ix, iy = int(round(x)), int(round(y))

        # age trail + smoke
        trail = [(tx, ty, ta + 1) for (tx, ty, ta) in trail if ta + 1 < 30]
        trail.append((ix, iy, 0))

        # add smoke particles drifting upward from trail
        if fi > 2 and fi % 2 == 0:
            for sx_off in range(-1, 2):
                smoke.append((ix - 3 + sx_off, iy + random.randint(-1, 1), 0, random.choice("░▒▓")))

        smoke = [(sx, sy - (1 if sa % 4 == 0 else 0), sa + 1, sc) for sx, sy, sa, sc in smoke if sa + 1 < 20]

        for sx, sy, sa, sc in smoke:
            alpha_ch = "░" if sa > 12 else ("▒" if sa > 6 else sc)
            plot(g, sx, sy, alpha_ch)

        for tx, ty, ta in trail:
            if ta == 0:
                continue
            if ta < 4:
                ch = "█"
            elif ta < 8:
                ch = "▓"
            elif ta < 14:
                ch = "▒"
            elif ta < 20:
                ch = "░"
            else:
                ch = "·"
            plot(g, tx, ty, ch)

        # missile body — big, chunky
        missile_art = [
            "  ╱▔▔╲",
            "━━╋══►",
            "  ╲▁▁╱",
        ]
        for dy, row_str in enumerate(missile_art):
            chars_list = list(row_str)
            for dx, ch in enumerate(chars_list):
                if ch != " ":
                    plot(g, ix - 4 + dx, iy - 1 + dy, ch)

        # flame exhaust
        flame_chars = "~≈≋∽" if fi % 2 == 0 else "≈~∽≋"
        for fx in range(1, 5 + random.randint(0, 3)):
            plot(g, ix - 4 - fx, iy, random.choice(flame_chars))
            if random.random() > 0.5:
                plot(g, ix - 4 - fx, iy - 1, random.choice("·."))
            if random.random() > 0.5:
                plot(g, ix - 4 - fx, iy + 1, random.choice("·."))

        # ground line — rough terrain
        for gx in range(COLS):
            terrain_ch = "▄" if (gx + fi) % 7 < 2 else ("▂" if gx % 11 < 3 else "▁")
            plot(g, gx, ROWS - 1, terrain_ch)
            if gx % 13 == 0:
                plot(g, gx, ROWS - 2, "▖")

        frames.append(g)

    # EXPLOSION — expanding concentric blast, debris, shockwave
    blast_chars = ["█", "▓", "▒", "░", "#", "X", "x", "*", "+", ".", "·", " "]

    for fi in range(explosion_frames):
        g = blank(ROWS, COLS)
        t = fi / max(1, explosion_frames - 1)

        # fading smoke from trail
        smoke = [(sx, sy - (1 if sa % 3 == 0 else 0), sa + 1, sc) for sx, sy, sa, sc in smoke if sa + 1 < 30]
        for sx, sy, sa, sc in smoke:
            if sa < 20:
                plot(g, sx, sy, "░" if sa > 14 else "▒")

        radius = 2 + t * (min(COLS, ROWS) * 0.55)
        density = max(0.15, 1 - max(0, t - 0.25) / 0.75)

        # multiple concentric rings
        for r_off in range(-3, 5):
            rr = max(1, radius + r_off * 1.2)
            steps = max(24, int(2 * math.pi * rr * 1.5))
            for s in range(steps):
                a = (s / steps) * 2 * math.pi + fi * 0.05 + r_off * 0.1
                px = impact_x + math.cos(a) * rr * 1.8
                py = impact_y + math.sin(a) * rr * 0.7
                if random.random() > density:
                    continue
                ix_e, iy_e = int(round(px)), int(round(py))
                rank = min(len(blast_chars) - 1, int(t * (len(blast_chars) - 1)) + max(0, r_off + 2) // 2)
                plot(g, ix_e, iy_e, blast_chars[rank])

        # flying debris
        for _ in range(int(40 * density)):
            a = random.random() * 2 * math.pi
            rr = radius * (0.3 + random.random() * 0.8)
            deb_x = impact_x + int(round(math.cos(a) * rr * 1.8))
            deb_y = impact_y + int(round(math.sin(a) * rr * 0.7))
            plot(g, deb_x, deb_y, random.choice("*+x#%@!"))

        # shockwave ring (outer edge only)
        if fi < explosion_frames * 0.6:
            sw_r = radius * 1.3
            sw_steps = max(30, int(2 * math.pi * sw_r * 1.5))
            for s in range(sw_steps):
                a = (s / sw_steps) * 2 * math.pi
                sw_x = impact_x + int(round(math.cos(a) * sw_r * 1.8))
                sw_y = impact_y + int(round(math.sin(a) * sw_r * 0.7))
                if random.random() < 0.6:
                    plot(g, sw_x, sw_y, random.choice("·."))

        # ground — broken up by impact
        for gx in range(COLS):
            dist_from_impact = abs(gx - impact_x)
            if dist_from_impact < radius * 1.5 and fi < explosion_frames * 0.7:
                if random.random() < 0.3:
                    plot(g, gx, ROWS - 1, random.choice("▁▂▃"))
            else:
                plot(g, gx, ROWS - 1, "▁")

        frames.append(g)

    path = write_frames("missile", COLS, ROWS, frames)
    print(f"wrote {path} ({len(frames)} frames, {COLS}x{ROWS})")


if __name__ == "__main__":
    main()
