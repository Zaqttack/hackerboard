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

  it("accepts names from other scripts and with accents or emoji", () => {
    for (const name of ["李雷", "María-José", "O'Brien", "Zoë", "Ольга", "Sam 🦊"]) {
      expect(checkName(name)).toEqual({ ok: true, name });
    }
  });

  it("rejects markup, script, template and SQL-shaped input", () => {
    for (const name of [
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
      "{{7*7}}",
      "${process.env}",
      "Robert'); DROP TABLE entries;--",
      '" OR 1=1 --',
      "a\\b",
      "javascript:alert(1)",
      "a/b",
    ]) {
      expect(checkName(name).ok).toBe(false);
    }
  });

  it("rejects short markup and SQL fragments by character, not just length", () => {
    for (const name of ["<b>", "a;b", "{x}", "a<b", "a=b"]) {
      expect(checkName(name)).toEqual({ ok: false, reason: "rejected" });
    }
  });

  it("strips bidi overrides, private-use characters and long runs of combining marks", () => {
    expect(checkName("\u202eGrace")).toEqual({ ok: true, name: "Grace" });
    expect(checkName("Gr\ue000ace")).toEqual({ ok: true, name: "Grace" });
    const zalgo = checkName("Z\u0300\u0301\u0302\u0303\u0304\u0305\u0306a");
    expect(zalgo.ok && Array.from(zalgo.name).length).toBeLessThanOrEqual(5);
  });

  it("rejects absurdly long input without scanning it", () => {
    expect(checkName("a".repeat(100_000))).toEqual({ ok: false, reason: "invalid" });
  });

  it("does not flag innocent names that contain a bad substring", () => {
    for (const name of ["Scunthorpe", "Assad", "Hancock", "Cassandra", "Essex", "Class"]) {
      expect(checkName(name).ok).toBe(true);
    }
  });
});
