import { cn } from "../../utils/cn";

const tones: Record<string, string> = {
  draft: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  scheduled: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
  published: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
  archived: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100",
  default: "bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-paper-50",
};

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", tones[tone] || tones.default)}>
      {children}
    </span>
  );
}
