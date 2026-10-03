import type { CSSProperties, Ref } from "react";
import type { Fill } from "../shared/types.ts";

const FILL_CLASS: Record<Fill, string> = {
  paper: "bg-bauble-paper",
  tape: "bg-bauble-tape",
  manila: "bg-bauble-manila",
  carbon: "bg-bauble-carbon",
  memo: "bg-bauble-memo",
  mint: "bg-bauble-mint",
};

type BaubleProps = {
  name: string;
  emoji: string;
  fill: Fill;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  isNew?: boolean;
  leaving?: boolean;
  ref?: Ref<HTMLDivElement>;
};

export function Bauble({ name, emoji, fill, x = 0, y = 0, scale = 1, rotation = 0, isNew = false, leaving = false, ref }: BaubleProps) {
  return (
    <div
      ref={ref}
      className={`absolute top-0 left-0 w-max origin-[44px_44px] ${isNew ? "arrive-drop z-40" : "z-20"} ${leaving ? "bauble-leave" : ""}`}
      style={{ transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})` }}
    >
      {isNew && (
        <>
          <span
            className="ring-burst border-string pointer-events-none absolute -inset-[18px] rounded-[62px] border-4 border-dashed"
            style={{ "--ring-delay": "300ms" } as CSSProperties}
          />
          <span
            className="ring-burst pointer-events-none absolute -inset-10 rounded-[84px] border-[3px] border-string/45"
            style={{ "--ring-delay": "420ms" } as CSSProperties}
          />
          <span className="arrive-stamp font-stamp text-string border-string bg-paper pointer-events-none absolute top-[-80px] left-24 -rotate-6 rounded-sm border-[3px] px-3 py-1 text-[22px] tracking-[2px] whitespace-nowrap">
            NEW RECRUIT
          </span>
        </>
      )}
      <div
        className={`shadow-bauble border-ink relative flex h-[88px] items-center gap-3.5 rounded-full border-[3px] pr-[30px] pl-[7px] ${FILL_CLASS[fill]} ${isNew ? "arrive-squash" : ""}`}
      >
        <span className={`pin absolute -top-3 left-[30px] h-[22px] w-[22px] ${isNew ? "arrive-pin" : ""}`} />
        <span className="border-ink box-border flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full border-[3px] bg-white text-[42px] leading-none">
          {emoji}
        </span>
        <span className="font-hand pt-1.5 text-[34px] leading-none font-bold whitespace-nowrap">
          {name}
        </span>
      </div>
    </div>
  );
}
