const COOKIE_KEY = "collatz_journeys";

function getCookieValue(name: string): string | undefined {
  // document.cookie is "a=b; c=d"
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq);
    if (k === name) return part.slice(eq + 1);
  }
  return undefined;
}

export function loadJourneysFromCookie(): number[][] {
  try {
    const raw = getCookieValue(COOKIE_KEY);
    if (!raw) return [];
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as unknown;
    if (!Array.isArray(parsed)) return [];
    const journeys: number[][] = [];
    for (const j of parsed) {
      if (!Array.isArray(j)) continue;
      const nums: number[] = [];
      for (const v of j) {
        if (typeof v !== "number") continue;
        if (!Number.isFinite(v)) continue;
        if (v < 1) continue;
        nums.push(Math.floor(v));
      }
      if (nums.length > 0) journeys.push(nums);
    }
    return journeys;
  } catch {
    return [];
  }
}

export function saveJourneysToCookie(journeys: number[][]): void {
  const encoded = encodeURIComponent(JSON.stringify(journeys));
  // 400 days, path=/ so it sticks for the app.
  const maxAgeSeconds = 400 * 24 * 60 * 60;
  document.cookie = `${COOKIE_KEY}=${encoded}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
}

export function clearJourneysCookie(): void {
  document.cookie = `${COOKIE_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
}

