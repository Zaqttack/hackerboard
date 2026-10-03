import type { Env } from "./env.ts";
import { fail } from "./http.ts";

export const MAX_FAILURES = 10;
export const LOCKOUT_MS = 10 * 60 * 1000;

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([digest(a), digest(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function authorize(request: Request, env: Env, passphrase: unknown): Promise<Response | null> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const now = Date.now();

  const row = await env.DB.prepare("SELECT locked_until FROM admin_failures WHERE ip = ?1")
    .bind(ip)
    .first<{ locked_until: number }>();
  if (row && row.locked_until > now) {
    const retry = Math.ceil((row.locked_until - now) / 1000);
    return fail("locked", 429, { "retry-after": String(retry) });
  }

  const ok =
    typeof passphrase === "string" &&
    typeof env.ADMIN_KEY === "string" &&
    env.ADMIN_KEY.length > 0 &&
    (await safeEqual(passphrase, env.ADMIN_KEY));

  if (ok) {
    await env.DB.prepare("DELETE FROM admin_failures WHERE ip = ?1").bind(ip).run();
    return null;
  }

  await env.DB.prepare(
    `INSERT INTO admin_failures (ip, failures, window_start, locked_until) VALUES (?1, 1, ?2, 0)
     ON CONFLICT (ip) DO UPDATE SET
       failures = CASE WHEN window_start <= ?3 THEN 1 ELSE failures + 1 END,
       window_start = CASE WHEN window_start <= ?3 THEN ?2 ELSE window_start END,
       locked_until = CASE
         WHEN (CASE WHEN window_start <= ?3 THEN 1 ELSE failures + 1 END) >= ?4 THEN ?5
         ELSE locked_until
       END`,
  )
    .bind(ip, now, now - LOCKOUT_MS, MAX_FAILURES, now + LOCKOUT_MS)
    .run();
  return fail("unauthorized", 401);
}
