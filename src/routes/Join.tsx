import { useEffect, useState } from "react";
import { JoinForm, type JoinStatus } from "../components/JoinForm.tsx";
import { JoinResult } from "../components/JoinResult.tsx";
import { Tape } from "../components/Tape.tsx";
import { fetchMe, NetworkError, signUp } from "../lib/api.ts";
import { animalName } from "../shared/animals.ts";
import { NAME_MAX } from "../shared/constants.ts";
import type { Entry } from "../shared/types.ts";

const STORAGE_KEY = "hackerboard:entry";

function readStored(): Entry | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Entry) : null;
  } catch {
    return null;
  }
}

function writeStored(entry: Entry | null) {
  try {
    if (entry) localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage can be blocked; joining still works
  }
}

type Phase = "checking" | "form" | "success" | "already";

export function Join() {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined;

  const [phase, setPhase] = useState<Phase>("checking");
  const [entry, setEntry] = useState<Entry | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<JoinStatus>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const stored = readStored();
    if (!stored) {
      setPhase("form");
      return;
    }

    fetchMe(stored.id)
      .then((current) => {
        if (current) {
          setEntry(current);
          setPhase("already");
        } else {
          writeStored(null);
          setPhase("form");
        }
      })
      .catch(() => setPhase("form"));
  }, []);

  const onNameChange = (value: string) => {
    setName(value.slice(0, NAME_MAX));
    setStatus("typing");
  };

  const onSubmit = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setStatus("empty");
      return;
    }

    setStatus("submitting");
    try {
      const result = await signUp(trimmed, token);
      switch (result.kind) {
        case "ok":
          writeStored(result.entry);
          setEntry(result.entry);
          setPhase("success");
          break;
        case "invalid":
          setStatus("empty");
          break;
        case "rejected":
          setStatus("rejected");
          break;
        case "turnstile":
          setToken(null);
          setResetKey((key) => key + 1);
          setStatus("unverified");
          break;
      }
    } catch (error) {
      if (error instanceof NetworkError) setStatus("network");
      else throw error;
    }
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

        {phase === "form" && (
          <JoinForm
            name={name}
            status={status}
            verified={!siteKey || token !== null}
            siteKey={siteKey}
            resetKey={resetKey}
            onToken={setToken}
            onNameChange={onNameChange}
            onSubmit={onSubmit}
          />
        )}
        {(phase === "success" || phase === "already") && entry && (
          <JoinResult
            kind={phase}
            name={entry.name}
            emoji={entry.emoji}
            animalName={animalName(entry.emoji)}
          />
        )}
      </div>
    </div>
  );
}
