import { MAX_RECRUITS } from "../shared/constants.ts";
import type { Entry, Fill } from "../shared/types.ts";
import { authorize } from "./admin.ts";
import type { Env } from "./env.ts";
import { checkPost, fail, json, readJson } from "./http.ts";
import { pickEmoji, pickFill, pickTie } from "./pick.ts";
import { verifyTurnstile } from "./turnstile.ts";
import { validateName } from "./validate.ts";

const FLOOD_LIMIT = 60;
const FLOOD_WINDOW_MS = 30_000;
const COLUMNS = "id, name, emoji, fill, tied_to AS tiedTo, created_at AS createdAt";

type Row = Omit<Entry, "fill"> & { fill: Fill };

async function newest(env: Env, limit: number): Promise<Row[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM entries ORDER BY created_at DESC, rowid DESC LIMIT ?1`,
  )
    .bind(limit)
    .all<Row>();
  return results;
}

async function wall(env: Env): Promise<Response> {
  return json((await newest(env, MAX_RECRUITS)).reverse());
}

async function sign(request: Request, env: Env): Promise<Response> {
  const rejected = checkPost(request);
  if (rejected) return rejected;
  const parsed = await readJson(request);
  if ("response" in parsed) return parsed.response;

  const name = validateName(parsed.body.name);
  if (!name.ok) return fail(name.reason, name.reason === "invalid" ? 400 : 422);

  const now = Date.now();
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM entries WHERE created_at > ?1")
    .bind(now - FLOOD_WINDOW_MS)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= FLOOD_LIMIT) return fail("busy", 429, { "retry-after": "5" });

  if (env.TURNSTILE_SECRET) {
    const ip = request.headers.get("cf-connecting-ip");
    if (!(await verifyTurnstile(env.TURNSTILE_SECRET, parsed.body.turnstileToken, ip))) {
      return fail("turnstile", 403);
    }
  }

  const board = await newest(env, MAX_RECRUITS);
  const entry: Row = {
    id: crypto.randomUUID(),
    name: name.name,
    emoji: pickEmoji(),
    fill: pickFill(board[0]?.fill ?? null),
    tiedTo: pickTie(board),
    createdAt: now,
  };
  await env.DB.prepare(
    "INSERT INTO entries (id, name, emoji, fill, tied_to, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
  )
    .bind(entry.id, entry.name, entry.emoji, entry.fill, entry.tiedTo, entry.createdAt)
    .run();

  return json(entry, 201);
}

async function me(url: URL, env: Env): Promise<Response> {
  const id = url.searchParams.get("id");
  if (!id || id.length > 64) return fail("not_found", 404);

  const row = await env.DB.prepare(`SELECT ${COLUMNS}, rowid AS rid FROM entries WHERE id = ?1`)
    .bind(id)
    .first<Row & { rid: number }>();
  if (!row) return fail("not_found", 404);

  const newer = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM entries WHERE created_at > ?1 OR (created_at = ?1 AND rowid > ?2)",
  )
    .bind(row.createdAt, row.rid)
    .first<{ n: number }>();

  const { rid: _rid, ...entry } = row;
  return json({ ...entry, onBoard: (newer?.n ?? 0) < MAX_RECRUITS });
}

async function admin(request: Request, env: Env, action: "stats" | "wipe"): Promise<Response> {
  const rejected = checkPost(request);
  if (rejected) return rejected;
  const parsed = await readJson(request);
  if ("response" in parsed) return parsed.response;
  const denied = await authorize(request, env, parsed.body.passphrase);
  if (denied) return denied;

  if (action === "wipe") {
    await env.DB.prepare("DELETE FROM entries").run();
    return json({ ok: true });
  }

  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM entries ORDER BY created_at ASC, rowid ASC`,
  ).all<Row>();
  return json({
    onBoard: Math.min(results.length, MAX_RECRUITS),
    recruited: results.length,
    entries: results,
  });
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname}`;

  switch (key) {
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
      return admin(request, env, "stats");
    case "POST /api/admin/wipe":
      return admin(request, env, "wipe");
  }

  const known = ["/api/health", "/api/wall", "/api/sign", "/api/me", "/api/admin/stats", "/api/admin/wipe"];
  if (known.includes(url.pathname)) return fail("method_not_allowed", 405);
  return fail("not_found", 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let response: Response;
    try {
      response = await route(request, env);
    } catch (error) {
      console.error(error);
      response = fail("server_error", 500);
    }
    response.headers.set("cache-control", "no-store");
    response.headers.set("x-content-type-options", "nosniff");
    return response;
  },
};
