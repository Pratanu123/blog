import { useEffect } from "react";
import { cn } from "../../utils/cn";

export function Modal({
  open,
  title,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close dialog" className="absolute inset-0 bg-ink-950/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn("relative z-10 w-full max-w-lg rounded-3xl border border-ink-200 bg-white p-5 shadow-lift dark:border-ink-700 dark:bg-ink-900", className)}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm hover:bg-ink-100 dark:hover:bg-ink-800">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
