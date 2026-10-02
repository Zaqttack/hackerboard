import { Bodies, Body, Composite, Engine, Events } from "matter-js";
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { ease } from "../lib/bezier.ts";
import type { Placed } from "../lib/place.ts";
import { tierScale } from "../lib/tiers.ts";
import type { Leaving } from "./useWall.ts";

const STEP_MS = 1000 / 60;
const MIN_SPEED = 10;
const MAX_SPEED = 28;
const SPAWN_MAX_SPEED = 22;
const BOUNCE_JITTER = 10;
const STRING_SLACK = 420;
const STRING_PULL = 0.4;
const TUG = 40;
const WALL_PAD = 24;
const HEIGHT = 88;
const PIN_X = 41;
const PIN_Y = -45;
const MIN_SCALE = 0.77;
const DING_SPEED = 14;
const FALL_MS = 1020;

type ScaleAnim = {
  from: number;
  to: number;
  start: number;
  dur: number;
  ease: (t: number) => number;
};

type Exit = { mode: "fade" | "fall"; start: number; x: number; y: number; angle: number };

type Sim = {
  id: string;
  el: HTMLElement;
  pin: HTMLElement | null;
  body: Body;
  w0: number;
  scale: number;
  variation: number;
  rotation: number;
  phase: number;
  period: number;
  arrivedAt: number | null;
  scaleAnim: ScaleAnim | null;
  exit: Exit | null;
  cx: number;
  cy: number;
  angle: number;
};

type Link = {
  from: string;
  to: string;
  start: number;
  dur: number;
  retractStart: number | null;
  rope: SVGLineElement;
  shadow: SVGLineElement;
};

type World = {
  engine: Engine;
  sims: Map<string, Sim>;
  bodies: Map<number, Sim>;
  links: Map<string, Link>;
  walls: Body[];
  bounced: Set<Sim>;
  cooldown: Map<string, number>;
  activeDings: number;
  appliedTier: number | null;
  pendingTier: number | null;
  tierTimer: number;
  last: number;
  acc: number;
  reduced: boolean;
  ding: (x: number, y: number) => void;
};

type Options = {
  layer: RefObject<HTMLDivElement | null>;
  svg: RefObject<SVGSVGElement | null>;
  dings: RefObject<HTMLDivElement | null>;
  shown: Placed[];
  leaving: Leaving[];
  newIds: ReadonlySet<string>;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function scaleFor(tier: number, variation: number) {
  return Math.max(MIN_SCALE, tier * variation);
}

function pinOf(sim: Sim) {
  const rad = (sim.angle * Math.PI) / 180;
  const ox = (PIN_X - sim.w0 / 2) * sim.scale;
  const oy = PIN_Y * sim.scale;
  return {
    x: sim.cx + ox * Math.cos(rad) - oy * Math.sin(rad),
    y: sim.cy + ox * Math.sin(rad) + oy * Math.cos(rad),
  };
}

function setSpeed(body: Body, x: number, y: number) {
  Body.setVelocity(body, { x: x / 60, y: y / 60 });
}

function createWorld(): World {
  const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
  const world: World = {
    engine,
    sims: new Map(),
    bodies: new Map(),
    links: new Map(),
    walls: [],
    bounced: new Set(),
    cooldown: new Map(),
    activeDings: 0,
    appliedTier: null,
    pendingTier: null,
    tierTimer: 0,
    last: 0,
    acc: 0,
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ding: () => {},
  };

  Events.on(engine, "collisionStart", (event) => {
    const now = performance.now();
    for (const pair of event.pairs) {
      const a = world.bodies.get(pair.bodyA.id);
      const b = world.bodies.get(pair.bodyB.id);
      if (a) world.bounced.add(a);
      if (b) world.bounced.add(b);

      const impact =
        Math.hypot(
          pair.bodyA.velocity.x - pair.bodyB.velocity.x,
          pair.bodyA.velocity.y - pair.bodyB.velocity.y,
        ) * 60;
      if (impact <= DING_SPEED || world.reduced || world.activeDings >= 4) continue;

      const key = [pair.bodyA.id, pair.bodyB.id].sort().join("|");
      if (now - (world.cooldown.get(key) ?? Number.NEGATIVE_INFINITY) < 1500) continue;
      world.cooldown.set(key, now);

      const point = pair.collision.supports[0] ?? pair.bodyA.position;
      world.ding(point.x, point.y);
    }
  });

  return world;
}

function rebuildWalls(world: World, layer: HTMLElement) {
  Composite.remove(world.engine.world, world.walls);
  const walls: Body[] = [];
  const thick = 200;
  const edge = { isStatic: true, restitution: 0.85, friction: 0 };

  walls.push(Bodies.rectangle(960, WALL_PAD - thick / 2, 2320, thick, edge));
  walls.push(Bodies.rectangle(960, 1080 - WALL_PAD + thick / 2, 2320, thick, edge));
  walls.push(Bodies.rectangle(WALL_PAD - thick / 2, 540, thick, 1480, edge));
  walls.push(Bodies.rectangle(1920 - WALL_PAD + thick / 2, 540, thick, 1480, edge));

  for (const el of layer.querySelectorAll<HTMLElement>("[data-wall]")) {
    const width = el.offsetWidth + WALL_PAD * 2;
    const height = el.offsetHeight + WALL_PAD * 2;
    walls.push(
      Bodies.rectangle(el.offsetLeft + el.offsetWidth / 2, el.offsetTop + el.offsetHeight / 2, width, height, edge),
    );
  }

  Composite.add(world.engine.world, walls);
  world.walls = walls;
}

function writeTransform(sim: Sim, now: number, world: World) {
  let { x, y } = sim.body.position;
  let angle = sim.rotation;

  if (!world.reduced) {
    angle += 3 * Math.sin((2 * Math.PI * now) / 1000 / sim.period + sim.phase);
  }

  if (sim.exit) {
    const elapsed = now - sim.exit.start;
    x = sim.exit.x;
    y = sim.exit.y;
    angle = sim.exit.angle;
    if (sim.exit.mode === "fall") {
      if (sim.pin) sim.pin.style.scale = String(Math.max(0, 1 - elapsed / 120));
      const fall = clamp((elapsed - 120) / 900, 0, 1);
      y = sim.exit.y + ease.fall(fall) * (1080 + 140 - sim.exit.y);
      angle = sim.exit.angle + 18 * fall;
    }
  }

  sim.cx = x;
  sim.cy = y;
  sim.angle = angle;
  sim.el.style.transform = `translate3d(${x - sim.w0 / 2}px, ${y - HEIGHT / 2}px, 0) rotate(${angle}deg) scale(${sim.scale})`;
}

function removeSim(world: World, sim: Sim) {
  Composite.remove(world.engine.world, sim.body);
  world.bodies.delete(sim.body.id);
  world.sims.delete(sim.id);
}

export function usePhysics({ layer, svg, dings, shown, leaving, newIds }: Options) {
  const worldRef = useRef<World | null>(null);
  const els = useRef(new Map<string, HTMLDivElement>());
  const callbacks = useRef(new Map<string, (el: HTMLDivElement | null) => void>());
  const timers = useRef(new Set<number>());

  const getWorld = () => {
    worldRef.current ??= createWorld();
    return worldRef.current;
  };

  const register = useCallback((id: string) => {
    let callback = callbacks.current.get(id);
    if (!callback) {
      callback = (el) => {
        if (el) {
          els.current.set(id, el);
        } else {
          els.current.delete(id);
          callbacks.current.delete(id);
        }
      };
      callbacks.current.set(id, callback);
    }
    return callback;
  }, []);

  useLayoutEffect(() => {
    const layerEl = layer.current;
    const svgEl = svg.current;
    if (!layerEl || !svgEl) return;

    const world = getWorld();
    const now = performance.now();

    world.ding = (x, y) => {
      const host = dings.current;
      if (!host) return;
      world.activeDings++;
      const ding = document.createElement("div");
      ding.className = "ding";
      ding.style.left = `${x}px`;
      ding.style.top = `${y}px`;
      ding.innerHTML = "<i></i><i></i><i></i>";
      ding.addEventListener("animationend", () => {
        ding.remove();
        world.activeDings--;
      });
      host.append(ding);
    };

    if (world.walls.length === 0) rebuildWalls(world, layerEl);
    if (world.appliedTier === null) world.appliedTier = tierScale(shown.length);

    for (const placed of shown) {
      const id = placed.entry.id;
      const el = els.current.get(id);
      if (world.sims.has(id) || !el) continue;

      const w0 = el.offsetWidth;
      const variation = placed.variation;
      const scale = scaleFor(world.appliedTier, variation);
      const body = Bodies.rectangle(
        placed.x + (w0 * scale) / 2,
        placed.y + (HEIGHT * scale) / 2,
        w0,
        HEIGHT,
        {
          chamfer: { radius: HEIGHT / 2 - 1 },
          restitution: 0.85,
          friction: 0,
          frictionStatic: 0,
          frictionAir: 0,
          inertia: Number.POSITIVE_INFINITY,
        },
      );
      Body.scale(body, scale, scale);

      const heading = Math.random() * Math.PI * 2;
      const speed = MIN_SPEED + Math.random() * (SPAWN_MAX_SPEED - MIN_SPEED);
      setSpeed(body, Math.cos(heading) * speed, Math.sin(heading) * speed);

      const sim: Sim = {
        id,
        el,
        pin: el.querySelector<HTMLElement>(".pin"),
        body,
        w0,
        scale,
        variation,
        rotation: placed.rotation,
        phase: Math.random() * Math.PI * 2,
        period: 7 + Math.random() * 4,
        arrivedAt: newIds.has(id) ? now : null,
        scaleAnim: null,
        exit: null,
        cx: body.position.x,
        cy: body.position.y,
        angle: placed.rotation,
      };

      el.style.transformOrigin = "center";
      Composite.add(world.engine.world, body);
      world.sims.set(id, sim);
      world.bodies.set(body.id, sim);
      writeTransform(sim, now, world);

      const target = placed.entry.tiedTo;
      if (sim.arrivedAt !== null && target && !world.reduced) {
        const timer = window.setTimeout(() => {
          timers.current.delete(timer);
          const other = world.sims.get(target);
          const mine = world.sims.get(id);
          if (!other || !mine || other.exit) return;
          const dx = mine.body.position.x - other.body.position.x;
          const dy = mine.body.position.y - other.body.position.y;
          const length = Math.hypot(dx, dy) || 1;
          const v = other.body.velocity;
          setSpeed(other.body, v.x * 60 + (dx / length) * TUG, v.y * 60 + (dy / length) * TUG);
        }, 850);
        timers.current.add(timer);
      }
    }

    for (const { placed, mode } of leaving) {
      const sim = world.sims.get(placed.entry.id);
      if (!sim || sim.exit) continue;
      Composite.remove(world.engine.world, sim.body);
      world.bodies.delete(sim.body.id);
      sim.exit = { mode, start: now, x: sim.cx, y: sim.cy, angle: sim.angle };
    }

    for (const sim of [...world.sims.values()]) {
      if (!sim.el.isConnected) removeSim(world, sim);
    }

    const shadows = svgEl.querySelector("g") ?? svgEl.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"));
    const ropes = svgEl.querySelectorAll("g")[1] ?? svgEl.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"));
    for (const placed of shown) {
      const id = placed.entry.id;
      const target = placed.entry.tiedTo;
      const mine = world.sims.get(id);
      if (!target || world.links.has(id) || !mine || !world.sims.has(target)) continue;

      const shadow = document.createElementNS("http://www.w3.org/2000/svg", "line");
      shadow.setAttribute("stroke", "rgba(0,0,0,0.25)");
      shadow.setAttribute("stroke-width", "5");
      shadow.setAttribute("stroke-linecap", "round");
      shadow.setAttribute("transform", "translate(2 4)");
      const rope = document.createElementNS("http://www.w3.org/2000/svg", "line");
      rope.setAttribute("stroke", "#b3261e");
      rope.setAttribute("stroke-width", "5");
      rope.setAttribute("stroke-linecap", "round");
      shadows.append(shadow);
      ropes.append(rope);

      const start = mine.arrivedAt === null ? now - 10_000 : mine.arrivedAt + 350;
      world.links.set(id, { from: target, to: id, start, dur: 500, retractStart: null, rope, shadow });
    }

    const desired = tierScale(shown.length);
    if (desired === world.appliedTier) {
      window.clearTimeout(world.tierTimer);
      world.pendingTier = null;
    } else if (world.pendingTier !== desired) {
      window.clearTimeout(world.tierTimer);
      world.pendingTier = desired;
      const delay = world.reduced ? 0 : desired < (world.appliedTier ?? desired) ? 400 : 2000;
      world.tierTimer = window.setTimeout(() => {
        world.appliedTier = desired;
        world.pendingTier = null;
        const live = [...world.sims.values()].filter((sim) => !sim.exit);
        const newest = live[live.length - 1];
        const origin = newest?.body.position ?? { x: 960, y: 540 };
        live.sort(
          (a, b) =>
            Math.hypot(a.body.position.x - origin.x, a.body.position.y - origin.y) -
            Math.hypot(b.body.position.x - origin.x, b.body.position.y - origin.y),
        );
        const base = performance.now();
        live.forEach((sim, index) => {
          sim.scaleAnim = {
            from: sim.scale,
            to: scaleFor(desired, sim.variation),
            start: base + (world.reduced ? 0 : index * 12),
            dur: world.reduced ? 200 : 700,
            ease: world.reduced ? ease.out : ease.spring,
          };
        });
      }, delay);
    }
  }, [shown, leaving, newIds, layer, svg, dings]);

  useEffect(() => {
    const world = getWorld();
    let raf = 0;

    const stepOnce = () => {
      const live = [...world.sims.values()].filter((sim) => !sim.exit);

      for (const sim of live) {
        const { x, y } = sim.body.velocity;
        const speed = Math.hypot(x, y) * 60;
        if (speed < 0.001) {
          const heading = Math.random() * Math.PI * 2;
          setSpeed(sim.body, Math.cos(heading) * MIN_SPEED, Math.sin(heading) * MIN_SPEED);
        } else if (speed < MIN_SPEED || speed > MAX_SPEED) {
          const target = clamp(speed, MIN_SPEED, MAX_SPEED);
          setSpeed(sim.body, (x * 60 * target) / speed, (y * 60 * target) / speed);
        }
      }

      for (const link of world.links.values()) {
        const a = world.sims.get(link.from);
        const b = world.sims.get(link.to);
        if (!a || !b || a.exit || b.exit) continue;
        const pa = pinOf(a);
        const pb = pinOf(b);
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= STRING_SLACK) continue;
        const pull = (STRING_PULL * ((distance - STRING_SLACK) / 100)) / 3600;
        const ux = dx / distance;
        const uy = dy / distance;
        Body.setVelocity(a.body, { x: a.body.velocity.x + ux * pull, y: a.body.velocity.y + uy * pull });
        Body.setVelocity(b.body, { x: b.body.velocity.x - ux * pull, y: b.body.velocity.y - uy * pull });
      }

      Engine.update(world.engine, STEP_MS);

      for (const sim of world.bounced) {
        if (sim.exit) continue;
        const jitter = ((Math.random() * 2 - 1) * BOUNCE_JITTER * Math.PI) / 180;
        const { x, y } = sim.body.velocity;
        Body.setVelocity(sim.body, {
          x: x * Math.cos(jitter) - y * Math.sin(jitter),
          y: x * Math.sin(jitter) + y * Math.cos(jitter),
        });
      }
      world.bounced.clear();
    };

    const frame = (time: number) => {
      const delta = world.last === 0 ? STEP_MS : Math.min(64, time - world.last);
      world.last = time;

      if (world.reduced) {
        world.acc = 0;
      } else {
        world.acc += delta;
        let steps = 0;
        while (world.acc >= STEP_MS && steps < 3) {
          stepOnce();
          world.acc -= STEP_MS;
          steps++;
        }
        if (steps === 3) world.acc = 0;
      }

      for (const sim of [...world.sims.values()]) {
        const anim = sim.scaleAnim;
        if (anim) {
          const t = (time - anim.start) / anim.dur;
          if (t >= 0) {
            const next = t >= 1 ? anim.to : anim.from + (anim.to - anim.from) * anim.ease(t);
            Body.scale(sim.body, next / sim.scale, next / sim.scale);
            sim.scale = next;
            if (t >= 1) sim.scaleAnim = null;
          }
        }
        writeTransform(sim, time, world);
        if (sim.exit && time - sim.exit.start > FALL_MS + 200) removeSim(world, sim);
      }

      for (const [id, link] of [...world.links]) {
        const a = world.sims.get(link.from);
        const b = world.sims.get(link.to);
        if (!a || !b) {
          link.rope.remove();
          link.shadow.remove();
          world.links.delete(id);
          continue;
        }

        let progress = world.reduced ? 1 : ease.inout(clamp((time - link.start) / link.dur, 0, 1));
        let opacity = world.reduced ? clamp((time - link.start) / 200, 0, 1) : progress > 0 ? 1 : 0;

        if (a.exit || b.exit) {
          link.retractStart ??= time;
          const retract = clamp((time - link.retractStart) / 250, 0, 1);
          progress *= 1 - retract;
          opacity = world.reduced ? opacity * (1 - retract) : opacity;
          if (retract >= 1) {
            link.rope.remove();
            link.shadow.remove();
            world.links.delete(id);
            continue;
          }
        }

        const pa = pinOf(a);
        const pb = pinOf(b);
        const x2 = pa.x + (pb.x - pa.x) * progress;
        const y2 = pa.y + (pb.y - pa.y) * progress;
        for (const line of [link.rope, link.shadow]) {
          line.setAttribute("x1", String(pa.x));
          line.setAttribute("y1", String(pa.y));
          line.setAttribute("x2", String(x2));
          line.setAttribute("y2", String(y2));
          line.style.opacity = String(opacity);
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    const remeasure = () => {
      for (const sim of world.sims.values()) {
        const width = sim.el.offsetWidth;
        if (Math.abs(width - sim.w0) > 1) {
          Body.scale(sim.body, width / sim.w0, 1);
          sim.w0 = width;
        }
      }
      if (layer.current) rebuildWalls(world, layer.current);
    };
    void document.fonts.ready.then(remeasure);

    const pending = timers.current;
    return () => {
      cancelAnimationFrame(raf);
      world.last = 0;
      window.clearTimeout(world.tierTimer);
      world.pendingTier = null;
      for (const timer of pending) window.clearTimeout(timer);
      pending.clear();
    };
  }, [layer]);

  return { register };
}
