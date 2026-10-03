import { englishDataset, englishRecommendedTransformers, RegExpMatcher } from "obscenity";
import { NAME_MAX } from "../shared/constants.ts";

export type NameResult = { ok: true; name: string } | { ok: false; reason: "invalid" | "rejected" };

const STRIP = /[\p{Cc}\p{Cf}\p{Co}\p{Cs}\p{Cn}]/gu;
const MARK_RUN = /\p{M}+/gu;
const WHITESPACE = /[\s\p{Z}]+/gu;
const ALLOWED =
  /^[\p{L}\p{N}\p{M}\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Regional_Indicator} ._'’!?&#@+()*~-]+$/u;
const VISIBLE = /[^\p{M} ]/u;

const matcher = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });

export function validateName(input: unknown): NameResult {
  if (typeof input !== "string") return { ok: false, reason: "invalid" };

  const name = input
    .normalize("NFC")
    .replace(WHITESPACE, " ")
    .replace(STRIP, "")
    .normalize("NFC")
    .replace(MARK_RUN, (run) => [...run].slice(0, 2).join(""))
    .replace(WHITESPACE, " ")
    .trim();

  const length = [...name].length;
  if (length < 1 || length > NAME_MAX || !VISIBLE.test(name)) return { ok: false, reason: "invalid" };
  if (!ALLOWED.test(name) || matcher.hasMatch(name)) return { ok: false, reason: "rejected" };

  return { ok: true, name };
}
