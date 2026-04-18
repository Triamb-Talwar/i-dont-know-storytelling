"""Convert an image file to a single-frame ASCII JSON for <AsciiCanvas>.

Usage:
  python image_to_ascii.py <image_path> <name> [--cols 80] [--invert]

Requires Pillow:
  pip install Pillow
"""
from __future__ import annotations

import argparse
import sys

try:
    from PIL import Image
except ImportError:
    print("Pillow is required: pip install Pillow", file=sys.stderr)
    sys.exit(1)

from _lib import blank, plot, write_frames

CHAR_RAMP = " .:-=+*#%@█"
CHAR_RAMP_INV = CHAR_RAMP[::-1]


def image_to_grid(path: str, cols: int, invert: bool) -> list[list[str]]:
    img = Image.open(path).convert("L")
    w, h = img.size
    aspect = h / w
    rows = int(cols * aspect * 0.45)
    img = img.resize((cols, rows), Image.Resampling.LANCZOS)

    ramp = CHAR_RAMP_INV if invert else CHAR_RAMP
    ramp_len = len(ramp)

    g = blank(rows, cols)
    for y in range(rows):
        for x in range(cols):
            px = img.getpixel((x, y))
            idx = int((px / 255) * (ramp_len - 1))
            g[y][x] = ramp[idx]
    return g


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert image to ASCII JSON")
    parser.add_argument("image", help="Path to image file")
    parser.add_argument("name", help="Output name (without .json)")
    parser.add_argument("--cols", type=int, default=80, help="Output width in chars (default 80)")
    parser.add_argument("--invert", action="store_true", help="Invert brightness (for dark backgrounds)")
    args = parser.parse_args()

    grid = image_to_grid(args.image, args.cols, args.invert)
    rows = len(grid)
    path = write_frames(args.name, args.cols, rows, [grid], fg="#e5e7eb")
    print(f"wrote {path} ({args.cols}x{rows}, 1 frame)")


if __name__ == "__main__":
    main()
