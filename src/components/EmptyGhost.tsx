export function EmptyGhost() {
  return (
    <>
      <div className="bg-string shadow-string absolute top-[596px] left-[861px] z-10 h-[5px] w-[988px] origin-[0_50%] -rotate-[33.4deg] rounded-[3px]" />
      <div className="absolute top-[600px] left-[820px] z-20 -rotate-2">
        <div className="ghost-breathe border-ink bg-paper/55 relative flex h-[88px] items-center gap-3.5 rounded-full border-[3px] border-dashed pr-[34px] pl-[7px]">
          <span className="pin absolute -top-3 left-[30px] h-[22px] w-[22px]" />
          <span className="border-ink font-display box-border flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full border-[3px] border-dashed bg-white/70 text-[44px]">
            ?
          </span>
          <span className="font-hand pt-1.5 text-[34px] leading-none font-bold whitespace-nowrap">
            your name here
          </span>
        </div>
      </div>
      <div className="bg-paper absolute top-[760px] left-[900px] z-20 flex rotate-3 flex-col gap-1 px-7 py-[18px] shadow-[0_10px_16px_rgba(40,20,0,0.35)]">
        <div className="font-display text-string text-[52px] leading-none">Be the first recruit.</div>
        <div className="font-hand text-[26px] leading-[1.1] font-bold">Scan the code up top ↗</div>
      </div>
    </>
  );
}
