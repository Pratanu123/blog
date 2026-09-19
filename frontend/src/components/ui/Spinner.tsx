export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-ink-700 dark:text-paper-100/70" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-rust-500" />
      {label}
    </div>
  );
}
