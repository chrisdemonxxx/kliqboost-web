import { getAnthropicEnv } from "./env";

const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export type AnthropicResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

// Server-side call to the Anthropic Messages API via fetch (no SDK dependency,
// keeps the bundle lean and the key server-only). Returns a structured result
// rather than throwing so callers can degrade gracefully. Never import this
// from a client component — it reads ANTHROPIC_API_KEY.
export async function callClaude(
  system: string,
  userPrompt: string,
): Promise<AnthropicResult> {
  const env = getAnthropicEnv();
  if (!env) return { ok: false, error: "not_configured" };

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: env.model,
        max_tokens: 2048,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
  } catch {
    return { ok: false, error: "Could not reach the AI service. Try again." };
  }

  if (!res.ok) {
    // Don't leak provider error bodies (may echo the request) to the client.
    return {
      ok: false,
      error:
        res.status === 429
          ? "The AI service is busy right now. Try again in a moment."
          : "The AI service returned an error. Try again.",
    };
  }

  const data = (await res.json()) as {
    stop_reason?: string;
    content?: Array<{ type: string; text?: string }>;
  };

  if (data.stop_reason === "refusal") {
    return { ok: false, error: "The AI declined to generate this content." };
  }

  // A max_tokens stop still returns HTTP 200 with usable-looking text, but the
  // draft is cut off mid-sentence. Publishing it would present a truncated
  // draft as a finished one, so fail instead of returning partial copy.
  if (data.stop_reason === "max_tokens") {
    return {
      ok: false,
      error: "The draft was cut off before it finished. Try a shorter piece.",
    };
  }

  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!text) return { ok: false, error: "The AI returned an empty response." };
  return { ok: true, text };
}
