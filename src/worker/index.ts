import { MAX_RECRUITS } from "../shared/constants.ts";
import type { Entry, Fill } from "../shared/types.ts";
import { pickEmoji, pickFill, pickTieTarget } from "./picks.ts";
import { verifyTurnstile } from "./turnstile.ts";
import { checkName } from "./validate.ts";

interface Env {
  DB: D1Database;
  ADMIN_KEY?: string;
  TURNSTILE_SECRET?: string;
}

const MAX_BODY = 2048;
const LIST_LIMIT = 1000;
const MAX_PASSPHRASE = 256;
const SIGN_WINDOW_MS = 30_000;
const SIGN_MAX_PER_WINDOW = 60;
const ADMIN_WINDOW_MS = 10 * 60_000;
const ADMIN_MAX_FAILURES = 10;

const COLUMNS = "id, name, emoji, fill, tied_to AS tiedTo, created_at AS createdAt";

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try {
    const body = JSON.parse(text);
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function passphraseMatches(body: Record<string, unknown> | null, env: Env): Promise<boolean> {
  const given = body?.passphrase;
  if (!env.ADMIN_KEY || typeof given !== "string" || given.length > MAX_PASSPHRASE) return false;

  const [a, b] = await Promise.all([digest(given), digest(env.ADMIN_KEY)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

async function adminDenied(request: Request, env: Env, body: Record<string, unknown> | null): Promise<Response | null> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const now = Date.now();

  await env.DB.prepare("DELETE FROM admin_failures WHERE at < ?")
    .bind(now - ADMIN_WINDOW_MS)
    .run();
  const failures = await env.DB.prepare("SELECT COUNT(*) AS n FROM admin_failures WHERE ip = ?")
    .bind(ip)
    .first<{ n: number }>();
  if ((failures?.n ?? 0) >= ADMIN_MAX_FAILURES) return json({ error: "locked" }, 429);

  if (await passphraseMatches(body, env)) return null;

  await env.DB.prepare("INSERT INTO admin_failures (ip, at) VALUES (?, ?)").bind(ip, now).run();
  return json({ error: "unauthorized" }, 401);
}

function rejectCrossSitePost(request: Request, url: URL): Response | null {
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return json({ error: "forbidden" }, 403);

  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return json({ error: "forbidden" }, 403);

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "unsupported" }, 415);
  }
  return null;
}

async function wall(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM (SELECT ${COLUMNS} FROM entries ORDER BY created_at DESC LIMIT ?) ORDER BY createdAt ASC`,
  )
    .bind(MAX_RECRUITS)
    .all<Entry>();
  return json(results);
}

async function sign(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ error: "invalid" }, 400);

  const checked = checkName(body.name);
  if (!checked.ok) return json({ error: checked.reason }, checked.reason === "invalid" ? 400 : 422);

  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM entries WHERE created_at > ?")
    .bind(Date.now() - SIGN_WINDOW_MS)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= SIGN_MAX_PER_WINDOW) return json({ error: "busy" }, 429);

  if (!(await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET))) {
    return json({ error: "turnstile" }, 403);
  }

  const { results: newest } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM entries ORDER BY created_at DESC LIMIT ?`,
  )
    .bind(MAX_RECRUITS)
    .all<Entry>();

  const entry: Entry = {
    id: crypto.randomUUID(),
    name: checked.name,
    emoji: pickEmoji(),
    fill: pickFill((newest[0]?.fill as Fill | undefined) ?? null),
    tiedTo: pickTieTarget(newest),
    createdAt: Date.now(),
  };

  await env.DB.prepare(
    "INSERT INTO entries (id, name, emoji, fill, tied_to, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(entry.id, entry.name, entry.emoji, entry.fill, entry.tiedTo, entry.createdAt)
    .run();

  return json(entry, 201);
}

async function me(url: URL, env: Env): Promise<Response> {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "invalid" }, 400);

  const entry = await env.DB.prepare(`SELECT ${COLUMNS} FROM entries WHERE id = ?`).bind(id).first<Entry>();
  if (!entry) return json({ error: "not_found" }, 404);

  const newer = await env.DB.prepare("SELECT COUNT(*) AS n FROM entries WHERE created_at > ?")
    .bind(entry.createdAt)
    .first<{ n: number }>();
  return json({ ...entry, onBoard: (newer?.n ?? 0) < MAX_RECRUITS });
}

async function adminStats(request: Request, env: Env): Promise<Response> {
  const denied = await adminDenied(request, env, await readBody(request));
  if (denied) return denied;

  const row = await env.DB.prepare("SELECT COUNT(*) AS total FROM entries").first<{ total: number }>();
  const { results: entries } = await env.DB.prepare(
    "SELECT name, emoji, created_at AS createdAt FROM entries ORDER BY created_at ASC LIMIT ?",
  )
    .bind(LIST_LIMIT)
    .all<{ name: string; emoji: string; createdAt: number }>();
  const recruited = row?.total ?? 0;
  return json({ onBoard: Math.min(recruited, MAX_RECRUITS), recruited, entries });
}

async function adminWipe(request: Request, env: Env): Promise<Response> {
  const denied = await adminDenied(request, env, await readBody(request));
  if (denied) return denied;

  await env.DB.prepare("DELETE FROM entries").run();
  return json({ ok: true });
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "POST") {
    const rejected = rejectCrossSitePost(request, url);
    if (rejected) return rejected;
  }

  switch (`${request.method} ${url.pathname}`) {
    case "GET /api/health": {
      const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM entries").first<{ n: number }>();
      return json({ ok: true, entries: row?.n ?? 0 });
    }
    case "GET /api/wall":
      return wall(env);
    case "POST /api/sign":
      return sign(request, env);
    case "GET /api/me":
      return me(url, env);
    case "POST /api/admin/stats":
      return adminStats(request, env);
    case "POST /api/admin/wipe":
      return adminWipe(request, env);
    default:
      return json({ error: "not_found" }, 404);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (error) {
      console.error(error);
      return json({ error: "server" }, 500);
    }
  },
};
