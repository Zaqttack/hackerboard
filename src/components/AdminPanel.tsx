import type { FormEvent, ReactNode } from "react";
import type { AdminStats } from "../lib/api.ts";
import { elapsed } from "../lib/format.ts";
import { MAX_RECRUITS } from "../shared/constants.ts";
import { Stamp } from "./Stamp.tsx";
import { Tape } from "./Tape.tsx";

export type AdminStatus = "locked" | "wrong" | "ready" | "confirm" | "wiped";

type AdminPanelProps = {
  status: AdminStatus;
  passphrase: string;
  stats: AdminStats | null;
  busy: boolean;
  offline: boolean;
  onPassphraseChange: (value: string) => void;
  onUnlock: () => void;
  onAskWipe: () => void;
  onCancelWipe: () => void;
  onWipe: () => void;
  onBack: () => void;
};

const STAMPS: Partial<Record<AdminStatus, string>> = {
  wrong: "DENIED",
  ready: "UNLOCKED",
  confirm: "UNLOCKED",
  wiped: "CASE CLOSED",
};

const SECONDARY =
  "font-hand border-ink bg-paper text-ink flex-grow rounded-xl border-[3px] pt-[5px] text-2xl font-bold";
const DANGER =
  "font-hand border-ink bg-string text-paper shadow-press rounded-xl border-[3px] font-bold active:translate-y-1 active:shadow-[0_1px_0_#1a1a1a]";

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-ink flex flex-col gap-0.5 rounded-md border-2 px-[18px] py-3.5">
      <span className="font-stamp text-ink-soft text-[15px] tracking-[2px]">{label}</span>
      <span className="font-hand text-[40px] leading-[1.1] font-bold">{children}</span>
    </div>
  );
}

export function AdminPanel(props: AdminPanelProps) {
  const { status, passphrase, stats, busy, offline, onPassphraseChange } = props;
  const stamp = STAMPS[status];

  const unlock = (event: FormEvent) => {
    event.preventDefault();
    props.onUnlock();
  };

  return (
    <main className="bg-paper relative flex w-[560px] max-w-full flex-col gap-[22px] px-12 pt-[52px] pb-11 shadow-[0_14px_24px_rgba(40,20,0,0.42)]">
      <Tape rotate={-4} className="absolute -top-5 -left-[22px] px-6 py-2 text-[22px]">
        ADMIN · CASE XII
      </Tape>
      {stamp && <Stamp text={stamp} size={22} rotate={7} className="absolute top-[30px] right-[30px] px-3 py-1" />}
      <h1 className="font-display m-0 text-[72px] leading-[0.95] font-normal">Board control</h1>

      {offline && (
        <div role="alert" className="text-string text-[17px] font-bold">
          Couldn't reach the board. Try again.
        </div>
      )}

      {(status === "locked" || status === "wrong") && (
        <form onSubmit={unlock} className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-2">
            <label htmlFor="hb-pass" className="text-lg font-bold">
              Passphrase
            </label>
            <input
              id="hb-pass"
              type="password"
              value={passphrase}
              placeholder="Speak, friend"
              autoComplete="off"
              onChange={(event) => onPassphraseChange(event.target.value)}
              className={`text-ink box-border h-14 rounded-lg bg-white px-4 text-[22px] ${status === "wrong" ? "border-string border-[3px]" : "border-ink border-2"}`}
            />
            {status === "wrong" && (
              <div role="alert" className="text-string text-[17px] font-bold">
                Wrong passphrase. The board stays as it is.
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={busy || passphrase.length === 0}
            className="font-hand border-ink bg-ink text-paper h-14 rounded-xl border-[3px] pt-[5px] text-2xl font-bold disabled:opacity-60"
          >
            Unlock
          </button>
        </form>
      )}

      {status === "ready" && stats && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="ON BOARD">
              {stats.onBoard} / {MAX_RECRUITS}
            </Stat>
            <Stat label="RECRUITED">{stats.recruited}</Stat>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-stamp text-ink-soft text-[15px] tracking-[2px]">EVERYONE, IN ORDER</span>
            {stats.entries.length === 0 ? (
              <p className="text-ink-soft m-0 text-lg font-medium">Nobody yet.</p>
            ) : (
              <ol className="border-ink m-0 max-h-[360px] list-none overflow-y-auto rounded-md border-2 bg-white p-0">
                {stats.entries.map((recruit, index) => {
                  const bumped = index < stats.recruited - stats.onBoard;
                  return (
                    <li
                      key={`${recruit.createdAt}-${index}`}
                      className={`border-ink/15 flex items-center gap-3 border-b px-3 py-1.5 last:border-b-0 ${bumped ? "opacity-50" : ""}`}
                    >
                      <span className="font-stamp text-ink-soft w-9 text-right text-base">{index + 1}</span>
                      <span className="text-2xl leading-none">{recruit.emoji}</span>
                      <span className="font-hand flex-grow pt-1 text-xl leading-none font-bold">{recruit.name}</span>
                      {bumped && <span className="font-stamp text-string text-xs tracking-[1px]">OFF</span>}
                      <span className="font-stamp text-ink-soft text-sm">
                        {elapsed(recruit.createdAt, stats.entries[0].createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          <p className="text-ink-soft m-0 text-lg leading-[1.4] font-medium">
            Wiping clears every bauble and string from the board and lets every phone join again.
          </p>
          <button type="button" onClick={props.onAskWipe} className={`${DANGER} h-16 pt-1.5 text-[28px]`}>
            Wipe the board
          </button>
        </>
      )}

      {status === "confirm" && stats && (
        <div
          role="alertdialog"
          aria-labelledby="hb-confirm"
          className="border-string bg-string-tint flex flex-col gap-3 rounded-lg border-[3px] px-[22px] pt-[22px] pb-5"
        >
          <h2 id="hb-confirm" className="font-hand text-string-dark m-0 text-[30px] leading-[1.1] font-bold">
            Wipe all {stats.onBoard} baubles?
          </h2>
          <p className="m-0 text-lg leading-[1.4] font-medium">
            Everyone comes off the board and the strings go with them. This can't be undone.
          </p>
          <div className="mt-1.5 flex gap-3">
            <button type="button" onClick={props.onCancelWipe} className={`${SECONDARY} h-14`}>
              Keep it
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={props.onWipe}
              className={`${DANGER} h-14 flex-grow pt-[5px] text-2xl`}
            >
              Yes, wipe it
            </button>
          </div>
        </div>
      )}

      {status === "wiped" && (
        <>
          <p className="m-0 text-xl leading-[1.4] font-medium">
            The board is clean. 0 / {MAX_RECRUITS} on board, ready for the next crowd.
          </p>
          <button type="button" onClick={props.onBack} className={`${SECONDARY} h-14`}>
            Back to control
          </button>
        </>
      )}
    </main>
  );
}
