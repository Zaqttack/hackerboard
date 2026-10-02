import { useRef } from "react";
import { Bauble } from "../components/Bauble.tsx";
import { EmptyGhost } from "../components/EmptyGhost.tsx";
import { Hero } from "../components/Hero.tsx";
import { QRCard } from "../components/QRCard.tsx";
import { Stage } from "../components/Stage.tsx";
import { StringLayer } from "../components/StringLayer.tsx";
import { useWall } from "../hooks/useWall.ts";
import { usePhysics } from "../hooks/usePhysics.ts";
import { MAX_RECRUITS } from "../shared/constants.ts";
import type { Placed } from "../lib/place.ts";

const BAUBLE_STYLE = { position: "absolute", left: 0, top: 0, zIndex: 20, willChange: "transform" } as const;

export function Board() {
  const { shown, leaving, newIds } = useWall();
  const layer = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const dings = useRef<HTMLDivElement>(null);
  const { register } = usePhysics({ layer, svg, dings, shown, leaving, newIds });

  const items: { placed: Placed; mode: "fade" | "fall" | null }[] = [
    ...shown.map((placed) => ({ placed, mode: null })),
    ...leaving.map(({ placed, mode }) => ({ placed, mode })),
  ];

  return (
    <Stage>
      <div ref={layer} className="absolute inset-0">
        <StringLayer ref={svg} />
        <Hero count={shown.length} total={MAX_RECRUITS} />
        <QRCard url={`${window.location.origin}/join`} />
        {shown.length === 0 && <EmptyGhost />}
        {items.map(({ placed, mode }) => (
          <Bauble
            key={placed.entry.id}
            ref={register(placed.entry.id)}
            name={placed.entry.name}
            emoji={placed.entry.emoji}
            fill={placed.entry.fill}
            isNew={newIds.has(placed.entry.id)}
            exiting={mode === "fade"}
            style={BAUBLE_STYLE}
          />
        ))}
        <div ref={dings} className="pointer-events-none absolute inset-0 z-40" />
      </div>
    </Stage>
  );
}
