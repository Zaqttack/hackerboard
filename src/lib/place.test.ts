import { describe, expect, it } from "vitest";
import { baubleRect, findSpot, look, WALLS, type Rect } from "./place.ts";
import { baubleScale } from "./tiers.ts";

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function crowd(count: number, seed: number) {
  const rand = seeded(seed);
  const widths = Array.from({ length: count }, () => 125 + 17 * (3 + Math.round(rand() * rand() * 17))).sort((a, b) => b - a);
  const taken: Rect[] = [];
  for (const width of widths) {
    const scale = baubleScale(count, 1);
    const { x, y } = findSpot(width, scale, taken, rand);
    taken.push(baubleRect(x, y, width, scale));
  }
  return taken;
}

const touches = (a: Rect, b: Rect) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

describe("findSpot", () => {
  it.each([1, 10, 25, 40, 50])("places %i baubles without overlap, widest first", (count) => {
    for (const seed of [1, 2, 3]) {
      const taken = crowd(count, seed);
      for (let i = 0; i < taken.length; i++) {
        for (const wall of WALLS) expect(touches(taken[i], wall)).toBe(false);
        for (let j = i + 1; j < taken.length; j++) expect(touches(taken[i], taken[j])).toBe(false);
        expect(taken[i][0]).toBeGreaterThanOrEqual(0);
        expect(taken[i][2]).toBeLessThanOrEqual(1920);
        expect(taken[i][1]).toBeGreaterThanOrEqual(0);
        expect(taken[i][3]).toBeLessThanOrEqual(1080);
      }
    }
  });

  it("puts a newcomer in the gap left among existing baubles", () => {
    const taken = crowd(20, 7);
    const { x, y } = findSpot(260, 1.2, taken);
    const rect = baubleRect(x, y, 260, 1.2);
    expect(taken.some((other) => touches(rect, other))).toBe(false);
  });
});

describe("look", () => {
  it("is stable per id and within the design's ranges", () => {
    expect(look("abc")).toEqual(look("abc"));
    for (const id of ["a", "b", "c", crypto.randomUUID(), crypto.randomUUID()]) {
      const { rotation, variation } = look(id);
      expect(Math.abs(rotation)).toBeLessThanOrEqual(4);
      expect(variation).toBeGreaterThanOrEqual(0.95);
      expect(variation).toBeLessThanOrEqual(1.05);
    }
  });
});
