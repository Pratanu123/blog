import type { SiteSettings, WelcomeDoor } from "../types";

const DEFAULT_DOORS: WelcomeDoor[] = [
  { to: "/blog", label: "To the journal", hint: "Essays, systems, and long-form notes" },
  { to: "/photography", label: "To the photos", hint: "Light, place, and quiet frames" },
  { to: "/painting", label: "To the paintings", hint: "Colour, texture, and hand-made marks" },
  { to: "/about", label: "To the blog inspiration", hint: "Why this room exists" },
  { to: "/about-me", label: "To the about me", hint: "A puzzle, a letter, a person" },
];

const DEFAULT_THOUGHTS = [
  "Ink & Voltage is an independent editorial project — long-form writing on software, design, and the systems underneath both.",
  "We still believe a sentence can carry more weight than a dashboard full of metrics.",
  "The quieter decisions are usually the ones that make products last.",
  "Editors want a quiet room with the right levers in reach, not another control panel.",
  "Publish when the thought is ready. Not when the calendar asks.",
  "A magazine should feel like a mind at work — curious, unfinished, and alive.",
  "Design is the way an idea arrives before anyone has to explain it.",
  "Stay with the draft until the words start answering back.",
];

function asArray<T>(value: unknown): T[] | null {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function welcomeDoors(settings: SiteSettings): WelcomeDoor[] {
  const doors = asArray<WelcomeDoor>(settings.welcome_doors);
  const cleaned = (doors || [])
    .map((door) => ({
      to: String(door?.to || "").trim(),
      label: String(door?.label || "").trim(),
      hint: String(door?.hint || "").trim(),
    }))
    .filter((door) => door.to && door.label);
  return cleaned.length > 0 ? cleaned : DEFAULT_DOORS;
}

export function inspirationThoughts(settings: SiteSettings): string[] {
  const fromJson = asArray<string>(settings.inspiration_thoughts)
    ?.map((item) => String(item || "").trim())
    .filter(Boolean);
  if (fromJson && fromJson.length > 0) return fromJson;

  const legacy = (settings.about_content || "").trim();
  if (legacy) {
    const lines = legacy
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length > 1) return lines;
    const sentences = legacy
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((part) => part.trim())
      .filter(Boolean);
    if (sentences && sentences.length > 0) return sentences;
  }

  return DEFAULT_THOUGHTS;
}

export { DEFAULT_DOORS, DEFAULT_THOUGHTS };
