import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error("turnstile"));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

type TurnstileSlotProps = {
  onToken: (token: string | null) => void;
  resetKey: number;
};

export function TurnstileSlot({ onToken, resetKey }: TurnstileSlotProps) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) {
      onTokenRef.current("");
      return;
    }
    let cancelled = false;
    loadTurnstile().then(
      (api) => {
        if (cancelled || !container.current) return;
        widget.current = api.render(container.current, {
          sitekey: SITE_KEY,
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
        setState("ready");
      },
      () => {
        if (!cancelled) setState("failed");
      },
    );
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey === 0) return;
    if (!SITE_KEY) onTokenRef.current("");
    else if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  if (!SITE_KEY) {
    return (
      <div className="font-body box-border flex h-[65px] w-[300px] max-w-full items-center gap-3 rounded-sm border border-[#bdb7aa] bg-[#fafaf7] px-3.5">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#2f6b3a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="13" cy="13" r="11" />
          <path d="M8 13.5l3.5 3.5L18.5 9.5" />
        </svg>
        <span className="text-success text-base font-bold">Verified</span>
      </div>
    );
  }

  return (
    <div className="relative h-[65px] w-[300px] max-w-full">
      {state !== "ready" && (
        <div className="font-body box-border absolute inset-0 flex items-center gap-3 rounded-sm border border-[#bdb7aa] bg-[#fafaf7] px-3.5">
          {state === "loading" ? (
            <>
              <span className="border-t-ink-soft box-border h-[22px] w-[22px] animate-spin rounded-full border-[3px] border-[#d8d3c7]" />
              <span className="text-ink-soft text-base font-medium">Verifying you're human…</span>
            </>
          ) : (
            <span className="text-string text-base font-bold">Couldn't load the check. Reload the page.</span>
          )}
        </div>
      )}
      <div ref={container} className="h-[65px] w-[300px]" />
    </div>
  );
}
