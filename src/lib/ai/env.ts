// Central place to read Anthropic config. Returns null when the API key has not
// been configured yet, so the app can build and generation can fall back to a
// deterministic demo draft without live credentials (see generate.ts, which
// no-ops the live call when this returns null). The key is only ever read
// server-side — this module must never be imported into a client component.
export function getAnthropicEnv(): { apiKey: string; model: string } | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  // Default to the latest Sonnet — the recommended model for high-volume
  // content generation. Override with ANTHROPIC_MODEL (e.g. claude-opus-4-8)
  // for the highest quality at higher cost.
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  return { apiKey, model };
}
