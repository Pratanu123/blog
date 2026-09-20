import type { Article } from "../types";

/** Prefer the editorial byline when set; fall back to the CMS user name. */
export function articleAuthorName(article: Pick<Article, "author_name" | "author"> | null | undefined): string {
  const byline = article?.author_name?.trim();
  if (byline) return byline;
  return article?.author?.name?.trim() || "Unknown author";
}
