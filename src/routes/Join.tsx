import { useState } from "react";
import { JoinForm, type JoinStatus } from "../components/JoinForm.tsx";
import { JoinResult } from "../components/JoinResult.tsx";
import { Tape } from "../components/Tape.tsx";
import { NAME_MAX } from "../shared/constants.ts";

type Preview = { name: string; status: JoinStatus; result: "success" | "already" | null; empty: boolean };

function devPreview(): Preview {
  const base: Preview = { name: "", status: "idle", result: null, empty: false };
  if (!import.meta.env.DEV) return base;
  switch (new URLSearchParams(window.location.search).get("state")) {
    case "typing":
      return { ...base, name: "Grace H" };
    case "empty":
      return { ...base, empty: true };
    case "long":
      return { ...base, name: "Bartholomew Castillo" };
    case "submitting":
      return { ...base, name: "Grace H", status: "submitting" };
    case "rejected":
      return { ...base, name: "B0ss Hacker 69", status: "rejected" };
    case "network":
      return { ...base, name: "Grace H", status: "network" };
    case "success":
      return { ...base, name: "Grace H", result: "success" };
    case "already":
      return { ...base, name: "Grace H", result: "already" };
    default:
      return base;
  }
}

export function Join() {
  const [initial] = useState(devPreview);
  const [name, setName] = useState(initial.name);
  const [status, setStatus] = useState(initial.status);
  const [emptyError, setEmptyError] = useState(initial.empty);

  const onNameChange = (value: string) => {
    setName(value.slice(0, NAME_MAX));
    setEmptyError(false);
    if (status === "rejected") setStatus("idle");
  };

  const onSubmit = () => {
    if (!name.trim()) setEmptyError(true);
  };

  return (
    <div className="cork flex min-h-dvh flex-col items-center px-4 pt-7 pb-6">
      <div className="flex w-full max-w-[440px] flex-col gap-[18px]">
        <header className="flex flex-col items-start gap-0.5 px-2">
          <Tape rotate={-3} className="px-[18px] py-1.5 text-[17px]">
            RowdyHacks XII
          </Tape>
          <div className="font-display text-[60px] leading-none">Hackerboard</div>
        </header>
        {initial.result ? (
          <JoinResult kind={initial.result} name={name} emoji="🐼" fill="tape" />
        ) : (
          <JoinForm
            name={name}
            status={status}
            emptyError={emptyError}
            onNameChange={onNameChange}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </div>
  );
}
