import { describe, expect, it } from "vitest";
import { validateName } from "./validate.ts";

const accepted = (input: unknown) => {
  const result = validateName(input);
  if (!result.ok) throw new Error(`expected ok, got ${result.reason}`);
  return result.name;
};

const reason = (input: unknown) => {
  const result = validateName(input);
  if (result.ok) throw new Error(`expected failure, got "${result.name}"`);
  return result.reason;
};

describe("accepted names", () => {
  it.each([
    "Maya",
    "Grace H",
    "Rosa M.",
    "Ana Lucía",
    "Ifeoma",
    "xX_h4ck3r_Xx",
    "O'Brien",
    "D’Angelo",
    "null_ptr",
    "Dev (he-him)",
    "田中太郎",
    "Мария",
    "محمد",
    "José-Luis",
    "R2-D2 & C-3PO",
    "#1 fan!",
    "me@home+you",
    "wow*~",
    "🦊 Fox",
    "🙂",
  ])("%s", (name) => {
    expect(accepted(name)).toBe(name);
  });

  it("keeps a name of exactly 20 code points", () => {
    expect(accepted("a".repeat(20))).toHaveLength(20);
  });

  it("counts code points, not UTF-16 units", () => {
    expect([...accepted("🦊".repeat(20))]).toHaveLength(20);
    expect(reason("🦊".repeat(21))).toBe("invalid");
  });

  it("stores SQL-looking text made only of allowed characters verbatim", () => {
    expect(accepted("'--")).toBe("'--");
    expect(accepted("x' OR 1")).toBe("x' OR 1");
  });
});

describe("normalization", () => {
  it("normalizes to NFC", () => {
    const name = accepted("Luci" + "a\u0301");
    expect(name).toBe("Luci\u00e1");
    expect([...name]).toHaveLength(5);
  });

  it("trims and collapses whitespace", () => {
    expect(accepted("   Grace    H  ")).toBe("Grace H");
    expect(accepted("a\t\n\r b")).toBe("a b");
    expect(accepted("a\u00a0\u2003b")).toBe("a b");
    expect(accepted("a\u2028b")).toBe("a b");
  });

  it("strips control characters", () => {
    expect(accepted("Ma\u0000ya\u0007\u001b")).toBe("Maya");
    expect(accepted("Ma\u007fya\u0085")).toBe("Maya");
  });

  it("strips format characters: zero-width, bidi overrides, isolates", () => {
    expect(accepted("Ma\u200bya\u200c\u200d\u2060")).toBe("Maya");
    expect(accepted("\u202eevil\u202c")).toBe("evil");
    expect(accepted("a\u2066b\u2069c")).toBe("abc");
    expect(accepted("\u00admaya")).toBe("maya");
  });

  it("strips private-use characters", () => {
    expect(accepted("Ma\ue000ya\uf8ff")).toBe("Maya");
    expect(accepted("a\u{f0000}b\u{10ffff}")).toBe("ab");
  });

  it("strips unassigned code points and lone surrogates", () => {
    expect(accepted("Ma\u0378ya")).toBe("Maya");
    expect(accepted("Ma\ud800ya\udfff")).toBe("Maya");
  });

  it("strips tag characters", () => {
    expect(accepted("a\u{e0041}\u{e0042}b")).toBe("ab");
  });

  it("measures length after stripping", () => {
    expect(accepted("a\u200b".repeat(20))).toBe("a".repeat(20));
    expect(reason("\u200b\u200c\u0000")).toBe("invalid");
  });

  it("caps runs of combining marks at two", () => {
    const zalgo = "Z" + "\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307".repeat(3) + "a";
    const name = accepted(zalgo);
    expect([...name]).toHaveLength(4);
    expect(name).toBe("Z\u0300\u0301a");
  });

  it("rejects a name that is only marks or spaces as invalid", () => {
    expect(reason("\u0301\u0302")).toBe("invalid");
    expect(reason("   ")).toBe("invalid");
    expect(reason("")).toBe("invalid");
  });

  it("splits ZWJ emoji sequences into plain emoji", () => {
    expect(accepted("👩\u200d💻")).toBe("👩💻");
  });

  it("keeps skin tones, flags and keycaps", () => {
    expect(accepted("👍🏽")).toBe("👍🏽");
    expect(accepted("🇺🇸")).toBe("🇺🇸");
    expect(accepted("1\ufe0f\u20e3")).toBe("1\ufe0f\u20e3");
  });
});

describe("length", () => {
  it("rejects 21 code points as invalid", () => {
    expect(reason("a".repeat(21))).toBe("invalid");
  });

  it("rejects a very long name as invalid", () => {
    expect(reason("a".repeat(5000))).toBe("invalid");
  });

  it("reports length before characters", () => {
    expect(reason("<script>alert(1)</script>")).toBe("invalid");
  });
});

describe("non-string input", () => {
  it.each([undefined, null, 42, true, {}, [], ["Maya"], { name: "Maya" }])("%j", (value) => {
    expect(reason(value)).toBe("invalid");
  });
});

describe("markup payloads", () => {
  it.each([
    "<b>x</b>",
    "<i>hi</i>",
    "<svg/onload=1>",
    "</script>",
    "<a href=x>",
    "&lt;b&gt;",
    "javascript:1",
    "x\"onmouseover=\"1",
    "`ls`",
    "a<b",
    "a>b",
    "<!--",
    "]]>",
    "&#x3C;",
  ])("%s", (payload) => {
    expect(reason(payload)).toBe("rejected");
  });

  it("rejects fullwidth look-alikes of angle brackets", () => {
    expect(reason("＜b＞hi")).toBe("rejected");
    expect(reason("‹b›")).toBe("rejected");
  });
});

describe("template payloads", () => {
  it.each(["${7*7}", "{{7*7}}", "{{x}}", "<%= 1 %>", "#{1}", "$(id)", "%s%s%s", "%n", "{0}", "[[x]]", "\\u0041", "\\x41", "a\\b"])(
    "%s",
    (payload) => {
      expect(reason(payload)).toBe("rejected");
    },
  );
});

describe("SQL payloads", () => {
  it.each(["a';--", "x' OR '1'='1", "1; DROP TABLE", "a\";--", "' UNION SELECT 1,2", "a/**/b", "a%27--", "\\'", "0x41;"])(
    "disallows %s",
    (payload) => {
      expect(reason(payload)).toBe("rejected");
    },
  );

  it("rejects a long classic injection as invalid", () => {
    expect(reason("Robert'); DROP TABLE entries;--")).toBe("invalid");
  });
});

describe("Unicode edge cases", () => {
  it.each([
    "a−b",
    "a×b",
    "a=b",
    "a/b",
    "a\\b",
    "a|b",
    "a;b",
    "a:b",
    "a,b",
    "a$b",
    "a%b",
    "a^b",
    "a{b",
    "a[b",
    "a\"b",
    "a`b",
    "a¤b",
    "⸮b",
    "a⁄b",
  ])("%j", (name) => {
    expect(reason(name)).toBe("rejected");
  });

  it("does not let a stripped character hide a disallowed one", () => {
    expect(reason("<\u200bb\u200b>")).toBe("rejected");
    expect(reason("a\u202e;")).toBe("rejected");
  });

  it("does not let stripping assemble a disallowed one", () => {
    expect(reason("&\u0000#60;")).toBe("rejected");
  });
});

describe("profanity", () => {
  it.each(["fuck", "Shit", "FUCK", "b1tch", "n1gger"])("%s", (name) => {
    expect(reason(name)).toBe("rejected");
  });

  it.each(["Scunthorpe", "Assistant", "Cassidy", "Hancock"])("allows %s", (name) => {
    expect(accepted(name)).toBe(name);
  });

  it("catches profanity hidden by zero-width characters", () => {
    expect(reason("fu\u200bck")).toBe("rejected");
  });
});
