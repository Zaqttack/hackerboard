import { formatElapsed } from "../lib/format.ts";
import type { Entry } from "../shared/types.ts";

type AdminListProps = {
  entries: Entry[];
  offCount: number;
};

export function AdminList({ entries, offCount }: AdminListProps) {
  if (entries.length === 0) {
    return <p className="text-ink-soft m-0 text-lg font-medium">Nobody has joined yet.</p>;
  }

  const first = entries[0].createdAt;

  return (
    <ol
      tabIndex={0}
      aria-label="Everyone who joined, in join order"
      className="divide-paper-shade border-ink m-0 max-h-[320px] list-none divide-y overflow-y-auto rounded-md border-2 bg-white p-0"
    >
      {entries.map((entry, index) => {
        const off = index < offCount;
        const dim = off ? "opacity-50" : "";
        return (
          <li key={entry.id} className="flex items-center gap-3 px-3 py-2">
            <span className={`font-stamp text-ink-soft w-9 shrink-0 text-right text-sm ${dim}`}>{index + 1}</span>
            <span className={`text-2xl leading-none ${dim}`}>{entry.emoji}</span>
            <span className={`font-hand min-w-0 flex-1 truncate pt-1 text-[22px] leading-none font-bold ${dim}`}>
              {entry.name}
            </span>
            {off && (
              <span className="font-stamp text-string border-string rounded-sm border-2 px-1.5 text-xs tracking-[2px]">
                OFF
              </span>
            )}
            <span className={`font-stamp text-ink-soft shrink-0 text-sm tabular-nums ${dim}`}>
              {formatElapsed(entry.createdAt - first)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
