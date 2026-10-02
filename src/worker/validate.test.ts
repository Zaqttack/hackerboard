import { describe, expect, it } from "vitest";
import { checkName } from "./validate.ts";

describe("checkName", () => {
  it("accepts ordinary names", () => {
    for (const name of ["Maya", "Dev Patel", "Ana Lucía", "xX_h4ck3r_Xx", "Rosa M."]) {
      expect(checkName(name)).toEqual({ ok: true, name });
    }
  });

  it("trims and collapses whitespace", () => {
    expect(checkName("  Grace   H \n")).toEqual({ ok: true, name: "Grace H" });
  });

  it("strips control and zero-width characters", () => {
    expect(checkName("Gra​ce\u0007 H")).toEqual({ ok: true, name: "Grace H" });
  });

  it("rejects empty and non-string input", () => {
    expect(checkName("")).toEqual({ ok: false, reason: "invalid" });
    expect(checkName("   ")).toEqual({ ok: false, reason: "invalid" });
    expect(checkName("​​")).toEqual({ ok: false, reason: "invalid" });
    expect(checkName(undefined)).toEqual({ ok: false, reason: "invalid" });
    expect(checkName(42)).toEqual({ ok: false, reason: "invalid" });
  });

  it("allows exactly 20 characters and rejects 21", () => {
    expect(checkName("a".repeat(20))).toEqual({ ok: true, name: "a".repeat(20) });
    expect(checkName("a".repeat(21))).toEqual({ ok: false, reason: "invalid" });
  });

  it("counts characters, not UTF-16 units", () => {
    expect(checkName("😀".repeat(20)).ok).toBe(true);
    expect(checkName("😀".repeat(21)).ok).toBe(false);
  });

  it("rejects profanity, including simple obfuscation", () => {
    expect(checkName("shit")).toEqual({ ok: false, reason: "rejected" });
    expect(checkName("Sh1t Head")).toEqual({ ok: false, reason: "rejected" });
  });

  it("does not flag innocent names that contain a bad substring", () => {
    for (const name of ["Scunthorpe", "Assad", "Hancock", "Cassandra", "Essex", "Class"]) {
      expect(checkName(name).ok).toBe(true);
    }
  });
});
