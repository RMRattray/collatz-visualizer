import { collatzOddJourney, metricsFor, toOdd } from "./collatz.js";
import { clearJourneysCookie, loadJourneysFromCookie, saveJourneysToCookie } from "./storage.js";
import { redraw } from "./render.js";
import { AXIS_OPTIONS, type AxisOption, type Journey } from "./types.js";

function mustGet<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

function setCanvasSizeSquare(canvas: HTMLCanvasElement, sizePx: number): void {
  const dpr = window.devicePixelRatio || 1;
  const px = Math.max(320, Math.floor(sizePx));
  canvas.style.width = `${px}px`;
  canvas.style.height = `${px}px`;
  canvas.width = Math.floor(px * dpr);
  canvas.height = Math.floor(px * dpr);

  const ctx = canvas.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function populateAxisSelect(select: HTMLSelectElement, allowed: AxisOption[], selected: AxisOption): void {
  select.innerHTML = "";
  for (const opt of allowed) {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    select.appendChild(o);
  }
  select.value = selected;
}

function allowedForYAxis(xAxis: AxisOption): AxisOption[] {
  return AXIS_OPTIONS.filter((o) => o !== xAxis);
}

// Recalculate metrics when loading from cookie
function journeysFromCookie(): Journey[] {
  const raw = loadJourneysFromCookie();
  return raw.map((oddNumbers: number[]) => {
    return {oddNumbers: oddNumbers, metrics: oddNumbers.map((n) => metricsFor(n))};
  });
}

function saveJourneys(journeys: Journey[]): void {
  saveJourneysToCookie(journeys.map((j) => j.oddNumbers));
}

function main(): void {
  const canvas = mustGet<HTMLCanvasElement>("plot");
  const xAxisSel = mustGet<HTMLSelectElement>("xAxis");
  const yAxisSel = mustGet<HTMLSelectElement>("yAxis");
  const startN = mustGet<HTMLInputElement>("startN");
  const runBtn = mustGet<HTMLButtonElement>("run");
  const clearBtn = mustGet<HTMLButtonElement>("clear");

  let xAxis: AxisOption = "binary length";
  let yAxis: AxisOption = "ones";

  let journeys: Journey[] = journeysFromCookie();
  let animRaf: number | undefined;

  const draw = (animated?: { journeyIndex: number; progress: number }) => {
    redraw(canvas, { xAxis, yAxis, journeys }, animated);
  };

  const resizeObserver = new ResizeObserver(() => {
    const parent = canvas.parentElement;
    if (!parent) return;
    // Fit within the pane, and keep square.
    const rect = parent.getBoundingClientRect();
    const sizePx = Math.min(rect.width, rect.height);
    setCanvasSizeSquare(canvas, sizePx);
    draw();
  });
  if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

  // initial UI
  populateAxisSelect(xAxisSel, AXIS_OPTIONS, xAxis);
  populateAxisSelect(yAxisSel, allowedForYAxis(xAxis), yAxis);
  if (yAxisSel.value !== yAxis) yAxis = yAxisSel.value as AxisOption;

  const cancelAnim = () => {
    if (animRaf !== undefined) cancelAnimationFrame(animRaf);
    animRaf = undefined;
  };

  xAxisSel.addEventListener("change", () => {
    cancelAnim();
    xAxis = xAxisSel.value as AxisOption;
    const allowed = allowedForYAxis(xAxis);
    // Last case should never occur but is necessary to satisfy TypeScript
    yAxis = allowed.includes(yAxis) ? yAxis : allowed[0] ? allowed[0] : "ones";
    populateAxisSelect(yAxisSel, allowed, yAxis);
    draw();
  });

  yAxisSel.addEventListener("change", () => {
    cancelAnim();
    yAxis = yAxisSel.value as AxisOption;
    draw();
  });

  function animateNewJourney(journeyIndex: number, points: number): void {
    cancelAnim();
    const segs = Math.max(0, points - 1);
    if (segs === 0) {
      draw();
      return;
    }

    const msPerSeg = 220;
    const totalMs = segs * msPerSeg;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / totalMs);
      const progress = t * segs;
      draw({ journeyIndex, progress });
      if (t < 1) animRaf = requestAnimationFrame(tick);
      else animRaf = undefined;
    };
    animRaf = requestAnimationFrame(tick);
  }

  runBtn.addEventListener("click", () => {
    cancelAnim();

    const raw = startN.value.trim();
    if (!raw) return;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) return;

    const oddJourney = collatzOddJourney(n);
    const metrics = oddJourney.map((x) => metricsFor(x));
    const j: Journey = { oddNumbers: oddJourney, metrics };

    journeys = [...journeys, j];
    saveJourneys(journeys);
    draw();
    animateNewJourney(journeys.length - 1, j.metrics.length);
  });

  clearBtn.addEventListener("click", () => {
    cancelAnim();
    journeys = [];
    clearJourneysCookie();
    draw();
  });

  // Ensure an initial canvas size even before ResizeObserver fires.
  setTimeout(() => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    setCanvasSizeSquare(canvas, Math.min(rect.width, rect.height));
    draw();
  }, 0);
}

main();

