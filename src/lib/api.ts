import type { Entry } from "../shared/types.ts";

export class NetworkError extends Error {}

async function call(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init);
  } catch {
    throw new NetworkError();
  }
}

function post(path: string, body: unknown): Promise<Response> {
  return call(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function fetchWall(): Promise<Entry[]> {
  const response = await call("/api/wall", { cache: "no-store" });
  if (!response.ok) throw new NetworkError();
  return response.json();
}

export async function fetchMe(id: string): Promise<Entry | null> {
  const response = await call(`/api/me?id=${encodeURIComponent(id)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new NetworkError();
  return response.json();
}

export type SignResult =
  | { kind: "ok"; entry: Entry }
  | { kind: "invalid" }
  | { kind: "rejected" }
  | { kind: "turnstile" };

export async function signUp(name: string, turnstileToken: string | null): Promise<SignResult> {
  const response = await post("/api/sign", { name, turnstileToken });
  if (response.status === 201) return { kind: "ok", entry: await response.json() };
  if (response.status === 400) return { kind: "invalid" };
  if (response.status === 422) return { kind: "rejected" };
  if (response.status === 403) return { kind: "turnstile" };
  throw new NetworkError();
}

export type AdminStats = { onBoard: number; recruited: number };

export async function adminStats(passphrase: string): Promise<AdminStats | null> {
  const response = await post("/api/admin/stats", { passphrase });
  if (response.status === 401) return null;
  if (!response.ok) throw new NetworkError();
  return response.json();
}

export async function adminWipe(passphrase: string): Promise<void> {
  const response = await post("/api/admin/wipe", { passphrase });
  if (!response.ok) throw new NetworkError();
}
