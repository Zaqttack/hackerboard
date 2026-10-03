import type { Fill } from "../shared/types.ts";

const FILL_CLASS: Record<Fill, string> = {
  paper: "bg-bauble-paper",
  tape: "bg-bauble-tape",
  manila: "bg-bauble-manila",
  carbon: "bg-bauble-carbon",
  memo: "bg-bauble-memo",
  mint: "bg-bauble-mint",
};

type BaublePreviewProps = {
  name: string;
  emoji?: string;
  fill?: Fill;
  large?: boolean;
};

export function BaublePreview({ name, emoji, fill = "paper", large = false }: BaublePreviewProps) {
  const size = large
    ? {
        pill: "h-[76px] gap-3 rounded-full pr-[26px] pl-1.5 shadow-[0_5px_0_rgba(26,26,26,0.2)] -rotate-2 mt-1.5",
        pin: "left-[26px] -top-2.5 h-[18px] w-[18px]",
        coin: "h-[60px] w-[60px] text-[36px]",
        text: "text-[28px] pt-[5px]",
      }
    : {
        pill: "h-[66px] gap-2.5 rounded-full pr-[22px] pl-1.5 shadow-[0_4px_0_rgba(26,26,26,0.2)]",
        pin: "left-[22px] -top-[9px] h-4 w-4",
        coin: "h-[50px] w-[50px] text-[30px]",
        text: "text-2xl pt-1",
      };

  return (
    <div
      className={`border-ink relative flex items-center self-start border-[3px] ${FILL_CLASS[fill]} ${size.pill} ${name ? "" : "opacity-60"}`}
    >
      <span className={`pin absolute ${size.pin}`} />
      <span
        className={`border-ink font-display box-border flex shrink-0 items-center justify-center rounded-full border-[3px] bg-white ${size.coin} ${emoji ? "" : "border-dashed"}`}
      >
        {emoji ?? "?"}
      </span>
      <span className={`font-hand leading-none font-bold whitespace-nowrap ${size.text}`}>{name || "your name"}</span>
    </div>
  );
}
