"""Matrix-ish rain streaks falling through the frame. Scroll advances time."""
from __future__ import annotations

import random
from _lib import blank, plot, write_frames

COLS = 70
ROWS = 18
FRAMES = 48
SEED = 13


def main() -> None:
    random.seed(SEED)
    chars = "01<>/\\|-=+*.:·"
    # one stream per column, each has phase and speed
    streams = []
    for x in range(COLS):
        streams.append(
            {
                "x": x,
                "phase": random.random(),
                "speed": 0.6 + random.random() * 1.4,
                "length": random.randint(3, 8),
                "active": random.random() < 0.55,
            }
        )

    frames: list[list[list[str]]] = []
    for fi in range(FRAMES):
        g = blank(ROWS, COLS)
        t = fi / FRAMES
        for s in streams:
            if not s["active"]:
                continue
            head = int((t * s["speed"] * (ROWS + s["length"]) + s["phase"] * ROWS) % (ROWS + s["length"])) - s["length"]
            for i in range(s["length"]):
                y = head + i
                if 0 <= y < ROWS:
                    # head char brighter/denser; tail fades
                    tail_rank = (s["length"] - 1 - i) / max(1, s["length"] - 1)
                    if tail_rank < 0.15:
                        ch = random.choice(chars[:4])
                    elif tail_rank < 0.5:
                        ch = random.choice(chars[4:10])
                    else:
                        ch = random.choice(chars[10:])
                    plot(g, s["x"], y, ch)
        frames.append(g)

    path = write_frames("rain", COLS, ROWS, frames)
    print(f"wrote {path} ({len(frames)} frames, {COLS}x{ROWS})")


if __name__ == "__main__":
    main()
