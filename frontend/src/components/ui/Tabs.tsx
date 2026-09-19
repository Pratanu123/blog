import { cn } from "../../utils/cn";

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === value}
          className={cn("rounded-full px-3 py-1 text-sm", tab.id === value ? "bg-ink-900 text-white dark:bg-paper-50 dark:text-ink-900" : "hover:bg-zinc-100 dark:hover:bg-ink-800")}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
