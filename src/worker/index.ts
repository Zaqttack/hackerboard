interface Env {
  DB: D1Database;
  ADMIN_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/health") {
      const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM entries").first<{ n: number }>();
      return Response.json({ ok: true, entries: row?.n ?? 0 });
    }

    return new Response("Not found", { status: 404 });
  },
};
