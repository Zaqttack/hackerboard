type JoinResultProps = {
  kind: "success" | "already";
  name: string;
  emoji: string;
  animalName?: string;
};

export function JoinResult({ kind, name, emoji, animalName }: JoinResultProps) {
  const success = kind === "success";

  return (
    <div className="bg-paper relative flex flex-col items-center gap-4 px-5 pt-10 pb-7 text-center shadow-[0_12px_20px_rgba(40,20,0,0.4)]">
      <span className="pin absolute -top-[11px] left-1/2 -ml-3 h-6 w-6" />
      <div className="font-stamp text-string border-string absolute top-[18px] right-3.5 rotate-[8deg] rounded-sm border-[3px] px-2.5 py-[3px] text-lg tracking-[2px]">
        {success ? "RECRUITED" : "ON FILE"}
      </div>

      <div className="relative mt-[18px] h-[150px] w-[150px]">
        {success && (
          <>
            <span className="anim-ring-1 border-string absolute -inset-4 rounded-full border-4 border-dashed" />
            <span className="anim-ring-2 border-string/40 absolute -inset-[34px] rounded-full border-[3px]" />
          </>
        )}
        <span className="border-ink absolute inset-0 flex items-center justify-center rounded-full border-4 bg-white text-[92px] leading-none shadow-[0_6px_0_rgba(26,26,26,0.2)]">
          {emoji}
        </span>
      </div>

      <h1 className="font-display m-0 mt-3.5 text-[50px] leading-none font-normal">
        {success ? "You're on the board!" : "Already on the board"}
      </h1>
      <p className="text-ink-soft m-0 text-[19px] leading-[1.35] font-medium">
        {success
          ? `Look up. You're the ${animalName ?? "animal"} with the red pin.`
          : "One recruit per phone. Find yourself up on the big screen."}
      </p>

      <div className="bg-tape border-ink relative mt-1.5 flex h-[76px] -rotate-2 items-center gap-3 rounded-full border-[3px] pr-[26px] pl-1.5 shadow-[0_5px_0_rgba(26,26,26,0.2)]">
        <span className="pin absolute -top-2.5 left-[26px] h-[18px] w-[18px]" />
        <span className="border-ink box-border flex h-[60px] w-[60px] items-center justify-center rounded-full border-[3px] bg-white text-4xl">
          {emoji}
        </span>
        <span className="font-hand pt-[5px] text-[28px] leading-none font-bold">{name}</span>
      </div>

      <p className="text-ink-soft m-0 mt-1.5 text-[15px] font-medium">
        {success ? "Animals are random. No swaps, no take-backs." : "Joined from this device a moment ago."}
      </p>
    </div>
  );
}
