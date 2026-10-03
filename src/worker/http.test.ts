import { describe, expect, it } from "vitest";
import { safeEqual } from "./admin.ts";
import { checkPost, MAX_BODY_BYTES, readJson } from "./http.ts";

function post(headers: Record<string, string>, body = "{}") {
  return new Request("https://board.example/api/sign", { method: "POST", headers, body });
}

const good = { origin: "https://board.example", "content-type": "application/json" };

describe("checkPost", () => {
  it("accepts a same-origin JSON post", () => {
    expect(checkPost(post(good))).toBeNull();
    expect(checkPost(post({ ...good, "sec-fetch-site": "same-origin" }))).toBeNull();
    expect(checkPost(post({ ...good, "content-type": "Application/JSON; charset=utf-8" }))).toBeNull();
  });

  it("rejects a missing or foreign Origin", async () => {
    const { origin: _origin, ...noOrigin } = good;
    expect(checkPost(post(noOrigin))?.status).toBe(403);
    expect(checkPost(post({ ...good, origin: "https://evil.example" }))?.status).toBe(403);
    expect(checkPost(post({ ...good, origin: "null" }))?.status).toBe(403);
    expect(checkPost(post({ ...good, origin: "https://board.example.evil.example" }))?.status).toBe(403);
  });

  it("rejects cross-site fetch metadata", () => {
    expect(checkPost(post({ ...good, "sec-fetch-site": "cross-site" }))?.status).toBe(403);
    expect(checkPost(post({ ...good, "sec-fetch-site": "same-site" }))?.status).toBe(403);
  });

  it("rejects other content types", () => {
    expect(checkPost(post({ ...good, "content-type": "text/plain" }))?.status).toBe(415);
    expect(checkPost(post({ ...good, "content-type": "application/x-www-form-urlencoded" }))?.status).toBe(415);
    expect(checkPost(post({ origin: good.origin }))?.status).toBe(415);
  });
});

describe("readJson", () => {
  it("parses an object", async () => {
    const result = await readJson(post(good, '{"name":"Maya"}'));
    expect(result).toEqual({ body: { name: "Maya" } });
  });

  it.each(["", "not json", "[1]", "null", "42", '"x"', "{"])("rejects %j as invalid", async (body) => {
    const result = await readJson(post(good, body));
    expect("response" in result && result.response.status).toBe(400);
  });

  it("rejects invalid UTF-8", async () => {
    const request = new Request("https://board.example/api/sign", {
      method: "POST",
      headers: good,
      body: new Uint8Array([0x7b, 0x22, 0xff, 0x22, 0x3a, 0x31, 0x7d]),
    });
    const result = await readJson(request);
    expect("response" in result && result.response.status).toBe(400);
  });

  it("caps the body", async () => {
    const big = JSON.stringify({ name: "a".repeat(MAX_BODY_BYTES) });
    const result = await readJson(post(good, big));
    expect("response" in result && result.response.status).toBe(413);
  });

  it("caps a body that lies about its length", async () => {
    const request = new Request("https://board.example/api/sign", {
      method: "POST",
      headers: { ...good, "content-length": "10" },
      body: JSON.stringify({ name: "a".repeat(MAX_BODY_BYTES) }),
    });
    const result = await readJson(request);
    expect("response" in result && result.response.status).toBe(413);
  });
});

describe("safeEqual", () => {
  it("compares equal and unequal strings", async () => {
    expect(await safeEqual("letmein", "letmein")).toBe(true);
    expect(await safeEqual("letmein", "letmeim")).toBe(false);
    expect(await safeEqual("letmein", "letmein ")).toBe(false);
    expect(await safeEqual("", "letmein")).toBe(false);
    expect(await safeEqual("a".repeat(5000), "a")).toBe(false);
  });
});
