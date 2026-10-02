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
  scale?: number;
  rotation?: number;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
};

export function Bauble({ name, emoji, fill, scale = 1, rotation = 0, style, ref }: BaubleProps) {
  return (
    <div
      ref={ref}
      className={`shadow-bauble border-ink relative flex h-[88px] items-center gap-3.5 rounded-full border-[3px] pr-[30px] pl-[7px] ${FILL_CLASS[fill]}`}
      style={{
        transformOrigin: "44px 44px",
        transform: `rotate(${rotation}deg) scale(${scale})`,
        ...style,
      }}
    >
      <span className="pin absolute -top-3 left-[30px] h-[22px] w-[22px]" />
      <span className="border-ink box-border flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full border-[3px] bg-white text-[42px] leading-none">
        {emoji}
      </span>
      <span className="font-hand pt-1.5 text-[34px] leading-none font-bold whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}
