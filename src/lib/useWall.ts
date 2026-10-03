import { useEffect, useRef, useState } from "react";
import type { Entry } from "../shared/types.ts";
import { fetchWall } from "./api.ts";

export type WallItem = { entry: Entry; status: "arriving" | "steady" | "leaving" };

const POLL_MS = 4000;
const STAGGER_MS = 350;
const ARRIVAL_MS = 3000;
const FADE_MS = 400;

export function useWall() {
  const [items, setItems] = useState<WallItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const known = useRef(new Set<string>());
  const pending = useRef(new Map<string, number>());
  const nextSlot = useRef(0);
  const firstLoad = useRef(true);

  useEffect(() => {
    let stopped = false;
    let poll = 0;
    const controller = new AbortController();
    const timers = new Set<number>();

    const later = (ms: number, fn: () => void) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);
      timers.add(timer);
      return timer;
    };

    const apply = (list: Entry[]) => {
      const ids = new Set(list.map((entry) => entry.id));

      if (firstLoad.current) {
        firstLoad.current = false;
        known.current = new Set(ids);
        setItems(list.map((entry) => ({ entry, status: "steady" })));
        setLoaded(true);
        return;
      }

      const fresh = list.filter((entry) => !known.current.has(entry.id));
      const gone = [...known.current].filter((id) => !ids.has(id));
      known.current = new Set(ids);

      for (const id of gone) {
        const timer = pending.current.get(id);
        if (timer !== undefined) {
          window.clearTimeout(timer);
          timers.delete(timer);
          pending.current.delete(id);
        }
      }

      if (gone.length > 0) {
        const leaving = new Set(gone);
        setItems((prev) => prev.map((item) => (leaving.has(item.entry.id) ? { ...item, status: "leaving" } : item)));
        later(FADE_MS, () => setItems((prev) => prev.filter((item) => !(leaving.has(item.entry.id) && item.status === "leaving"))));
      }

      for (const entry of fresh) {
        const slot = Math.max(Date.now(), nextSlot.current);
        nextSlot.current = slot + STAGGER_MS;
        const timer = later(slot - Date.now(), () => {
          pending.current.delete(entry.id);
          setItems((prev) => (prev.some((item) => item.entry.id === entry.id) ? prev : [...prev, { entry, status: "arriving" }]));
          later(ARRIVAL_MS, () =>
            setItems((prev) => prev.map((item) => (item.entry.id === entry.id && item.status === "arriving" ? { ...item, status: "steady" } : item))),
          );
        });
        pending.current.set(entry.id, timer);
      }
    };

    const tick = async () => {
      try {
        const list = await fetchWall(controller.signal);
        if (!stopped) apply(list);
      } catch {
        // keep the last known board
      }
      if (!stopped) poll = window.setTimeout(tick, POLL_MS);
    };
    void tick();

    return () => {
      stopped = true;
      window.clearTimeout(poll);
      controller.abort();
      timers.forEach(window.clearTimeout);
      pending.current.clear();
    };
  }, []);

  return { items, loaded };
}
