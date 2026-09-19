export function textStats(html?: string | null) {
  const text = (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return {
    words,
    characters: text.length,
    readingTime: Math.max(1, Math.ceil(words / 200)),
  };
}
