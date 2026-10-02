import { useEffect, useRef, useState } from "react";
import { fetchWall } from "../lib/api.ts";
import { type Placed, place } from "../lib/place.ts";
import type { Entry } from "../shared/types.ts";

const POLL_MS = 4000;
const STAGGER_MS = 350;
const NEW_MS = 2800;
const FADE_MS = 400;

export function useWall() {
  const [shown, setShown] = useState<Placed[]>([]);
  const [leaving, setLeaving] = useState<Placed[]>([]);
  const [newIds, setNewIds] = useState<ReadonlySet<string>>(new Set());
  const shownRef = useRef<Placed[]>([]);
  const knownRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timers = new Set<number>();

    const later = (fn: () => void, ms: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);
      timers.add(timer);
    };

    const commit = (next: Placed[]) => {
      shownRef.current = next;
      setShown(next);
    };

    const apply = (wall: Entry[]) => {
      const ids = new Set(wall.map((entry) => entry.id));
      const known = knownRef.current;

      if (known === null) {
        let placed: Placed[] = [];
        for (const entry of wall) placed = [...placed, place(entry, placed, wall.length)];
        commit(placed);
        knownRef.current = ids;
        return;
      }

      const gone = shownRef.current.filter((p) => !ids.has(p.entry.id));
      if (gone.length > 0) {
        commit(shownRef.current.filter((p) => ids.has(p.entry.id)));
        setLeaving((list) => [...list, ...gone]);
        later(() => setLeaving((list) => list.filter((p) => !gone.includes(p))), FADE_MS);
      }

      wall
        .filter((entry) => !known.has(entry.id))
        .forEach((entry, index) => {
          later(() => {
            const current = shownRef.current;
            commit([...current, place(entry, current, current.length + 1)]);
            setNewIds((set) => new Set(set).add(entry.id));
            later(
              () =>
                setNewIds((set) => {
                  const next = new Set(set);
                  next.delete(entry.id);
                  return next;
                }),
              NEW_MS,
            );
          }, index * STAGGER_MS);
        });

      knownRef.current = ids;
    };

    const tick = async () => {
      try {
        const wall = await fetchWall();
        if (!cancelled) apply(wall);
      } catch {
        // keep the last known board and try again on the next tick
      }
      if (!cancelled) later(tick, POLL_MS);
    };

    void tick();

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);

  return { shown, leaving, newIds };
}
