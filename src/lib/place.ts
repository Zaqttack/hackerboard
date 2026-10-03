export type Rect = [left: number, top: number, right: number, bottom: number];

export const BAUBLE_H = 88;
const PIN_H = 12;
const ORIGIN = 44;
const BOUNDS: Rect = [30, 40, 1890, 1040];
const GAP = 12;
const STEP = 12;

export const WALLS: Rect[] = [
  [30, 30, 770, 470],
  [1480, 20, 1900, 500],
];

export function baubleRect(x: number, y: number, width: number, scale: number): Rect {
  const left = x + ORIGIN * (1 - scale);
  const top = y + ORIGIN * (1 - scale) - PIN_H * scale;
  return [left, top, left + width * scale, top + (BAUBLE_H + PIN_H) * scale];
}

function overlap(a: Rect, b: Rect, gap: number) {
  return a[0] < b[2] + gap && a[2] > b[0] - gap && a[1] < b[3] + gap && a[3] > b[1] - gap;
}

function free(rect: Rect, taken: Rect[], gap: number) {
  return !WALLS.some((wall) => overlap(rect, wall, 0)) && !taken.some((other) => overlap(rect, other, gap));
}

function toOrigin(left: number, top: number, scale: number) {
  return { x: left - ORIGIN * (1 - scale), y: top - ORIGIN * (1 - scale) + PIN_H * scale };
}

function gapBetween(a: Rect, b: Rect) {
  return Math.max(b[0] - a[2], a[0] - b[2], b[1] - a[3], a[1] - b[3], 0);
}

function clearance(rect: Rect, taken: Rect[]) {
  return [...WALLS, ...taken].reduce((least, other) => Math.min(least, gapBetween(rect, other)), Infinity);
}

const FREE_AREA = (BOUNDS[2] - BOUNDS[0]) * (BOUNDS[3] - BOUNDS[1]) - WALLS.reduce((sum, w) => sum + (w[2] - w[0]) * (w[3] - w[1]), 0);
const CROWDED = 0.1;

export function findSpot(width: number, scale: number, taken: Rect[], rand: () => number = Math.random) {
  const w = width * scale;
  const h = (BAUBLE_H + PIN_H) * scale;
  const maxLeft = Math.max(BOUNDS[0], BOUNDS[2] - w);
  const maxTop = Math.max(BOUNDS[1], BOUNDS[3] - h);
  const rectAt = (left: number, top: number): Rect => [left, top, left + w, top + h];

  const used = taken.reduce((sum, r) => sum + (r[2] - r[0]) * (r[3] - r[1]), 0);
  const crowded = used / FREE_AREA > CROWDED;

  const random: [number, number][] = [];
  for (let i = 0; i < 300; i++) {
    random.push([BOUNDS[0] + rand() * (maxLeft - BOUNDS[0]), BOUNDS[1] + rand() * (maxTop - BOUNDS[1])]);
  }
  const grid: [number, number][] = [];
  for (let top = BOUNDS[1]; top <= maxTop; top += STEP) {
    for (let left = BOUNDS[0]; left <= maxLeft; left += STEP) grid.push([left, top]);
  }

  for (const gap of [GAP, GAP / 2, 0, -6]) {
    if (!crowded) {
      const pick = random.find(([left, top]) => free(rectAt(left, top), taken, gap));
      if (pick) return toOrigin(pick[0], pick[1], scale);
    }
    let best: [number, number] | null = null;
    let least = Infinity;
    for (const [left, top] of [...random, ...grid]) {
      const rect = rectAt(left, top);
      if (!free(rect, taken, gap)) continue;
      const score = clearance(rect, taken);
      if (score < least) {
        least = score;
        best = [left, top];
      }
    }
    if (best) return toOrigin(best[0], best[1], scale);
  }

  const area = (left: number, top: number) => {
    const rect = rectAt(left, top);
    return [...WALLS, ...taken].reduce((sum, other) => {
      const dx = Math.min(rect[2], other[2]) - Math.max(rect[0], other[0]);
      const dy = Math.min(rect[3], other[3]) - Math.max(rect[1], other[1]);
      return sum + (dx > 0 && dy > 0 ? dx * dy : 0);
    }, 0);
  };
  const [left, top] = random.reduce((fewest, next) => (area(...next) < area(...fewest) ? next : fewest));
  return toOrigin(left, top, scale);
}

function hash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

export function look(id: string) {
  return {
    rotation: Math.round((hash(id) - 0.5) * 80) / 10,
    variation: 0.95 + hash(id + "v") * 0.1,
  };
}
