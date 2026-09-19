export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-ink-200 px-6 py-16 text-center dark:border-ink-700">
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-700 dark:text-paper-100/70">{body}</p>
    </div>
  );
}
