import { describe, expect, it } from "vitest";
import { FILLS } from "../shared/types.ts";
import { pickFill, pickTieTarget, tieChance } from "./picks.ts";

describe("pickFill", () => {
  it("never repeats the previous fill", () => {
    for (const previous of FILLS) {
      for (let i = 0; i < 50; i++) {
        expect(pickFill(previous)).not.toBe(previous);
      }
    }
  });

  it("works with no previous fill", () => {
    expect(FILLS).toContain(pickFill(null));
  });
});

describe("tieChance", () => {
  it("follows the density bands", () => {
    expect(tieChance(1)).toBe(0);
    expect(tieChance(2)).toBe(0.8);
    expect(tieChance(10)).toBe(0.8);
    expect(tieChance(11)).toBe(0.4);
    expect(tieChance(25)).toBe(0.4);
    expect(tieChance(26)).toBe(0.2);
    expect(tieChance(50)).toBe(0.2);
  });
});

describe("pickTieTarget", () => {
  it("never ties the first recruit", () => {
    expect(pickTieTarget([], () => 0)).toBeNull();
  });

  it("returns null when the roll misses", () => {
    expect(pickTieTarget([{ id: "a", tiedTo: null }], () => 0.99)).toBeNull();
  });

  it("ties to an existing entry when the roll hits", () => {
    expect(pickTieTarget([{ id: "a", tiedTo: null }], () => 0)).toBe("a");
  });

  it("skips entries that already have 3 strings", () => {
    const recent = [
      { id: "hub", tiedTo: null },
      { id: "b", tiedTo: "hub" },
      { id: "c", tiedTo: "hub" },
      { id: "d", tiedTo: "hub" },
    ];
    for (let i = 0; i < 50; i++) {
      expect(pickTieTarget(recent, () => (i % 2 === 0 ? 0 : 0.3))).not.toBe("hub");
    }
  });
});
