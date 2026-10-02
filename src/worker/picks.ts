import { ANIMALS } from "../shared/animals.ts";
import { FILLS, type Fill } from "../shared/types.ts";

export type Rng = () => number;

export type Tieable = { id: string; tiedTo: string | null };

const MAX_STRINGS = 3;

function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

export function pickEmoji(rng: Rng = Math.random): string {
  return pick(ANIMALS, rng).emoji;
}

export function pickFill(previous: Fill | null, rng: Rng = Math.random): Fill {
  return pick(
    FILLS.filter((fill) => fill !== previous),
    rng,
  );
}

export function tieChance(count: number): number {
  if (count < 2) return 0;
  if (count <= 10) return 0.8;
  if (count <= 25) return 0.4;
  return 0.2;
}

export function pickTieTarget(recent: Tieable[], rng: Rng = Math.random): string | null {
  if (rng() >= tieChance(recent.length + 1)) return null;

  const degree = new Map<string, number>();
  for (const entry of recent) {
    if (entry.tiedTo !== null) {
      degree.set(entry.id, (degree.get(entry.id) ?? 0) + 1);
      degree.set(entry.tiedTo, (degree.get(entry.tiedTo) ?? 0) + 1);
    }
  }

  const open = recent.filter((entry) => (degree.get(entry.id) ?? 0) < MAX_STRINGS);
  return open.length === 0 ? null : pick(open, rng).id;
}
