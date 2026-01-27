import type { AxisOption, NumberMetrics } from "./types.js";

const metricsMemo = new Map<number, NumberMetrics>();
const oddJourneyMemo = new Map<number, number[]>();

function countRuns(bits: string, target: "0" | "1"): number {
  let best = 0;
  let cur = 0;
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === target) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

function countSwitches(bits: string): number {
  let s = 0;
  for (let i = 1; i < bits.length; i++) {
    if (bits[i] !== bits[i - 1]) s++;
  }
  return s;
}

export function metricsFor(n: number): NumberMetrics {
  const key = Math.floor(n);
  const cached = metricsMemo.get(key);
  if (cached) return cached;

  const bits = key.toString(2);
  const ones = bits.replaceAll("0", "").length;
  const zeroes = bits.length - ones;
  const maxConsecutiveZeroes = countRuns(bits, "0");
  const maxConsecutiveOnes = countRuns(bits, "1");
  const switches = countSwitches(bits);
  const mod3 = (key % 3) as 0 | 1 | 2;

  const m: NumberMetrics = {
    n: key,
    mod3,
    binaryLength: bits.length,
    zeroes,
    ones,
    maxConsecutiveZeroes,
    maxConsecutiveOnes,
    switches,
  };
  metricsMemo.set(key, m);
  return m;
}

export function axisValue(m: NumberMetrics, axis: AxisOption): number {
  switch (axis) {
    case "binary length":
      return m.binaryLength;
    case "zeroes":
      return m.zeroes;
    case "ones":
      return m.ones;
    case "consecutive zeroes":
      return m.maxConsecutiveZeroes;
    case "consecutive ones":
      return m.maxConsecutiveOnes;
    case "switches":
      return m.switches;
  }
}

export function toOdd(n: number): number {
  let x = Math.floor(n);
  if (!Number.isFinite(x) || x < 1) return 1;
  while (x % 2 === 0) x = Math.floor(x / 2);
  return x;
}

function nextOddCollatz(odd: number): number {
  // odd -> (3n+1) then divide by 2 until odd
  let x = 3 * odd + 1;
  while (x % 2 === 0) x = Math.floor(x / 2);
  return x;
}

export function collatzOddJourney(startN: number, maxOdds = 5000): number[] {
  const startOdd = toOdd(startN);
  const cached = oddJourneyMemo.get(startOdd);
  if (cached) return cached.slice();

  const out: number[] = [startOdd];
  const seen = new Set<number>([startOdd]);

  let cur = startOdd;
  for (let i = 0; i < maxOdds; i++) {
    if (cur === 1) break;
    const nxt = nextOddCollatz(cur);
    out.push(nxt);
    if (seen.has(nxt)) break; // safety against unexpected loops
    seen.add(nxt);
    cur = nxt;
  }

  oddJourneyMemo.set(startOdd, out.slice());
  return out;
}

