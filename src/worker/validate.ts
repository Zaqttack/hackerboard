import { englishDataset, englishRecommendedTransformers, RegExpMatcher } from "obscenity";
import { NAME_MAX } from "../shared/constants.ts";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const INVISIBLE = /[\p{Cc}\p{Cf}\p{Co}\p{Cn}\p{Cs}\p{Zl}\p{Zp}]/gu;
const MARK_RUN = /(\p{M}{2})\p{M}+/gu;
const ALLOWED = /^[\p{L}\p{N}\p{M}\p{Extended_Pictographic} ._'’!?&#@+()*~-]+$/u;

export type NameResult = { ok: true; name: string } | { ok: false; reason: "invalid" | "rejected" };

export function checkName(raw: unknown): NameResult {
  if (typeof raw !== "string" || raw.length > NAME_MAX * 8) return { ok: false, reason: "invalid" };

  const name = raw
    .normalize("NFC")
    .replace(INVISIBLE, "")
    .replace(MARK_RUN, "$1")
    .replace(/\s+/g, " ")
    .trim();
  const length = Array.from(name).length;

  if (length < 1 || length > NAME_MAX) return { ok: false, reason: "invalid" };
  if (!ALLOWED.test(name)) return { ok: false, reason: "rejected" };
  if (matcher.hasMatch(name)) return { ok: false, reason: "rejected" };

  return { ok: true, name };
}
