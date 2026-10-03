import { ANIMALS } from "../shared/animals.ts";
import { MAX_RECRUITS } from "../shared/constants.ts";
import { FILLS, type Fill } from "../shared/types.ts";

export const MAX_STRINGS = 3;

type Rand = () => number;

export function pickEmoji(rand: Rand = Math.random): string {
  return ANIMALS[Math.floor(rand() * ANIMALS.length)].emoji;
}

export function pickFill(previous: Fill | null, rand: Rand = Math.random): Fill {
  const choices = FILLS.filter((fill) => fill !== previous);
  return choices[Math.floor(rand() * choices.length)];
}

export function tieOdds(recruit: number): number {
  if (recruit < 2) return 0;
  if (recruit <= 10) return 0.8;
  if (recruit <= 25) return 0.4;
  return 0.2;
}

export function pickTie(
  board: { id: string; tiedTo: string | null }[],
  rand: Rand = Math.random,
): string | null {
  const recruit = Math.min(board.length + 1, MAX_RECRUITS);
  if (rand() >= tieOdds(recruit)) return null;

  const strings = new Map<string, number>(board.map((entry) => [entry.id, 0]));
  for (const entry of board) {
    if (entry.tiedTo !== null && strings.has(entry.tiedTo)) {
      strings.set(entry.id, strings.get(entry.id)! + 1);
      strings.set(entry.tiedTo, strings.get(entry.tiedTo)! + 1);
    }
  }

  const open = board.filter((entry) => strings.get(entry.id)! < MAX_STRINGS);
  if (open.length === 0) return null;
  return open[Math.floor(rand() * open.length)].id;
}
