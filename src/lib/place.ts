import { tierScale } from "./tiers.ts";
import type { Entry } from "../shared/types.ts";

export type Placed = {
  entry: Entry;
  x: number;
  y: number;
  rotation: number;
  variation: number;
};

type Rect = [left: number, top: number, right: number, bottom: number];

const WALLS: Rect[] = [
  [30, 30, 770, 430],
  [1480, 20, 1900, 500],
];

function overlaps(a: Rect, b: Rect, slack: number) {
  return a[0] < b[2] - slack && a[2] > b[0] + slack && a[1] < b[3] - slack && a[3] > b[1] + slack;
}

function rectOf(placed: Placed, scale: number): Rect {
  const width = (88 + Array.from(placed.entry.name).length * 17 + 40) * scale * placed.variation;
  const height = 88 * scale * placed.variation;
  return [placed.x, placed.y, placed.x + width, placed.y + height];
}

export function place(entry: Entry, existing: Placed[], count: number): Placed {
  const scale = tierScale(count);
  const variation = 0.95 + Math.random() * 0.1;
  const rotation = Math.round((Math.random() - 0.5) * 80) / 10;
  const width = (88 + Array.from(entry.name).length * 17 + 40) * scale * variation;
  const height = 88 * scale * variation;
  const taken = existing.map((p) => rectOf(p, scale));

  let x = 0;
  let y = 0;
  for (let attempt = 0; attempt < 600; attempt++) {
    x = 30 + Math.random() * (1860 - width);
    y = 40 + Math.random() * (1000 - height);
    const candidate: Rect = [x, y, x + width, y + height];
    const slack = attempt < 300 ? 0 : 18;
    if (!WALLS.some((wall) => overlaps(candidate, wall, 0)) && !taken.some((rect) => overlaps(candidate, rect, slack))) {
      break;
    }
  }

  return { entry, x, y, rotation, variation };
}
