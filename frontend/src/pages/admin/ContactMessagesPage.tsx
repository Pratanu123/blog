import { useEffect, useState } from "react";
import { contactMessageService } from "../../services/admin";
import type { ContactMessage } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Badge } from "../../components/ui/Badge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Input, Select } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { formatDate, formatRelative } from "../../utils/format";
import { useDebounce } from "../../hooks/useDebounce";

export function ContactMessagesPage() {
  const { push } = useToast();
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [active, setActive] = useState<ContactMessage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null);
  const debouncedSearch = useDebounce(search);

  async function load() {
    const result = await contactMessageService.list({
      page,
      search: debouncedSearch || undefined,
      status: status || undefined,
    });
    setItems(result.items);
    setLastPage(result.meta.last_page);
    setUnreadCount(result.unread_count ?? 0);
  }

  useEffect(() => {
    load().catch((error) => push(getErrorMessage(error), "error"));
  }, [page, debouncedSearch, status]);

  async function openMessage(message: ContactMessage) {
    try {
      const full = message.is_read ? message : await contactMessageService.show(message.id);
      setActive(full);
      await load();
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Inbox</p>
          <h1 className="font-display text-3xl sm:text-4xl">Contact messages</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          placeholder="Search name, email, or message"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All messages</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white dark:border-ink-800 dark:bg-ink-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-[0.16em] text-zinc-500 dark:border-ink-800">
            <tr>
              <th className="px-4 py-3 font-medium">From</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Received</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No contact messages yet.
                </td>
              </tr>
            ) : (
              items.map((message) => (
                <tr
                  key={message.id}
                  className={`border-t border-zinc-100 align-top dark:border-ink-800 ${message.is_read ? "" : "bg-rust-500/5"}`}
                >
                  <td className="px-4 py-3">
                    <p className={`font-medium ${message.is_read ? "" : "text-ink-950 dark:text-paper-50"}`}>{message.name}</p>
                    <a href={`mailto:${message.email}`} className="text-xs text-zinc-500 hover:text-rust-600">
                      {message.email}
                    </a>
                  </td>
                  <td className="max-w-md px-4 py-3">
                    <button type="button" className="text-left hover:text-rust-600" onClick={() => openMessage(message)}>
                      <p className="line-clamp-2 whitespace-pre-wrap text-ink-800 dark:text-paper-100/85">{message.message}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p>{formatRelative(message.created_at)}</p>
                    <p className="text-xs text-zinc-400">{formatDate(message.created_at, "MMM d, yyyy · h:mm a")}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={message.is_read ? "archived" : "published"}>
                      {message.is_read ? "Read" : "Unread"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="text-sm font-medium hover:text-rust-600" onClick={() => openMessage(message)}>
                        Open
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium hover:text-rust-600"
                        onClick={async () => {
                          try {
                            if (message.is_read) await contactMessageService.markUnread(message.id);
                            else await contactMessageService.markRead(message.id);
                            await load();
                          } catch (error) {
                            push(getErrorMessage(error), "error");
                          }
                        }}
                      >
                        {message.is_read ? "Unread" : "Read"}
                      </button>
                      <button type="button" className="text-sm font-medium text-red-600" onClick={() => setPendingDelete(message)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} lastPage={lastPage} onChange={setPage} />

      <Modal
        open={!!active}
        title={active ? `Message from ${active.name}` : "Message"}
        onClose={() => setActive(null)}
        className="max-w-2xl"
        showCloseButton={false}
      >
        {active ? (
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-zinc-500">From:</span> {active.name}
              </p>
              <p>
                <span className="text-zinc-500">Email:</span>{" "}
                <a href={`mailto:${active.email}`} className="text-rust-600 hover:underline">
                  {active.email}
                </a>
              </p>
              <p className="text-xs text-zinc-400">{formatDate(active.created_at, "MMMM d, yyyy · h:mm a")}</p>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-zinc-50 px-4 py-4 text-sm dark:border-ink-700 dark:bg-ink-950/50">
              <p className="whitespace-pre-wrap leading-7 text-ink-800 dark:text-paper-100/85">{active.message}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href={`mailto:${active.email}?subject=${encodeURIComponent("Re: your message to Ink & Voltage")}`}
                className="inline-flex items-center rounded-full bg-ink-900 px-4 py-2 text-sm text-white dark:bg-paper-50 dark:text-ink-900"
              >
                Reply by email
              </a>
              <button
                type="button"
                className="rounded-full border border-ink-200 px-4 py-2 text-sm dark:border-ink-700"
                onClick={() => setActive(null)}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete message"
        message="This permanently removes the contact message from the inbox."
        confirmLabel="Delete"
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await contactMessageService.destroy(pendingDelete.id);
            push("Message deleted");
            setPendingDelete(null);
            if (active?.id === pendingDelete.id) setActive(null);
            await load();
          } catch (error) {
            push(getErrorMessage(error), "error");
          }
        }}
      />
    </div>
  );
}
