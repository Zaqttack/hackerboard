import { useState, type FormEvent } from "react";
import { AdminList } from "../components/AdminList.tsx";
import { Stamp } from "../components/Stamp.tsx";
import { Tape } from "../components/Tape.tsx";
import { adminStats, adminWipe, type AdminOutcome, type AdminStats } from "../lib/api.ts";
import { MAX_RECRUITS } from "../shared/constants.ts";

type View = "locked" | "ready" | "confirm" | "wiped";
type Problem = { kind: "wrong" } | { kind: "locked"; minutes: number } | { kind: "network" };

const EMPTY: AdminStats = { onBoard: 0, recruited: 0, entries: [] };

const BUTTON = "font-hand border-ink flex items-center justify-center rounded-xl border-[3px] pt-1.5 font-bold disabled:opacity-60";

function message(problem: Problem): string {
  switch (problem.kind) {
    case "wrong":
      return "Wrong passphrase. The board stays as it is.";
    case "locked":
      return `Too many wrong tries from this network. Locked out for about ${problem.minutes} more ${problem.minutes === 1 ? "minute" : "minutes"}.`;
    case "network":
      return "Couldn't reach the board. Check the connection and try again.";
  }
}

function confirmTitle(onBoard: number): string {
  if (onBoard === 0) return "Wipe the board?";
  return onBoard === 1 ? "Wipe the 1 bauble?" : `Wipe all ${onBoard} baubles?`;
}

export function Admin() {
  const [view, setView] = useState<View>("locked");
  const [input, setInput] = useState("");
  const [secret, setSecret] = useState("");
  const [stats, setStats] = useState<AdminStats>(EMPTY);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = (outcome: Exclude<AdminOutcome<unknown>, { kind: "ok" }>) => {
    setProblem(outcome);
    if (outcome.kind === "wrong") {
      setView("locked");
      setSecret("");
    }
  };

  const unlock = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !input) return;
    setBusy(true);
    setProblem(null);
    const outcome = await adminStats(input);
    setBusy(false);
    if (outcome.kind !== "ok") return fail(outcome);
    setSecret(input);
    setInput("");
    setStats(outcome.data);
    setView("ready");
  };

  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    setProblem(null);
    const outcome = await adminStats(secret);
    setBusy(false);
    if (outcome.kind !== "ok") return fail(outcome);
    setStats(outcome.data);
  };

  const wipe = async () => {
    if (busy) return;
    setBusy(true);
    setProblem(null);
    const outcome = await adminWipe(secret);
    setBusy(false);
    if (outcome.kind !== "ok") return fail(outcome);
    setStats(EMPTY);
    setView("wiped");
  };

  const stamp =
    problem?.kind === "wrong"
      ? "DENIED"
      : problem?.kind === "locked"
        ? "LOCKED OUT"
        : view === "ready" || view === "confirm"
          ? "UNLOCKED"
          : view === "wiped"
            ? "CASE CLOSED"
            : null;

  const alert = problem && (
    <div role="alert" className="text-string text-[17px] leading-[1.3] font-bold">
      {message(problem)}
    </div>
  );

  return (
    <div className="cork flex min-h-dvh items-center justify-center px-4 py-10">
      <main className="bg-paper relative flex w-[560px] max-w-full flex-col gap-[22px] px-6 pt-[52px] pb-11 shadow-[0_14px_24px_rgba(40,20,0,0.42)] sm:px-12">
        <Tape rotate={-4} className="absolute -top-5 -left-1 px-4 py-2 text-base sm:-left-[22px] sm:px-6 sm:text-[22px]">
          ADMIN · CASE XII
        </Tape>
        {stamp && <Stamp text={stamp} rotate={7} size={22} className="absolute top-2 right-2 sm:top-[30px] sm:right-[30px]" />}
        <h1 className="font-display m-0 text-[52px] leading-[0.95] font-normal sm:text-[72px]">Board control</h1>

        {view === "locked" && (
          <form onSubmit={unlock} className="flex flex-col gap-[22px]">
            <div className="flex flex-col gap-2">
              <label htmlFor="hb-pass" className="text-lg font-bold">
                Passphrase
              </label>
              <input
                id="hb-pass"
                type="password"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setProblem(null);
                }}
                placeholder="Speak, friend"
                autoComplete="off"
                disabled={busy}
                aria-invalid={problem?.kind === "wrong" ? true : undefined}
                className={`font-body text-ink box-border h-14 rounded-lg bg-white px-4 text-[22px] ${
                  problem?.kind === "wrong" ? "border-string border-[3px]" : "border-ink border-2"
                }`}
              />
              {alert}
            </div>
            <button type="submit" disabled={busy || !input} className={`${BUTTON} bg-ink text-paper h-14 text-2xl`}>
              {busy ? "Checking…" : "Unlock"}
            </button>
          </form>
        )}

        {view === "ready" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-ink flex flex-col gap-0.5 rounded-md border-2 px-[18px] py-3.5">
                <span className="font-stamp text-ink-soft text-[15px] tracking-[2px]">ON BOARD</span>
                <span className="font-hand text-[40px] leading-[1.1] font-bold">
                  {stats.onBoard} / {MAX_RECRUITS}
                </span>
              </div>
              <div className="border-ink flex flex-col gap-0.5 rounded-md border-2 px-[18px] py-3.5">
                <span className="font-stamp text-ink-soft text-[15px] tracking-[2px]">RECRUITED</span>
                <span className="font-hand text-[40px] leading-[1.1] font-bold">{stats.recruited}</span>
              </div>
            </div>
            <p className="text-ink-soft m-0 text-lg leading-[1.4] font-medium">
              Wiping clears every bauble and string from the board and lets every phone join again.
            </p>
            <button
              type="button"
              onClick={() => {
                setProblem(null);
                setView("confirm");
              }}
              className={`${BUTTON} bg-string text-paper shadow-press h-16 text-[28px]`}
            >
              Wipe the board
            </button>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <h2 className="font-stamp text-ink-soft m-0 text-[15px] tracking-[2px] font-normal">JOIN ORDER</h2>
                <button
                  type="button"
                  onClick={refresh}
                  disabled={busy}
                  className="font-body text-ink-soft text-base font-bold underline disabled:opacity-60"
                >
                  {busy ? "Refreshing…" : "Refresh"}
                </button>
              </div>
              {alert}
              <AdminList entries={stats.entries} offCount={stats.recruited - stats.onBoard} />
            </div>
          </>
        )}

        {view === "confirm" && (
          <div
            role="alertdialog"
            aria-labelledby="hb-confirm"
            className="border-string bg-string-tint flex flex-col gap-3 rounded-lg border-[3px] px-[22px] pt-[22px] pb-5"
          >
            <h2 id="hb-confirm" className="font-hand text-string-dark m-0 text-[30px] leading-[1.1] font-bold">
              {confirmTitle(stats.onBoard)}
            </h2>
            <p className="m-0 text-lg leading-[1.4] font-medium">
              Everyone comes off the board and the strings go with them. This can't be undone.
            </p>
            {alert}
            <div className="mt-1.5 flex gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setProblem(null);
                  setView("ready");
                }}
                disabled={busy}
                className={`${BUTTON} bg-paper text-ink h-14 grow text-2xl`}
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={wipe}
                disabled={busy}
                className={`${BUTTON} bg-string text-paper shadow-press h-14 grow text-2xl`}
              >
                {busy ? "Wiping…" : "Yes, wipe it"}
              </button>
            </div>
          </div>
        )}

        {view === "wiped" && (
          <>
            <p className="m-0 text-xl leading-[1.4] font-medium">
              The board is clean. 0 / {MAX_RECRUITS} on board, ready for the next crowd.
            </p>
            <button
              type="button"
              onClick={() => {
                setProblem(null);
                setView("ready");
              }}
              className={`${BUTTON} bg-paper text-ink h-14 text-2xl`}
            >
              Back to control
            </button>
          </>
        )}
      </main>
    </div>
  );
}
