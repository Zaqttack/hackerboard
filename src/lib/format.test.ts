import { describe, expect, it } from "vitest";
import { formatElapsed } from "./format.ts";

describe("formatElapsed", () => {
  it.each([
    [0, "+0:00"],
    [999, "+0:00"],
    [1000, "+0:01"],
    [59_999, "+0:59"],
    [60_000, "+1:00"],
    [754_000, "+12:34"],
    [3_600_000, "+60:00"],
    [90_061_000, "+1501:01"],
  ])("%i ms is %s", (ms, text) => {
    expect(formatElapsed(ms)).toBe(text);
  });

  it("never goes negative", () => {
    expect(formatElapsed(-5000)).toBe("+0:00");
  });
});
