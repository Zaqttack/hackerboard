import { useState } from "react";
import { JoinForm, type JoinStatus, NAME_MAX } from "../components/JoinForm.tsx";
import { JoinResult } from "../components/JoinResult.tsx";
import { Tape } from "../components/Tape.tsx";

export function Join() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<JoinStatus>("idle");

  const screen = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("screen") : null;

  const onNameChange = (value: string) => {
    setName(value.slice(0, NAME_MAX));
    setStatus("typing");
  };

  const onSubmit = () => {
    if (name.trim().length === 0) setStatus("empty");
  };

  return (
    <div className="cork min-h-screen px-4 pt-7 pb-6">
      <div className="mx-auto flex w-full max-w-[440px] flex-col gap-[18px]">
        <header className="flex flex-col items-start gap-0.5 px-2">
          <Tape rotate={-3} className="px-[18px] py-1.5 text-[17px]">
            RowdyHacks XII
          </Tape>
          <div className="font-display text-[60px] leading-none">Hackerboard</div>
        </header>

        {screen === "success" || screen === "already" ? (
          <JoinResult kind={screen} name="Grace H" emoji="🐼" animalName="panda" />
        ) : (
          <JoinForm
            name={name}
            status={status}
            verified={status !== "idle"}
            onNameChange={onNameChange}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </div>
  );
}
