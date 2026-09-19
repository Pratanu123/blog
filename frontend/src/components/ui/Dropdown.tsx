import { useState } from "react";

export function Dropdown({
  label,
  items,
}: {
  label: string;
  items: { label: string; onSelect: () => void }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button className="rounded-full px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-ink-800" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {label}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 min-w-40 rounded-2xl border border-zinc-200 bg-white p-1 shadow-lift dark:border-ink-700 dark:bg-ink-900">
          {items.map((item) => (
            <button
              key={item.label}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-ink-800"
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
