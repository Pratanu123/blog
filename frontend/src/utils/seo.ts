import { slugify } from "./slugify";

export function plainText(htmlOrText?: string | null): string {
  return (htmlOrText || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * SEO-friendly slug that keeps the full title meaning.
 * Converts to a clean URL without dropping content words.
 */
export function seoSlugFromTitle(title: string, maxLength = 160): string {
  const full = slugify(title, maxLength + 40);
  if (!full) return "";
  if (full.length <= maxLength) return full;

  // Prefer cutting on a hyphen so we never leave a broken mid-word token.
  const clipped = full.slice(0, maxLength);
  const lastHyphen = clipped.lastIndexOf("-");
  if (lastHyphen > Math.floor(maxLength * 0.6)) {
    return clipped.slice(0, lastHyphen);
  }
  return clipped.replace(/-+$/g, "");
}

/** SERP-friendly title: front-load meaning, stay near 50–60 characters. */
export function seoTitleFromHeadline(title: string, maxLength = 60): string {
  const clean = plainText(title).replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= maxLength) return clean;

  const clipped = clean.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  return (lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped).trim();
}

/** Meta description aimed at ~150–160 chars with a clear snippet. */
export function seoDescriptionFromCopy(
  primary?: string | null,
  fallbackHtml?: string | null,
  maxLength = 155,
): string {
  const source = plainText(primary) || plainText(fallbackHtml);
  if (!source) return "";

  if (source.length <= maxLength) return source;

  const clipped = source.slice(0, maxLength);
  const lastSentence = Math.max(clipped.lastIndexOf(". "), clipped.lastIndexOf("! "), clipped.lastIndexOf("? "));
  if (lastSentence > 90) {
    return clipped.slice(0, lastSentence + 1).trim();
  }

  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > 100 ? clipped.slice(0, lastSpace) : clipped).trim()}…`;
}

export function seoCharTone(length: number, idealMin: number, idealMax: number, hardMax: number): "short" | "good" | "long" | "over" {
  if (length === 0) return "short";
  if (length > hardMax) return "over";
  if (length < idealMin) return "short";
  if (length > idealMax) return "long";
  return "good";
}

export function buildOrganicSeoDefaults(input: {
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
}): {
  slug: string;
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
} {
  const title = input.title || "";
  const metaTitle = seoTitleFromHeadline(title);
  const description = seoDescriptionFromCopy(input.excerpt, input.content);

  return {
    slug: seoSlugFromTitle(title),
    meta_title: metaTitle,
    meta_description: description,
    og_title: metaTitle || title,
    og_description: description,
  };
}
