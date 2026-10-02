export const MAX_RECRUITS = 50;

export function tierScale(count: number): number {
  if (count <= 15) return 1.2;
  if (count <= 30) return 1;
  if (count <= 40) return 0.88;
  return 0.78;
}
