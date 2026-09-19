import { useEffect, useState } from "react";
import { mediaService } from "../../services/admin";
import type { MediaItem } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Spinner } from "../ui/Spinner";

export function MediaPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
}) {
  const { push } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    mediaService
      .list({ search, per_page: 24 })
      .then((result) => setItems(result.items))
      .catch((error) => push(getErrorMessage(error), "error"))
      .finally(() => setLoading(false));
  }, [open, search, push]);

  async function onUpload(file?: File) {
    if (!file) return;
    try {
      const media = await mediaService.upload(file);
      setItems((current) => [media, ...current]);
      push("Image uploaded");
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  return (
    <Modal open={open} title="Media library" onClose={onClose} className="max-w-4xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search images" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-ink-900 px-4 py-2 text-sm text-white dark:bg-paper-50 dark:text-ink-900">
          Upload
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
        </label>
      </div>
      {loading ? <Spinner /> : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">No images yet. Upload one to get started.</p>
      ) : (
        <div className="grid max-h-[28rem] grid-cols-2 gap-3 overflow-auto sm:grid-cols-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item);
                onClose();
              }}
              className="overflow-hidden rounded-2xl border border-ink-200 text-left dark:border-ink-700"
            >
              <img src={item.url} alt={item.alt_text || item.original_filename} className="aspect-square w-full object-cover" />
              <p className="truncate px-2 py-1 text-xs">{item.original_filename}</p>
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
