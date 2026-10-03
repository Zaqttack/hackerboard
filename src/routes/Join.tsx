import { useEffect, useState } from "react";
import { JoinForm, type JoinStatus } from "../components/JoinForm.tsx";
import { JoinResult } from "../components/JoinResult.tsx";
import { Tape } from "../components/Tape.tsx";
import { fetchMe, signUp } from "../lib/api.ts";
import { NAME_MAX } from "../shared/constants.ts";
import type { Entry } from "../shared/types.ts";

const STORAGE_KEY = "hackerboard:entry";

function storedId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function remember(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage can be blocked; the join still works
  }
}

type Phase =
  | { kind: "checking" }
  | { kind: "form" }
  | { kind: "result"; result: "success" | "already"; entry: Entry };

export function Join() {
  const [phase, setPhase] = useState<Phase>(() => (storedId() ? { kind: "checking" } : { kind: "form" }));
  const [name, setName] = useState("");
  const [status, setStatus] = useState<JoinStatus>("idle");
  const [emptyError, setEmptyError] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const id = storedId();
    if (!id) return;
    let cancelled = false;
    fetchMe(id).then(
      (me) => {
        if (cancelled) return;
        if (me?.onBoard) {
          setPhase({ kind: "result", result: "already", entry: me });
        } else {
          remember(null);
          setPhase({ kind: "form" });
        }
      },
      () => {
        if (!cancelled) setPhase({ kind: "form" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const onNameChange = (value: string) => {
    setName(value.slice(0, NAME_MAX));
    setEmptyError(false);
    if (status === "rejected") setStatus("idle");
  };

  const onSubmit = async () => {
    if (!name.trim()) {
      setEmptyError(true);
      return;
    }
    if (token === null || status === "submitting") return;

    setEmptyError(false);
    setStatus("submitting");
    const outcome = await signUp(name, token);
    switch (outcome.kind) {
      case "ok":
        remember(outcome.entry.id);
        setPhase({ kind: "result", result: "success", entry: outcome.entry });
        return;
      case "invalid":
        setEmptyError(true);
        setStatus("idle");
        return;
      case "unverified":
        setToken(null);
        setResetKey((k) => k + 1);
        setStatus("unverified");
        return;
      default:
        setStatus(outcome.kind === "rejected" ? "rejected" : "network");
    }
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
        {phase.kind === "result" && (
          <JoinResult kind={phase.result} name={phase.entry.name} emoji={phase.entry.emoji} fill={phase.entry.fill} />
        )}
        {phase.kind === "form" && (
          <JoinForm
            name={name}
            status={status}
            emptyError={emptyError}
            verified={token !== null}
            resetKey={resetKey}
            onToken={setToken}
            onNameChange={onNameChange}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </div>
  );
}
