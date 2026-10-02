import { describe, expect, it } from "vitest";
import { elapsed } from "./format.ts";

describe("elapsed", () => {
  it("shows minutes and zero-padded seconds since the first join", () => {
    expect(elapsed(1000, 1000)).toBe("+0:00");
    expect(elapsed(8000, 1000)).toBe("+0:07");
    expect(elapsed(61_000, 1000)).toBe("+1:00");
    expect(elapsed(3_661_000, 1000)).toBe("+61:00");
  });

  it("never goes negative", () => {
    expect(elapsed(0, 5000)).toBe("+0:00");
  });
});
