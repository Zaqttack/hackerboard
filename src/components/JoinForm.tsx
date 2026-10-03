import type { FormEvent } from "react";
import { NAME_MAX } from "../shared/constants.ts";
import { BaublePreview } from "./BaublePreview.tsx";
import { Pushpin } from "./Pushpin.tsx";
import { TurnstileSlot } from "./TurnstileSlot.tsx";

export type JoinStatus = "idle" | "submitting" | "rejected" | "network" | "unverified";

type JoinFormProps = {
  name: string;
  status: JoinStatus;
  emptyError: boolean;
  verified: boolean;
  resetKey: number;
  onToken: (token: string | null) => void;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
};

export function JoinForm({ name, status, emptyError, verified, resetKey, onToken, onNameChange, onSubmit }: JoinFormProps) {
  const busy = status === "submitting";
  const hasName = name.trim().length > 0;
  const atLimit = name.length >= NAME_MAX;
  const error = emptyError
    ? "We need a name to pin. Anything up to 20 characters."
    : status === "rejected"
      ? "That name didn't get past the bouncer. Try a different one."
      : null;
  const enabled = hasName && verified && status !== "rejected";
  const label = busy ? "Pinning you up…" : status === "network" ? "Try again" : "Pin me to the board";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!hasName || enabled) onSubmit();
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="bg-paper shadow-paper relative flex flex-col gap-4 px-5 pt-[26px] pb-6"
    >
      <Pushpin size={24} className="-top-[11px] left-1/2 -ml-3" />

      {status === "network" && (
        <div role="alert" className="bg-tape border-ink flex flex-col gap-1 rounded-md border-2 px-3.5 py-3">
          <div className="font-stamp text-base tracking-[2px]">NO SIGNAL</div>
          <div className="text-[17px] leading-[1.3] font-medium">
            Couldn't reach the board. Your name is still here, so just try again.
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <h1 className="font-hand m-0 text-[30px] leading-[1.1] font-bold">Join the crew</h1>
        <p className="text-ink-soft m-0 text-lg leading-[1.35] font-medium">Your name goes up on the big screen.</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="hb-name" className="text-lg font-bold">
            Name on the board
          </label>
          <span className={`font-stamp text-base ${atLimit ? "text-string" : "text-ink-soft"}`}>
            {name.length} / {NAME_MAX}
          </span>
        </div>
        <input
          id="hb-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Grace H"
          maxLength={NAME_MAX}
          disabled={busy}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "hb-name-error" : undefined}
          className={`font-hand text-ink box-border h-[60px] rounded-lg bg-white pt-1.5 pr-4 pl-4 text-[26px] font-bold ${
            error ? "border-string border-[3px]" : "border-ink border-2"
          }`}
        />
        {error && (
          <div id="hb-name-error" role="alert" className="text-string flex items-start gap-2 text-[17px] leading-[1.3] font-bold">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#B3261E" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className="mt-px shrink-0">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 5.5v5.5M10 14.2v.3" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {atLimit && !error && (
          <div className="text-ink-soft text-base font-medium">20 characters max. That's the whole bauble.</div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="font-stamp text-ink-soft text-sm tracking-[2px]">PREVIEW</div>
        <BaublePreview name={name.trim()} />
        <div className="text-ink-soft text-[15px] font-medium">Your animal is a surprise.</div>
      </div>

      <div className="flex flex-col gap-2">
        <TurnstileSlot onToken={onToken} resetKey={resetKey} />
        {status === "unverified" && (
          <div role="alert" className="text-string text-[17px] leading-[1.3] font-bold">
            Couldn't verify you're human. Give it another try.
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={busy}
        aria-disabled={!enabled && !busy}
        className={`font-hand border-ink flex h-[62px] items-center justify-center gap-3 rounded-xl border-[3px] pt-1.5 text-[26px] font-bold ${
          enabled || busy ? "bg-string text-paper" : "bg-paper-shade text-ink-soft"
        } ${enabled && !busy ? "shadow-press" : ""}`}
      >
        {busy && (
          <span className="border-paper/35 border-t-paper -mt-1.5 box-border h-[22px] w-[22px] animate-spin rounded-full border-[3px]" />
        )}
        <span>{label}</span>
      </button>
    </form>
  );
}
