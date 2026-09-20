import { useEffect, useState } from "react";
import { mediaService } from "../../services/admin";
import type { MediaItem } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { useDebounce } from "../../hooks/useDebounce";

export function MediaPage() {
  const { push } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const debounced = useDebounce(search);

  async function load() {
    const result = await mediaService.list({ search: debounced, page });
    setItems(result.items);
    setLastPage(result.meta.last_page);
  }

  useEffect(() => {
    load().catch((error) => push(getErrorMessage(error), "error"));
  }, [debounced, page]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <h1 className="font-display text-3xl sm:text-4xl">Media library</h1>
        <label className="rounded-full bg-ink-900 px-4 py-2 text-sm text-white dark:bg-paper-50 dark:text-ink-900">
          Upload image
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.svg,image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                await mediaService.upload(file);
                push("Uploaded");
                await load();
              } catch (error) {
                push(getErrorMessage(error), "error");
              }
            }}
          />
        </label>
      </div>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search images" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-ink-800">
            <img src={item.url} alt={item.alt_text || item.original_filename} className="aspect-square w-full object-cover" />
            <div className="space-y-2 p-3 text-xs">
              <p className="truncate font-medium">{item.original_filename}</p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigator.clipboard.writeText(item.url).then(() => push("URL copied"))}>Copy URL</Button>
                <Button variant="ghost" onClick={() => mediaService.destroy(item.id).then(() => { push("Deleted"); load(); })}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} lastPage={lastPage} onChange={setPage} />
    </div>
  );
}
