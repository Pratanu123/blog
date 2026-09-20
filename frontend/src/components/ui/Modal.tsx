import { useEffect } from "react";
import { cn } from "../../utils/cn";

export function Modal({
  open,
  title,
  onClose,
  children,
  className,
  showCloseButton = true,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button aria-label="Close dialog" className="absolute inset-0 bg-ink-950/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-ink-200 bg-white shadow-lift sm:rounded-3xl dark:border-ink-700 dark:bg-ink-900",
          className,
        )}
      >
        <div className={cn("flex shrink-0 items-center gap-4 border-b border-ink-100 px-5 py-4 dark:border-ink-800", showCloseButton ? "justify-between" : "")}>
          <h2 className="min-w-0 truncate font-display text-xl sm:text-2xl">{title}</h2>
          {showCloseButton ? (
            <button onClick={onClose} className="shrink-0 rounded-full px-3 py-1 text-sm hover:bg-ink-100 dark:hover:bg-ink-800">
              Close
            </button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
