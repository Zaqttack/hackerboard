import { Stamp } from "./Stamp.tsx";
import { Tape } from "./Tape.tsx";

type HeroProps = {
  count: number;
  total?: number;
};

export function Hero({ count, total = 50 }: HeroProps) {
  const counter = count >= total ? `FULL HOUSE ${total} / ${total}` : `RECRUITS ${count} / ${total}`;

  return (
    <div
      className="absolute top-16 left-16 z-30 w-[660px] -rotate-[1.5deg] drop-shadow-[0_12px_18px_rgba(40,20,0,0.4)]"
    >
      <div className="torn-bottom bg-paper flex flex-col gap-1.5 px-[52px] pt-11 pb-[60px]">
        <h1 className="font-display m-0 text-[128px] leading-[0.9] font-normal">Hackerboard</h1>
        <p className="font-hand text-string m-0 text-[38px] leading-[1.1] font-bold">
          Scan to join the crew →
        </p>
        <div className="mt-3.5 flex items-center gap-5">
          <Stamp text={counter} />
          <div className="font-stamp text-xl tracking-[3px]">CASE NO. XII</div>
        </div>
      </div>
      <Tape rotate={-4} className="absolute -top-[22px] -left-7 px-[30px] py-2.5 text-[28px]">
        RowdyHacks XII
      </Tape>
    </div>
  );
}
