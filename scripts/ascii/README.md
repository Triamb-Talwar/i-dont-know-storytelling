# ASCII pipeline

Procedural ASCII-animation generators. Output is JSON frame data consumed by `<AsciiCanvas name="..." />` on the site.

## Run

```
cd scripts/ascii
python missile.py
python rain.py
python explosion.py
python glitch.py
```

On Windows (where `python` might be the MS Store stub), use the explicit interpreter:

```
C:\Users\user\.local\bin\python3.11.exe missile.py
```

Output lands in `public/ascii/<name>.json`.

## Frame format

```json
{
  "name": "missile",
  "cols": 80,
  "rows": 20,
  "frames": 60,
  "fg": "#e5e7eb",
  "data": ["..row0..\n..row1..\n...", "..."]
}
```

`data[i]` is the i-th frame as a newline-separated string — `rows` lines of exactly `cols` characters each. Spaces are significant.

## Scroll mapping

The reader's scroll progress over the `<AsciiCanvas>`'s viewport-relative position maps to a frame index. So frame 0 is "entering bottom of viewport", last frame is "leaving top." Authors never specify timing; the animation is bound to reading pace.

## Add a new animation

1. Copy `missile.py` or `rain.py` as a template.
2. Fill in `COLS`, `ROWS`, `FRAMES` (keep `ROWS ≤ 24`, `COLS ≤ 100`, `FRAMES ≤ 80`).
3. Use `_lib.plot(g, x, y, ch)` and `_lib.line(g, x0, y0, x1, y1, ch)`. Call `_lib.write_frames(name, cols, rows, frames)` at the end.
4. Run once. Commit `scripts/ascii/<name>.py` AND `public/ascii/<name>.json`.
