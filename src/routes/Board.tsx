import { useEffect, useState } from "react";
import { Bauble } from "../components/Bauble.tsx";
import { EmptyGhost } from "../components/EmptyGhost.tsx";
import { Hero } from "../components/Hero.tsx";
import { QRCard } from "../components/QRCard.tsx";
import { Stage } from "../components/Stage.tsx";
import { MAX_RECRUITS, tierScale } from "../lib/tiers.ts";
import { FILLS, type Fill } from "../shared/types.ts";

type Placed = {
  id: string;
  name: string;
  emoji: string;
  fill: Fill;
  x: number;
  y: number;
  rotation: number;
  variation: number;
};

const SAMPLE: Placed[] = [
  { id: "1", name: "Maya", emoji: "🦊", fill: "tape", x: 880, y: 80, rotation: -3, variation: 1 },
  { id: "2", name: "Dev Patel", emoji: "🐙", fill: "paper", x: 1100, y: 230, rotation: 2, variation: 1.03 },
  { id: "3", name: "Priya R", emoji: "🦉", fill: "carbon", x: 140, y: 460, rotation: -2, variation: 1 },
  { id: "4", name: "xX_h4ck3r_Xx", emoji: "🦝", fill: "memo", x: 620, y: 430, rotation: -4, variation: 1.02 },
  { id: "5", name: "Luis", emoji: "🐝", fill: "manila", x: 1520, y: 520, rotation: 3, variation: 1.05 },
  { id: "6", name: "Ana Lucía", emoji: "🦄", fill: "mint", x: 300, y: 700, rotation: -2.5, variation: 1.01 },
  { id: "7", name: "Theo", emoji: "🐻", fill: "carbon", x: 900, y: 640, rotation: 3, variation: 1 },
  { id: "8", name: "Kenji", emoji: "🦈", fill: "tape", x: 1250, y: 760, rotation: -1.5, variation: 0.97 },
  { id: "9", name: "Rosa M.", emoji: "🐞", fill: "memo", x: 560, y: 880, rotation: 2.5, variation: 1 },
  { id: "10", name: "Ifeoma", emoji: "🦒", fill: "paper", x: 1600, y: 860, rotation: -3, variation: 0.99 },
];

const DEV_NAMES = ["Grace H", "Sam O.", "Noor", "Bartholomew Castillo", "Wes", "Mina", "null_ptr"];
const DEV_EMOJI = ["🐼", "🐨", "🦔", "🐳", "🦜", "🐸", "🦩"];
const NEW_BADGE_MS = 2800;

function randomSpot() {
  return { x: 40 + Math.random() * 1500, y: 460 + Math.random() * 500 };
}

export function Board() {
  const [placed, setPlaced] = useState<Placed[]>(SAMPLE);
  const [newId, setNewId] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "n") {
        const id = crypto.randomUUID();
        const pick = Math.floor(Math.random() * DEV_NAMES.length);
        const spot = randomSpot();
        setPlaced((list) => [
          ...list.slice(-(MAX_RECRUITS - 1)),
          {
            id,
            name: DEV_NAMES[pick],
            emoji: DEV_EMOJI[pick],
            fill: FILLS[Math.floor(Math.random() * FILLS.length)],
            x: spot.x,
            y: spot.y,
            rotation: Math.round((Math.random() - 0.5) * 80) / 10,
            variation: 1,
          },
        ]);
        setNewId(id);
        window.setTimeout(() => setNewId((current) => (current === id ? null : current)), NEW_BADGE_MS);
      }
      if (event.key === "c") setPlaced([]);
      if (event.key === "r") setPlaced(SAMPLE);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tier = tierScale(placed.length);

  return (
    <Stage>
      <Hero count={placed.length} total={MAX_RECRUITS} />
      <QRCard url={`${window.location.origin}/join`} />
      {placed.length === 0 && <EmptyGhost />}
      {placed.map((b) => (
        <Bauble
          key={b.id}
          name={b.name}
          emoji={b.emoji}
          fill={b.fill}
          rotation={b.rotation}
          scale={tier * b.variation}
          isNew={b.id === newId}
          style={{ position: "absolute", left: b.x, top: b.y, zIndex: 20 }}
        />
      ))}
    </Stage>
  );
}
