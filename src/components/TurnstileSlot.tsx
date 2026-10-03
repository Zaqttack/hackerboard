export function TurnstileSlot({ verified = true }: { verified?: boolean }) {
  return (
    <div className="font-body box-border flex h-[65px] w-[300px] max-w-full items-center gap-3 rounded-sm border border-[#bdb7aa] bg-[#fafaf7] px-3.5">
      {verified ? (
        <>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#2f6b3a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="13" cy="13" r="11" />
            <path d="M8 13.5l3.5 3.5L18.5 9.5" />
          </svg>
          <span className="text-success text-base font-bold">Verified</span>
        </>
      ) : (
        <>
          <span className="box-border h-[22px] w-[22px] animate-spin rounded-full border-[3px] border-[#d8d3c7] border-t-ink-soft" />
          <span className="text-ink-soft text-base font-medium">Verifying you're human…</span>
        </>
      )}
    </div>
  );
}
