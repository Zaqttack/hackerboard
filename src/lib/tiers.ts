const MIN_BAUBLE_SCALE = 26 / 34;

export function tierScale(count: number): number {
  if (count <= 15) return 1.2;
  if (count <= 30) return 1;
  if (count <= 40) return 0.88;
  return 0.78;
}

export function baubleScale(count: number, variation: number): number {
  return Math.max(MIN_BAUBLE_SCALE, tierScale(count) * variation);
}
