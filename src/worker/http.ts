export const MAX_BODY_BYTES = 2048;

export function json(body: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(body, { status, headers });
}

export function fail(error: string, status: number, headers?: HeadersInit): Response {
  return json({ error }, status, headers);
}

export function checkPost(request: Request): Response | null {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin) return fail("forbidden", 403);
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return fail("forbidden", 403);
  const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type !== "application/json") return fail("unsupported", 415);
  return null;
}

export async function readJson(request: Request): Promise<{ body: Record<string, unknown> } | { response: Response }> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return { response: fail("too_large", 413) };

  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return { response: fail("too_large", 413) };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes));
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return { body: parsed as Record<string, unknown> };
    }
  } catch {
    // fall through to the generic invalid response
  }
  return { response: fail("invalid", 400) };
}
