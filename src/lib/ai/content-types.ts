import type { BrandProfile } from "@/lib/brand-profile";

// The three content types KLI-5 supports. `kind` is stored on content_items.
export type ContentTypeId = "social_post" | "ad_copy" | "seo_article";

export type ContentType = {
  id: ContentTypeId;
  label: string;
  description: string;
  // Extra, per-type steering appended to the shared brand system prompt.
  instructions: string;
  // Placeholder shown in the topic field.
  topicPlaceholder: string;
};

export const CONTENT_TYPES: ContentType[] = [
  {
    id: "social_post",
    label: "Social post",
    description: "A short, punchy post for social feeds.",
    instructions:
      "Write a single social media post (max ~80 words). Hook in the first line. Include 2–4 relevant hashtags on their own line at the end. No preamble.",
    topicPlaceholder: "Launch of our new summer collection",
  },
  {
    id: "ad_copy",
    label: "Ad copy",
    description: "Conversion-focused ad copy with a clear CTA.",
    instructions:
      "Write conversion-focused ad copy: a headline (max 40 chars), a primary text body (max ~90 words), and a call-to-action button label. Label each part on its own line (Headline:, Body:, CTA:).",
    topicPlaceholder: "Free trial for our project-management tool",
  },
  {
    id: "seo_article",
    label: "SEO article outline",
    description: "A structured outline for a long-form SEO article.",
    instructions:
      "Write an SEO article outline: a working title, a one-sentence meta description, then an H2/H3 heading structure with a short bullet under each section describing what it covers. Use Markdown headings.",
    topicPlaceholder: "How small businesses can use AI for marketing",
  },
];

export function getContentType(id: string): ContentType | undefined {
  return CONTENT_TYPES.find((t) => t.id === id);
}

const NONE = "(not specified)";

// Build the system prompt from the brand profile — this is the context every
// generation is grounded in. Kept deterministic (no timestamps/ids) so it is
// prompt-cache friendly and reproducible.
export function buildSystemPrompt(
  profile: BrandProfile,
  type: ContentType,
): string {
  const list = (arr: string[]) => (arr.length ? arr.join("; ") : NONE);
  return [
    "You are an expert marketing copywriter generating on-brand content for a business.",
    "Write in the brand's voice and stay strictly within the constraints below.",
    "",
    "== Brand profile ==",
    `Name: ${profile.name}`,
    `Description: ${profile.description ?? NONE}`,
    `Products / services: ${profile.products_services ?? NONE}`,
    `Target audience: ${profile.target_audience ?? NONE}`,
    `Tone of voice: ${profile.brand_voice ?? NONE}`,
    `Key messages to weave in where relevant: ${list(profile.key_messages)}`,
    `Banned phrases — never use these: ${list(profile.banned_phrases)}`,
    "",
    "== Task ==",
    `Content type: ${type.label}. ${type.instructions}`,
    "Return only the finished content — no explanations, no options, no meta commentary.",
  ].join("\n");
}

// The user turn: the specific topic plus any refinement instruction.
export function buildUserPrompt(topic: string, refine?: string): string {
  const base = `Topic / brief: ${topic.trim()}`;
  if (refine && refine.trim()) {
    return `${base}\n\nRevise the previous draft with this feedback: ${refine.trim()}`;
  }
  return base;
}
