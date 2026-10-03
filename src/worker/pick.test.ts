import { describe, expect, it } from "vitest";
import { ANIMALS } from "../shared/animals.ts";
import { FILLS } from "../shared/types.ts";
import { MAX_STRINGS, pickEmoji, pickFill, pickTie, tieOdds } from "./pick.ts";

function sequence(...values: number[]) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

function board(count: number, tied: Record<string, string> = {}) {
  return Array.from({ length: count }, (_, i) => ({ id: `e${i}`, tiedTo: tied[`e${i}`] ?? null }));
}

describe("pickEmoji", () => {
  it("always returns an emoji from the pool", () => {
    const pool = new Set<string>(ANIMALS.map((a) => a.emoji));
    for (let i = 0; i < 500; i++) expect(pool.has(pickEmoji())).toBe(true);
  });

  it("covers both ends of the pool", () => {
    expect(pickEmoji(() => 0)).toBe(ANIMALS[0].emoji);
    expect(pickEmoji(() => 0.999999)).toBe(ANIMALS[ANIMALS.length - 1].emoji);
  });
});

describe("pickFill", () => {
  it("never repeats the previous fill", () => {
    for (const previous of FILLS) {
      for (let r = 0; r < 1; r += 0.01) {
        expect(pickFill(previous, () => r)).not.toBe(previous);
      }
    }
  });

  it("can return every other fill", () => {
    const seen = new Set<string>();
    for (let r = 0; r < 1; r += 0.01) seen.add(pickFill("paper", () => r));
    expect([...seen].sort()).toEqual(FILLS.filter((f) => f !== "paper").sort());
  });

  it("allows any fill for the first entry", () => {
    const seen = new Set<string>();
    for (let r = 0; r < 1; r += 0.01) seen.add(pickFill(null, () => r));
    expect(seen.size).toBe(FILLS.length);
  });
});

describe("tieOdds", () => {
  it.each([
    [1, 0],
    [2, 0.8],
    [10, 0.8],
    [11, 0.4],
    [25, 0.4],
    [26, 0.2],
    [50, 0.2],
  ])("recruit %i ties %f of the time", (recruit, odds) => {
    expect(tieOdds(recruit)).toBe(odds);
  });
});

describe("pickTie", () => {
  it("never ties the first recruit", () => {
    expect(pickTie([], () => 0)).toBeNull();
  });

  it("ties when the roll is under the odds", () => {
    expect(pickTie(board(3), sequence(0.79, 0))).toBe("e0");
    expect(pickTie(board(3), sequence(0.8, 0))).toBeNull();
  });

  it("uses the odds for the recruit's place on the board", () => {
    const ties = (existing: number, roll: number) => pickTie(board(existing), sequence(roll, 0)) !== null;
    expect(ties(9, 0.79)).toBe(true);
    expect(ties(9, 0.81)).toBe(false);
    expect(ties(10, 0.39)).toBe(true);
    expect(ties(10, 0.41)).toBe(false);
    expect(ties(24, 0.39)).toBe(true);
    expect(ties(24, 0.41)).toBe(false);
    expect(ties(25, 0.19)).toBe(true);
    expect(ties(25, 0.21)).toBe(false);
    expect(ties(49, 0.19)).toBe(true);
    expect(ties(49, 0.21)).toBe(false);
  });

  it("picks uniformly among the entries on the board", () => {
    expect(pickTie(board(4), sequence(0, 0.99))).toBe("e3");
    expect(pickTie(board(4), sequence(0, 0.5))).toBe("e2");
  });

  it("counts strings in both directions", () => {
    const tied = { e1: "e0", e2: "e0", e3: "e0" };
    const result = pickTie(board(5, tied), sequence(0, 0));
    expect(result).toBe("e1");
  });

  it("never picks an entry that already has the maximum strings", () => {
    const tied = { e1: "e0", e2: "e0", e3: "e0" };
    for (let r = 0; r < 1; r += 0.05) {
      expect(pickTie(board(6, tied), sequence(0, r))).not.toBe("e0");
    }
  });

  it("stops at three strings for outgoing ones too", () => {
    expect(MAX_STRINGS).toBe(3);
    const tied = { e0: "e1", e2: "e0", e3: "e0" };
    for (let r = 0; r < 1; r += 0.05) {
      expect(pickTie(board(5, tied), sequence(0, r))).not.toBe("e0");
    }
  });

  it("ignores strings that point at entries that left the board", () => {
    const entries = [
      { id: "a", tiedTo: "gone" },
      { id: "b", tiedTo: null },
    ];
    expect(pickTie(entries, sequence(0, 0))).toBe("a");
  });
});
