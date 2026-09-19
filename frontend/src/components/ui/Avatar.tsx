export function Avatar({ name, src }: { name: string; src?: string | null }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (src) {
    return <img src={src} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  }

  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-paper-50 dark:bg-paper-50 dark:text-ink-900">
      {initials}
    </span>
  );
}
