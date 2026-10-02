import { Pushpin } from "./Pushpin.tsx";

export function EmptyGhost() {
  return (
    <>
      <div
        className="bg-string shadow-string absolute z-10 h-[5px] origin-left rounded-[3px]"
        style={{ left: 861, top: 596, width: 988, transform: "rotate(-33.4deg)" }}
      />
      <div
        className="anim-breathe border-ink absolute z-20 box-border flex h-[88px] -rotate-2 items-center gap-3.5 rounded-full border-[3px] border-dashed bg-paper/55 pr-[34px] pl-[7px]"
        style={{ left: 820, top: 600 }}
      >
        <Pushpin className="-top-3 left-[30px]" />
        <span className="font-display border-ink box-border flex h-[68px] w-[68px] items-center justify-center rounded-full border-[3px] border-dashed bg-white/70 text-[44px]">
          ?
        </span>
        <span className="pt-1.5 text-[34px] leading-none font-bold whitespace-nowrap">
          your name here
        </span>
      </div>
      <div
        className="bg-paper absolute z-20 flex rotate-3 flex-col gap-1 px-7 py-[18px] shadow-[0_10px_16px_rgba(40,20,0,0.35)]"
        style={{ left: 900, top: 760 }}
      >
        <div className="font-display text-string text-[52px] leading-none">Be the first recruit.</div>
        <div className="text-[26px] leading-[1.1]">Scan the code up top ↗</div>
      </div>
    </>
  );
}
