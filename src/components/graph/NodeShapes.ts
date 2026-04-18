import type { NodeShape } from '@lib/categories';

export function drawNodeShape(
  ctx: CanvasRenderingContext2D,
  shape: NodeShape,
  x: number,
  y: number,
  r: number,
): void {
  ctx.beginPath();
  switch (shape) {
    case 'hexagon':
      hexagon(ctx, x, y, r);
      break;
    case 'diamond':
      diamond(ctx, x, y, r);
      break;
    case 'notched-square':
      notchedSquare(ctx, x, y, r);
      break;
    case 'blob':
      blob(ctx, x, y, r);
      break;
    case 'circle':
    default:
      ctx.arc(x, y, r, 0, Math.PI * 2);
      break;
  }
  ctx.closePath();
}

function hexagon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const px = x + r * Math.cos(a);
    const py = y + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const h = r * 1.25;
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - r, y);
}

function notchedSquare(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  // rounded square with top-right corner notched (screen reference)
  const s = r * 0.95;
  const notch = s * 0.35;
  const radius = s * 0.18;

  ctx.moveTo(x - s + radius, y - s);
  ctx.lineTo(x + s - notch, y - s);
  ctx.lineTo(x + s, y - s + notch);
  ctx.lineTo(x + s, y + s - radius);
  ctx.quadraticCurveTo(x + s, y + s, x + s - radius, y + s);
  ctx.lineTo(x - s + radius, y + s);
  ctx.quadraticCurveTo(x - s, y + s, x - s, y + s - radius);
  ctx.lineTo(x - s, y - s + radius);
  ctx.quadraticCurveTo(x - s, y - s, x - s + radius, y - s);
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  // hand-drawn irregular blob using 8 points with jitter seeded on position
  const pts = 8;
  const seed = (Math.abs(Math.floor(x * 13 + y * 7)) % 1000) / 1000;
  for (let i = 0; i < pts; i++) {
    const a = ((Math.PI * 2) / pts) * i;
    // deterministic jitter so the blob doesn't wobble between frames
    const jitter = 0.82 + ((Math.sin(i * 2.3 + seed * 10) + 1) / 2) * 0.35;
    const rr = r * jitter;
    const px = x + rr * Math.cos(a);
    const py = y + rr * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else {
      const a2 = ((Math.PI * 2) / pts) * (i - 0.5);
      const cpx = x + r * 1.15 * Math.cos(a2);
      const cpy = y + r * 1.15 * Math.sin(a2);
      ctx.quadraticCurveTo(cpx, cpy, px, py);
    }
  }
  ctx.closePath();
}
