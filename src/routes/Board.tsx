import { useEffect, useRef, useState } from "react";
import { Bauble } from "../components/Bauble.tsx";
import { EmptyGhost } from "../components/EmptyGhost.tsx";
import { Hero } from "../components/Hero.tsx";
import { QRCard } from "../components/QRCard.tsx";
import { Stage } from "../components/Stage.tsx";
import { baubleScale } from "../lib/tiers.ts";
import { ANIMALS } from "../shared/animals.ts";
import { FILLS, type Fill } from "../shared/types.ts";
import { MAX_RECRUITS } from "../shared/constants.ts";

type Recruit = {
  id: number;
  name: string;
  emoji: string;
  fill: Fill;
  x: number;
  y: number;
  rotation: number;
  variation: number;
  isNew: boolean;
};

const SAMPLES: [string, string, number, number, number, number, number][] = [
  ["Maya", "🦊", 880, 80, -3, 1, 1],
  ["Dev Patel", "🐙", 1100, 230, 2, 1.03, 0],
  ["Priya R", "🦉", 140, 460, -2, 1, 3],
  ["xX_h4ck3r_Xx", "🦝", 620, 430, -4, 1.02, 4],
  ["Luis", "🐝", 1520, 520, 3, 1.05, 2],
  ["Ana Lucía", "🦄", 300, 700, -2.5, 1.01, 5],
  ["Theo", "🐻", 900, 640, 3, 1, 3],
  ["Kenji", "🦈", 1250, 760, -1.5, 0.975, 0],
  ["Rosa M.", "🐞", 560, 880, 2.5, 1, 1],
  ["Ifeoma", "🦒", 1600, 860, -3, 0.99, 4],
];

const FAKE_NAMES = [
  "Chris", "Nadia", "Bo", "Tomás", "Grace H", "Sam O.", "Lena", "Marcus T", "Aiyana", "Omar",
  "Jun", "Kiki", "Diego R.", "null_ptr", "Hana", "Wes", "Zara K", "Pavel", "Mei", "Andre",
  "Sofía", "Ty", "Noor", "Elijah B.", "Quinn", "Ravi", "Lupe", "Ash", "Camila Reyes", "Dmitri",
];

const WALLS = [
  [30, 30, 770, 470],
  [1480, 20, 1900, 500],
];

let nextId = 1;

function samples(): Recruit[] {
  return SAMPLES.map(([name, emoji, x, y, rotation, variation, fill]) => ({
    id: nextId++,
    name,
    emoji,
    fill: FILLS[fill],
    x,
    y,
    rotation,
    variation,
    isNew: false,
  }));
}

function overlaps(a: number[], b: number[], slack = 0) {
  return a[0] < b[2] - slack && a[2] > b[0] + slack && a[1] < b[3] - slack && a[3] > b[1] + slack;
}

function fakeRecruit(existing: Recruit[]): Recruit {
  const count = existing.length + 1;
  const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  const variation = 0.95 + Math.random() * 0.1;
  const scale = baubleScale(count, variation);
  const w = (88 + name.length * 17 + 40) * scale;
  const h = 88 * scale;
  const taken = existing.map((r) => {
    const rw = (88 + r.name.length * 17 + 40) * baubleScale(count, r.variation);
    return [r.x, r.y, r.x + rw, r.y + 88 * baubleScale(count, r.variation)];
  });
  let x = 0;
  let y = 0;
  for (let i = 0; i < 400; i++) {
    x = 30 + Math.random() * (1860 - w);
    y = 40 + Math.random() * (1000 - h);
    const rect = [x, y, x + w, y + h];
    const slack = i < 200 ? 0 : 18;
    if (!WALLS.some((wall) => overlaps(rect, wall)) && !taken.some((t) => overlaps(rect, t, slack))) break;
  }
  const previous = existing[existing.length - 1]?.fill;
  const fills = FILLS.filter((f) => f !== previous);
  return {
    id: nextId++,
    name,
    emoji: ANIMALS[Math.floor(Math.random() * ANIMALS.length)].emoji,
    fill: fills[Math.floor(Math.random() * fills.length)],
    x: Math.round(x),
    y: Math.round(y),
    rotation: Math.round((Math.random() - 0.5) * 80) / 10,
    variation,
    isNew: true,
  };
}

export function Board() {
  const [recruits, setRecruits] = useState<Recruit[]>(samples);
  const latest = useRef(recruits);
  latest.current = recruits;
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n") {
        const recruit = fakeRecruit(latest.current);
        setRecruits((list) => [...list, recruit].slice(-MAX_RECRUITS));
        timers.current.push(
          window.setTimeout(
            () => setRecruits((list) => list.map((r) => (r.id === recruit.id ? { ...r, isNew: false } : r))),
            3000,
          ),
        );
      } else if (e.key === "c") {
        setRecruits([]);
      } else if (e.key === "r") {
        setRecruits(samples());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Stage>
      <Hero count={recruits.length} />
      <QRCard url={`${window.location.origin}/join`} />
      {recruits.length === 0 && <EmptyGhost />}
      {recruits.map((r) => (
        <Bauble
          key={r.id}
          name={r.name}
          emoji={r.emoji}
          fill={r.fill}
          x={r.x}
          y={r.y}
          rotation={r.rotation}
          scale={baubleScale(recruits.length, r.variation)}
          isNew={r.isNew}
        />
      ))}
    </Stage>
  );
}
