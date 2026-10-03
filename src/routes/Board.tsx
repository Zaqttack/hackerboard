import { useEffect, useRef, useState } from "react";
import { Bauble } from "../components/Bauble.tsx";
import { EmptyGhost } from "../components/EmptyGhost.tsx";
import { Hero } from "../components/Hero.tsx";
import { QRCard } from "../components/QRCard.tsx";
import { Stage } from "../components/Stage.tsx";
import { baubleRect, findSpot, look, type Rect } from "../lib/place.ts";
import { baubleScale } from "../lib/tiers.ts";
import { useWall } from "../lib/useWall.ts";

type Placed = { x: number; y: number; rotation: number; variation: number; width: number };

export function Board() {
  const { items, loaded } = useWall();
  const [layout, setLayout] = useState<Map<string, Placed>>(new Map());
  const probes = useRef(new Map<string, HTMLDivElement>());

  const count = items.filter((item) => item.status !== "leaving").length;
  const unplaced = items.filter((item) => !layout.has(item.entry.id));

  useEffect(() => {
    if (unplaced.length === 0) return;
    let cancelled = false;

    const names = unplaced.map((item) => item.entry.name).join("");
    const fontsLoaded = document.fonts.load("700 34px Kalam", names).catch(() => []);
    void Promise.all([fontsLoaded, document.fonts.ready]).then(() => {
      if (cancelled) return;
      const next = new Map(layout);
      const taken: Rect[] = [];
      for (const item of items) {
        const placed = layout.get(item.entry.id);
        if (placed && item.status !== "leaving") taken.push(baubleRect(placed.x, placed.y, placed.width, baubleScale(count, placed.variation)));
      }

      const measured = unplaced
        .map((item) => ({ item, width: probes.current.get(item.entry.id)?.offsetWidth ?? 0 }))
        .filter((m) => m.width > 0)
        .sort((a, b) => b.width - a.width);

      for (const { item, width } of measured) {
        const { rotation, variation } = look(item.entry.id);
        const scale = baubleScale(count, variation);
        const { x, y } = findSpot(width, scale, taken);
        taken.push(baubleRect(x, y, width, scale));
        next.set(item.entry.id, { x, y, rotation, variation, width });
      }
      if (measured.length > 0) setLayout(next);
    });

    return () => {
      cancelled = true;
    };
  }, [items, layout, count]);

  return (
    <Stage>
      <Hero key={loaded ? "live" : "boot"} count={count} />
      <QRCard url={`${window.location.origin}/join`} />
      {loaded && items.length === 0 && <EmptyGhost />}
      <div aria-hidden className="pointer-events-none invisible absolute top-0 left-0">
        {unplaced.map(({ entry }) => (
          <Bauble
            key={entry.id}
            ref={(el) => {
              if (el) probes.current.set(entry.id, el);
              else probes.current.delete(entry.id);
            }}
            name={entry.name}
            emoji={entry.emoji}
            fill={entry.fill}
          />
        ))}
      </div>
      {items.map(({ entry, status }) => {
        const placed = layout.get(entry.id);
        if (!placed) return null;
        return (
          <Bauble
            key={entry.id}
            name={entry.name}
            emoji={entry.emoji}
            fill={entry.fill}
            x={placed.x}
            y={placed.y}
            rotation={placed.rotation}
            scale={baubleScale(count, placed.variation)}
            isNew={status === "arriving"}
            leaving={status === "leaving"}
          />
        );
      })}
    </Stage>
  );
}
