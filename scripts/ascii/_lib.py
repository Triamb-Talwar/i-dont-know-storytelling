"""Shared helpers for ASCII frame generators.

Frame format (public/ascii/<name>.json):
{
  "name": "missile",
  "cols": 60,
  "rows": 18,
  "frames": 40,
  "fg": "#e5e7eb",
  "data": ["..row0..\\n..row1..\\n...", ...]   # len == frames, each string is rows lines of cols chars
}

Readers advance through `data` based on scroll progress (0 -> first frame, 1 -> last).
"""
from __future__ import annotations

import json
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parents[2] / "public" / "ascii"


def blank(rows: int, cols: int, fill: str = " ") -> list[list[str]]:
    return [[fill] * cols for _ in range(rows)]


def grid_to_str(g: list[list[str]]) -> str:
    return "\n".join("".join(row) for row in g)


def write_frames(name: str, cols: int, rows: int, frames: list[list[list[str]]], fg: str = "#e5e7eb") -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "name": name,
        "cols": cols,
        "rows": rows,
        "frames": len(frames),
        "fg": fg,
        "data": [grid_to_str(f) for f in frames],
    }
    path = OUT_DIR / f"{name}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return path


def plot(g: list[list[str]], x: int, y: int, ch: str) -> None:
    if 0 <= y < len(g) and 0 <= x < len(g[0]):
        g[y][x] = ch


def line(g: list[list[str]], x0: int, y0: int, x1: int, y1: int, ch: str) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0
    while True:
        plot(g, x, y, ch)
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy
