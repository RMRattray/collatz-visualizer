import type { AxisOption, Journey, NumberMetrics } from "./types.js";
import { axisValue } from "./collatz.js";

export type PlotState = {
  xAxis: AxisOption;
  yAxis: AxisOption;
  journeys: Journey[];
};

type PointPx = { x: number; y: number; mod3: 0 | 1 | 2 };

// Dot radius & margin; grid density is dynamic.
const DOT_RADIUS = 1.5;
const PAD = 28;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function colorForJourney(i: number): string {
  const hue = (i * 67) % 360;
  return `hsl(${hue} 85% 65% / 0.95)`;
}

function computeRanges(journeys: Journey[], xAxis: AxisOption, yAxis: AxisOption): {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
} {
  let xMin = 1;
  let xMax = 1;
  let yMin = 1;
  let yMax = 1;

  for (const j of journeys) {
    for (const m of j.metrics) {
      const x = axisValue(m, xAxis);
      const y = axisValue(m, yAxis);
      if (x > xMax) xMax = x;
      if (y > yMax) yMax = y;
    }
  }

  return { xMin, xMax, yMin, yMax };
}

function gridStepsForRanges(ranges: { xMin: number; xMax: number; yMin: number; yMax: number }): number {
  // xMin and yMin are always 1, and maxima are ≥ 1.
  // Start with 11 "steps" => 12 dots in each direction.
  const maxAxis = Math.max(ranges.xMax, ranges.yMax, 1);
  const stepsFromData = Math.max(0, Math.ceil(maxAxis) - 1);
  return Math.max(11, stepsFromData);
}

function pointForMetrics(
  m: NumberMetrics,
  size: number,
  xAxis: AxisOption,
  yAxis: AxisOption,
  ranges: { xMin: number; xMax: number; yMin: number; yMax: number },
  gridSteps: number
): PointPx {
  const step = (size - PAD * 2) / gridSteps;

  const xv = axisValue(m, xAxis);
  const yv = axisValue(m, yAxis);

  const dx = ranges.xMax - ranges.xMin;
  const dy = ranges.yMax - ranges.yMin;
  const nx = dx === 0 ? 0 : (xv - ranges.xMin) / dx;
  const ny = dy === 0 ? 0 : (yv - ranges.yMin) / dy;

  const xi = Math.round(clamp01(nx) * gridSteps);
  const yi = Math.round(clamp01(ny) * gridSteps);

  const x = PAD + xi * step;
  const y = size - PAD - yi * step; // invert so larger y is "up"
  return { x, y, mod3: m.mod3 };
}

function drawDotGrid(ctx: CanvasRenderingContext2D, size: number, gridSteps: number): void {
  ctx.clearRect(0, 0, size, size);

  // background
  ctx.fillStyle = "#070a10";
  ctx.fillRect(0, 0, size, size);

  const step = (size - PAD * 2) / gridSteps;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let yi = 0; yi <= gridSteps; yi++) {
    for (let xi = 0; xi <= gridSteps; xi++) {
      const x = PAD + xi * step;
      const y = PAD + yi * step;
      ctx.beginPath();
      ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, a: PointPx, b: PointPx): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) return;

  const ux = dx / len;
  const uy = dy / len;

  const headLen = 10;
  const headWid = 7;

  // shorten so arrowhead doesn't overlap the point symbol too much
  const endX = b.x - ux * 7;
  const endY = b.y - uy * 7;

  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // arrowhead
  const leftX = endX - ux * headLen - uy * headWid;
  const leftY = endY - uy * headLen + ux * headWid;
  const rightX = endX - ux * headLen + uy * headWid;
  const rightY = endY - uy * headLen - ux * headWid;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fill();
}

function drawMod3Symbol(ctx: CanvasRenderingContext2D, p: PointPx): void {
  const r = 6.5;
  const stroke = "rgba(255,255,255,0.92)";
  const fill = "rgba(255,255,255,0.35)";

  ctx.lineWidth = 1.25;
  ctx.strokeStyle = stroke;

  // outline circle (always)
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.stroke();

  // fill half to indicate remainder class (0 => no fill, per spec "circle indicates multiple of 3")
  if (p.mod3 === 1) {
    // lower half
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r - 1.2, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
  } else if (p.mod3 === 2) {
    // upper half
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r - 1.2, Math.PI, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
  }
}

function drawJourney(
  ctx: CanvasRenderingContext2D,
  size: number,
  j: Journey,
  xAxis: AxisOption,
  yAxis: AxisOption,
  ranges: { xMin: number; xMax: number; yMin: number; yMax: number },
  color: string,
  gridSteps: number,
  progress?: number
): void {
  const pts = j.metrics.map((m) => pointForMetrics(m, size, xAxis, yAxis, ranges, gridSteps));
  if (pts.length === 0) return;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  const segs = pts.length - 1;
  const p = progress === undefined ? segs : Math.max(0, Math.min(segs, progress));
  const fullSegs = Math.floor(p);
  const frac = p - fullSegs;

  pts.slice(0, fullSegs).forEach((val, ind, arr) => {
    const next = arr[ind + 1];
    if (next !== undefined)
      drawArrow(ctx, val, next);
  });

  if (frac > 0 && fullSegs < segs) {
    const a = pts[fullSegs];
    const b = pts[fullSegs + 1];
    if (a !== undefined && b !== undefined) {
      const mid: PointPx = {
        x: lerp(a.x, b.x, frac),
        y: lerp(a.y, b.y, frac),
        mod3: b.mod3,
      };
      drawArrow(ctx, a, mid);
    }
  }

  const pointsToDraw = progress === undefined ? pts.length : Math.min(pts.length, fullSegs + 1);
  pts.slice(0, pointsToDraw).forEach((val) => drawMod3Symbol(ctx, val));
}

export function redraw(
  canvas: HTMLCanvasElement,
  state: PlotState,
  animated?: { journeyIndex: number; progress: number }
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const size = canvas.width / dpr;
  const ranges = computeRanges(state.journeys, state.xAxis, state.yAxis);
  const gridSteps = gridStepsForRanges(ranges);

  drawDotGrid(ctx, size, gridSteps);

  state.journeys.forEach((val, idx) => {
    const isAnimated = animated && animated.journeyIndex === idx;
    drawJourney(
      ctx,
      size,
      val,
      state.xAxis,
      state.yAxis,
      ranges,
      colorForJourney(idx),
      gridSteps,
      isAnimated ? animated.progress : undefined
    );
  });
}

