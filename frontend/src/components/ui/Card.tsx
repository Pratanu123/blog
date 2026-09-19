import { cn } from "../../utils/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-3xl border border-ink-200/80 bg-white p-5 dark:border-ink-700 dark:bg-ink-900", className)}>
      {children}
    </div>
  );
}
