import { Bauble } from "../components/Bauble.tsx";
import { EmptyGhost } from "../components/EmptyGhost.tsx";
import { Hero } from "../components/Hero.tsx";
import { QRCard } from "../components/QRCard.tsx";
import { Stage } from "../components/Stage.tsx";
import { useWall } from "../hooks/useWall.ts";
import { tierScale } from "../lib/tiers.ts";
import { MAX_RECRUITS } from "../shared/constants.ts";

export function Board() {
  const { shown, leaving, newIds } = useWall();
  const tier = tierScale(shown.length);

  return (
    <Stage>
      <Hero count={shown.length} total={MAX_RECRUITS} />
      <QRCard url={`${window.location.origin}/join`} />
      {shown.length === 0 && <EmptyGhost />}
      {[...shown, ...leaving].map((p) => (
        <Bauble
          key={p.entry.id}
          name={p.entry.name}
          emoji={p.entry.emoji}
          fill={p.entry.fill}
          rotation={p.rotation}
          scale={tier * p.variation}
          isNew={newIds.has(p.entry.id)}
          exiting={leaving.includes(p)}
          style={{ position: "absolute", left: p.x, top: p.y, zIndex: 20 }}
        />
      ))}
    </Stage>
  );
}
