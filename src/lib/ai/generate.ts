import type { BrandProfile } from "@/lib/brand-profile";
import { callClaude } from "./anthropic";
import {
  buildSystemPrompt,
  buildUserPrompt,
  type ContentType,
} from "./content-types";
import { getAnthropicEnv } from "./env";

export type GenerateResult =
  | { ok: true; text: string; demo: boolean }
  | { ok: false; error: string };

// Generate (or refine) a draft for one content type. When ANTHROPIC_API_KEY is
// set this calls Claude with a brand-grounded prompt; otherwise it returns a
// deterministic demo draft so the whole flow is exercisable credential-free and
// the UI degrades instead of erroring. `demo` tells the caller which path ran.
export async function generateContent(
  profile: BrandProfile,
  type: ContentType,
  topic: string,
  refine?: string,
): Promise<GenerateResult> {
  const system = buildSystemPrompt(profile, type);
  const userPrompt = buildUserPrompt(topic, refine);

  if (getAnthropicEnv()) {
    const result = await callClaude(system, userPrompt);
    if (result.ok) return { ok: true, text: result.text, demo: false };
    return { ok: false, error: result.error };
  }

  return { ok: true, text: demoDraft(profile, type, topic, refine), demo: true };
}

// A believable placeholder so the studio is fully clickable without an API key.
// Deterministic (no randomness/timestamps) so demo output is stable in tests.
function demoDraft(
  profile: BrandProfile,
  type: ContentType,
  topic: string,
  refine?: string,
): string {
  const brand = profile.name;
  const t = topic.trim() || "your latest update";
  const note = refine?.trim()
    ? `\n\n(Demo mode — refinement noted: "${refine.trim()}")`
    : "\n\n(Demo mode — add ANTHROPIC_API_KEY to generate real on-brand copy.)";

  switch (type.id) {
    case "social_post":
      return `Big news from ${brand}: ${t} is here. ✨\n\nBuilt for people who expect more — come see what's changed.\n\n#${brand.replace(/\s+/g, "")} #marketing #launch${note}`;
    case "ad_copy":
      return `Headline: ${t} — from ${brand}\nBody: ${brand} makes ${t} effortless. Join the teams already getting more done with less. Try it today, no strings attached.\nCTA: Get started${note}`;
    case "seo_article":
      return `# ${t}: A ${brand} Guide\n\n_Meta description: A practical guide to ${t}, from the team at ${brand}._\n\n## Introduction\n- Why ${t} matters right now\n\n## Getting started\n- The essentials, step by step\n\n## Common pitfalls\n- What to avoid and why\n\n## How ${brand} can help\n- Where our product fits in\n\n## Conclusion\n- Key takeaways and next steps${note}`;
    default:
      return `${brand}: ${t}${note}`;
  }
}
