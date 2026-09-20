/** URL-safe slug, aligned with Laravel Str::slug for common Latin titles. */
export function slugify(value: string, maxLength = 220): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!slug) return "";
  return slug.length > maxLength ? slug.slice(0, maxLength).replace(/-+$/g, "") : slug;
}
