type BaublePreviewProps = {
  name: string;
  emoji?: string;
};

export function BaublePreview({ name, emoji }: BaublePreviewProps) {
  return (
    <div
      className="border-ink bg-paper relative flex h-[66px] items-center gap-2.5 self-start rounded-full border-[3px] pr-[22px] pl-1.5 shadow-[0_4px_0_rgba(26,26,26,0.2)]"
      style={{ opacity: name ? 1 : 0.6 }}
    >
      <span className="pin absolute -top-[9px] left-[22px] h-4 w-4" />
      <span
        className={`font-display border-ink box-border flex h-[50px] w-[50px] items-center justify-center rounded-full border-[3px] bg-white text-[30px] ${emoji ? "text-[30px]" : "border-dashed"}`}
      >
        {emoji ?? "?"}
      </span>
      <span className="font-hand pt-1 text-2xl leading-none font-bold whitespace-nowrap">
        {name || "your name"}
      </span>
    </div>
  );
}
