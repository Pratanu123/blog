export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white dark:border-ink-800 dark:bg-ink-900">
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  );
}
