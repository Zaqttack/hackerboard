import { useEffect, useRef } from "react";

type TurnstileApi = {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoad: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  scriptLoad ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoad = null;
      reject(new Error("turnstile failed to load"));
    };
    document.head.append(script);
  });
  return scriptLoad;
}

type TurnstileSlotProps = {
  siteKey?: string;
  verified: boolean;
  onToken: (token: string | null) => void;
  resetKey: number;
};

export function TurnstileSlot({ siteKey, verified, onToken, resetKey }: TurnstileSlotProps) {
  const container = useRef<HTMLDivElement>(null);
  const latestOnToken = useRef(onToken);
  latestOnToken.current = onToken;

  useEffect(() => {
    if (!siteKey || !container.current) return;

    let cancelled = false;
    let widgetId: string | undefined;

    loadTurnstile()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          callback: (token: string) => latestOnToken.current(token),
          "expired-callback": () => latestOnToken.current(null),
          "error-callback": () => latestOnToken.current(null),
        });
      })
      .catch(() => latestOnToken.current(null));

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, resetKey]);

  if (siteKey) return <div ref={container} className="h-[65px] w-[300px]" />;

  return (
    <div className="box-border flex h-[65px] w-[300px] items-center gap-3 rounded-sm border border-[#bdb7aa] bg-[#fafaf7] px-3.5">
      {verified ? (
        <>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#2F6B3A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="13" cy="13" r="11" />
            <path d="M8 13.5l3.5 3.5L18.5 9.5" />
          </svg>
          <span className="text-success text-base font-bold">Verified</span>
        </>
      ) : (
        <>
          <span className="border-t-ink-soft box-border h-[22px] w-[22px] rounded-full border-[3px] border-[#d8d3c7]" />
          <span className="text-ink-soft text-base font-medium">Verifying you're human…</span>
        </>
      )}
    </div>
  );
}
