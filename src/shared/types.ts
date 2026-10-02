export const FILLS = ["paper", "tape", "manila", "carbon", "memo", "mint"] as const;

export type Fill = (typeof FILLS)[number];

export type Entry = {
  id: string;
  name: string;
  emoji: string;
  fill: Fill;
  tiedTo: string | null;
  createdAt: number;
};
