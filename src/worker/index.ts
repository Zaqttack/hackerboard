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

const COLUMNS = "id, name, emoji, fill, tied_to AS tiedTo, created_at AS createdAt";

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
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

function isAdmin(body: Record<string, unknown> | null, env: Env): boolean {
  return !!env.ADMIN_KEY && typeof body?.passphrase === "string" && body.passphrase === env.ADMIN_KEY;
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

  if (!(await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET))) {
    return json({ error: "turnstile" }, 403);
  }

  const { results: recent } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM entries ORDER BY created_at DESC LIMIT ?`,
  )
    .bind(MAX_RECRUITS)
    .all<Entry>();

  const entry: Entry = {
    id: crypto.randomUUID(),
    name: checked.name,
    emoji: pickEmoji(),
    fill: pickFill((recent[0]?.fill as Fill | undefined) ?? null),
    tiedTo: pickTieTarget(recent),
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
  return entry ? json(entry) : json({ error: "not_found" }, 404);
}

async function adminStats(request: Request, env: Env): Promise<Response> {
  if (!isAdmin(await readBody(request), env)) return json({ error: "unauthorized" }, 401);

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
  if (!isAdmin(await readBody(request), env)) return json({ error: "unauthorized" }, 401);

  await env.DB.prepare("DELETE FROM entries").run();
  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const route = `${request.method} ${url.pathname}`;

    switch (route) {
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
  },
};
