import { englishDataset, englishRecommendedTransformers, RegExpMatcher } from "obscenity";
import { NAME_MAX } from "../shared/constants.ts";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const INVISIBLE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;

export type NameResult = { ok: true; name: string } | { ok: false; reason: "invalid" | "rejected" };

export function checkName(raw: unknown): NameResult {
  if (typeof raw !== "string") return { ok: false, reason: "invalid" };

  const name = raw.replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
  const length = Array.from(name).length;

  if (length < 1 || length > NAME_MAX) return { ok: false, reason: "invalid" };
  if (matcher.hasMatch(name)) return { ok: false, reason: "rejected" };

  return { ok: true, name };
}
