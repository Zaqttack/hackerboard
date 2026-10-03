import type { Entry } from "../shared/types.ts";

export type SignOutcome = { kind: "ok"; entry: Entry } | { kind: "invalid" | "rejected" | "unverified" | "network" };

export type Me = Entry & { onBoard: boolean };

export async function fetchWall(signal?: AbortSignal): Promise<Entry[]> {
  const res = await fetch("/api/wall", { cache: "no-store", signal });
  if (!res.ok) throw new Error("wall");
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error("wall");
  return data as Entry[];
}

export async function signUp(name: string, turnstileToken: string): Promise<SignOutcome> {
  try {
    const res = await fetch("/api/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, turnstileToken }),
    });
    if (res.status === 201) return { kind: "ok", entry: (await res.json()) as Entry };
    if (res.status === 400) return { kind: "invalid" };
    if (res.status === 422) return { kind: "rejected" };
    if (res.status === 403) return { kind: "unverified" };
  } catch {
    // treated like any other failure to reach the board
  }
  return { kind: "network" };
}

export async function fetchMe(id: string): Promise<Me | null> {
  const res = await fetch(`/api/me?id=${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("me");
  return (await res.json()) as Me;
}

export type AdminStats = { onBoard: number; recruited: number; entries: Entry[] };

export type AdminOutcome<T> =
  | { kind: "ok"; data: T }
  | { kind: "wrong" }
  | { kind: "locked"; minutes: number }
  | { kind: "network" };

async function adminCall<T>(path: string, passphrase: string): Promise<AdminOutcome<T>> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passphrase }),
    });
    if (res.status === 200) return { kind: "ok", data: (await res.json()) as T };
    if (res.status === 401) return { kind: "wrong" };
    if (res.status === 429) {
      const seconds = Number(res.headers.get("retry-after")) || 600;
      return { kind: "locked", minutes: Math.max(1, Math.ceil(seconds / 60)) };
    }
  } catch {
    // treated like any other failure to reach the board
  }
  return { kind: "network" };
}

export const adminStats = (passphrase: string) => adminCall<AdminStats>("/api/admin/stats", passphrase);

export const adminWipe = (passphrase: string) => adminCall<{ ok: true }>("/api/admin/wipe", passphrase);
