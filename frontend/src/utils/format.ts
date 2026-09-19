import { format, formatDistanceToNow } from "date-fns";

function toValidDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string | null, pattern = "MMM d, yyyy") {
  const date = toValidDate(value);
  if (!date) return "—";
  return format(date, pattern);
}

export function formatRelative(value?: string | null) {
  const date = toValidDate(value);
  if (!date) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

export function readingLabel(minutes?: number | null) {
  return `${minutes || 1} min read`;
}

export function mediaUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return path.startsWith("/") ? path : `/storage/${path}`;
}
