const STORAGE_KEY = "inkvoltage.visitor_key";

export function getVisitorKey(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing && existing.length >= 16) return existing;
  const key =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
  window.localStorage.setItem(STORAGE_KEY, key);
  return key;
}
