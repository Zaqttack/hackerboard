import type { CSSProperties } from "react";
import { animalName } from "../shared/animals.ts";
import type { Fill } from "../shared/types.ts";
import { BaublePreview } from "./BaublePreview.tsx";
import { Pushpin } from "./Pushpin.tsx";

type JoinResultProps = {
  kind: "success" | "already";
  name: string;
  emoji: string;
  fill: Fill;
};

export function JoinResult({ kind, name, emoji, fill }: JoinResultProps) {
  const success = kind === "success";

  return (
    <main className="bg-paper shadow-paper relative flex flex-col items-center gap-4 px-5 pt-10 pb-7 text-center">
      <Pushpin size={24} className="-top-[11px] left-1/2 -ml-3" />
      <div className="font-stamp text-string border-string absolute top-[18px] right-3.5 rotate-[8deg] rounded-sm border-[3px] px-2.5 py-[3px] text-lg tracking-[2px]">
        {success ? "RECRUITED" : "ON FILE"}
      </div>

      <div className="relative mt-[18px] h-[150px] w-[150px]">
        {success && (
          <>
            <span
              className="ring-burst border-string absolute -inset-4 rounded-full border-4 border-dashed"
              style={{ "--ring-delay": "150ms" } as CSSProperties}
            />
            <span
              className="ring-burst border-string/40 absolute -inset-[34px] rounded-full border-[3px]"
              style={{ "--ring-delay": "270ms" } as CSSProperties}
            />
          </>
        )}
        <span className="border-ink absolute inset-0 flex items-center justify-center rounded-full border-4 bg-white text-[92px] leading-none shadow-[0_6px_0_rgba(26,26,26,0.2)]">
          {emoji}
        </span>
      </div>

      <h1 className="font-display mt-3.5 mb-0 text-[50px] leading-none font-normal">
        {success ? "You're on the board!" : "Already on the board"}
      </h1>
      <p className="text-ink-soft m-0 text-[19px] leading-[1.35] font-medium">
        {success
          ? `Look up. You're the ${animalName(emoji)} with the red pin.`
          : "One recruit per phone. Find yourself up on the big screen."}
      </p>
      <BaublePreview large name={name} emoji={emoji} fill={fill} />
      <p className="text-ink-soft mt-1.5 mb-0 text-[15px] font-medium">
        {success ? "Animals are random. No swaps, no take-backs." : "Joined from this device a moment ago."}
      </p>
    </main>
  );
}
