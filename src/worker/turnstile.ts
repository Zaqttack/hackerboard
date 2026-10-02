const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: unknown, secret: string | undefined): Promise<boolean> {
  if (!secret) return true;
  if (typeof token !== "string" || token === "") return false;

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);

  const response = await fetch(SITEVERIFY, { method: "POST", body });
  const result = (await response.json()) as { success: boolean };
  return result.success;
}
