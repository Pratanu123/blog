import { Button } from "./Button";

export function Pagination({
  page,
  lastPage,
  onChange,
}: {
  page: number;
  lastPage: number;
  onChange: (page: number) => void;
}) {
  if (lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <p className="text-sm text-ink-700 dark:text-paper-100/70">
        Page {page} of {lastPage}
      </p>
      <Button variant="outline" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
