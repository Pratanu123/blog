import { FormEvent, useEffect, useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { emailCampaignService } from "../../services/admin";
import type { EmailCampaign, EmailTemplate, NewsletterSubscriber } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Field, Input, Textarea } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { formatDate } from "../../utils/format";

const emptyTemplate = {
  name: "",
  subject: "",
  html_body: "",
  description: "",
};

function parseExtraEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function EmailCampaignsPage() {
  const { push } = useToast();
  const [tab, setTab] = useState<"send" | "templates" | "history">("send");

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);

  const [campaignName, setCampaignName] = useState("");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [extraEmails, setExtraEmails] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [sending, setSending] = useState(false);

  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyTemplate);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EmailTemplate | null>(null);
  const [detail, setDetail] = useState<EmailCampaign | null>(null);
  const [resending, setResending] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  const parsedExtras = useMemo(() => parseExtraEmails(extraEmails), [extraEmails]);

  const filteredSubscribers = useMemo(() => {
    const q = subscriberSearch.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) => s.email.toLowerCase().includes(q));
  }, [subscribers, subscriberSearch]);

  const recipientCount = selectedIds.length + parsedExtras.length;

  async function loadCampaigns() {
    const result = await emailCampaignService.list({ page });
    setCampaigns(result.items);
    setLastPage(result.meta.last_page);
  }

  async function loadTemplates() {
    const items = await emailCampaignService.templates();
    setTemplates(items);
    if (!templateId && items[0]) setTemplateId(items[0].id);
  }

  async function loadSubscribers() {
    const result = await emailCampaignService.subscribers({ per_page: 500, status: "active" });
    setSubscribers(result.items);
  }

  useEffect(() => {
    Promise.all([loadTemplates(), loadSubscribers(), loadCampaigns()]).catch((error) =>
      push(getErrorMessage(error), "error"),
    );
  }, []);

  useEffect(() => {
    loadCampaigns().catch((error) => push(getErrorMessage(error), "error"));
  }, [page]);

  function toggleSubscriber(id: number) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  function selectAllVisible() {
    const ids = filteredSubscribers.map((s) => s.id);
    setSelectedIds((current) => Array.from(new Set([...current, ...ids])));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!templateId || recipientCount === 0) {
      push("Choose a template and at least one recipient.", "error");
      return;
    }
    setSending(true);
    try {
      const campaign = await emailCampaignService.send({
        name: campaignName.trim() || `Campaign ${new Date().toLocaleString()}`,
        email_template_id: Number(templateId),
        subscriber_ids: selectedIds,
        emails: parsedExtras,
        scheduled_at: scheduleAt ? new Date(scheduleAt).toISOString() : null,
      });

      if (campaign.status === "scheduled") {
        push(`Scheduled for ${campaign.scheduled_at ? formatDate(campaign.scheduled_at, "MMM d, yyyy HH:mm") : "later"}.`);
      } else {
        push(
          `Sent ${campaign.sent_count} email(s)${campaign.failed_count ? `, ${campaign.failed_count} failed` : ""}.`,
        );
      }
      setCampaignName("");
      setSelectedIds([]);
      setExtraEmails("");
      setScheduleAt("");
      setTab("history");
      setPage(1);
      await loadCampaigns();
    } catch (error) {
      push(getErrorMessage(error), "error");
    } finally {
      setSending(false);
    }
  }

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setForm(emptyTemplate);
  }

  function openEdit(template: EmailTemplate) {
    setCreating(false);
    setEditing(template);
    setForm({
      name: template.name,
      subject: template.subject,
      html_body: template.html_body,
      description: template.description || "",
    });
  }

  async function saveTemplate(event: FormEvent) {
    event.preventDefault();
    try {
      if (editing) {
        await emailCampaignService.updateTemplate(editing.id, form);
        push("Template updated.");
      } else {
        await emailCampaignService.createTemplate(form);
        push("Template created.");
      }
      setEditing(null);
      setCreating(false);
      setForm(emptyTemplate);
      await loadTemplates();
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  async function runPreview(template: EmailTemplate) {
    try {
      const preview = await emailCampaignService.previewTemplate(template.id);
      setPreviewSubject(preview.subject);
      setPreviewHtml(preview.html);
      setPreviewOpen(true);
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  async function openCampaign(campaign: EmailCampaign) {
    try {
      const full = await emailCampaignService.show(campaign.id);
      setDetail(full);
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  async function resendFailed() {
    if (!detail) return;
    setResending(true);
    try {
      const updated = await emailCampaignService.resendFailed(detail.id);
      setDetail(updated);
      push(`Resent failed — ${updated.sent_count} sent, ${updated.failed_count} still failing.`);
      await loadCampaigns();
    } catch (error) {
      push(getErrorMessage(error), "error");
    } finally {
      setResending(false);
    }
  }

  async function resendOne(recipientId: number) {
    if (!detail) return;
    setResending(true);
    try {
      const updated = await emailCampaignService.resendRecipient(detail.id, recipientId);
      setDetail(updated);
      push("Email resent.");
      await loadCampaigns();
    } catch (error) {
      push(getErrorMessage(error), "error");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Outreach</p>
          <h1 className="font-display text-3xl sm:text-4xl">Email campaigns</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Templates, subscribers, extra addresses, schedule, and per-person Resend delivery.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["send", "Send campaign"],
            ["templates", "Templates"],
            ["history", "History"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm ${
              tab === id
                ? "bg-ink-900 text-white dark:bg-paper-50 dark:text-ink-900"
                : "bg-zinc-100 text-zinc-700 dark:bg-ink-800 dark:text-paper-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "send" ? (
        <form onSubmit={onSend} className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900 sm:p-5">
            <Field label="Campaign name">
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="September letter"
                maxLength={160}
              />
            </Field>

            <Field
              label="Template"
              hint="Placeholders: {{email}}, {{site_name}}, {{site_name_html}}, {{year}}, {{logo_block}}, {{logo_url}}, {{site_url}}"
            >
              <select
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">Select template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </Field>

            {selectedTemplate ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-ink-700 dark:bg-ink-950">
                <p className="font-medium">{selectedTemplate.subject}</p>
                <p className="mt-1 text-zinc-500">{selectedTemplate.description || "No description"}</p>
                <Button type="button" variant="ghost" className="mt-2" onClick={() => runPreview(selectedTemplate)}>
                  Preview
                </Button>
              </div>
            ) : null}

            <Field
              label="Extra email addresses"
              hint="Anyone not in the subscriber list. One per line, or comma-separated. Each gets a separate email."
            >
              <Textarea
                value={extraEmails}
                onChange={(e) => setExtraEmails(e.target.value)}
                placeholder={"friend@example.com\neditor@newsroom.com"}
                className="min-h-24"
              />
            </Field>

            <Field
              label="Schedule (optional)"
              hint="Leave empty to send now. Scheduler runs every minute."
            >
              <Input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
              />
            </Field>

            <Button type="submit" disabled={sending || recipientCount === 0 || !templateId}>
              {sending
                ? scheduleAt
                  ? "Scheduling…"
                  : "Sending…"
                : scheduleAt
                  ? `Schedule ${recipientCount} email${recipientCount === 1 ? "" : "s"}`
                  : `Send ${recipientCount || ""} individual email${recipientCount === 1 ? "" : "s"}`}
            </Button>
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl">Subscribers</h2>
              <div className="flex gap-2 text-xs">
                <button type="button" className="underline" onClick={selectAllVisible}>
                  Select visible
                </button>
                <button type="button" className="underline" onClick={clearSelection}>
                  Clear
                </button>
              </div>
            </div>
            <Input
              placeholder="Filter emails"
              value={subscriberSearch}
              onChange={(e) => setSubscriberSearch(e.target.value)}
            />
            <p className="text-xs text-zinc-500">
              {selectedIds.length} subscribers + {parsedExtras.length} extra · separate Resend message each
            </p>
            <div className="max-h-[28rem] space-y-1 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-ink-700">
              {filteredSubscribers.length === 0 ? (
                <p className="p-3 text-sm text-zinc-500">No subscribers yet.</p>
              ) : (
                filteredSubscribers.map((subscriber) => {
                  const checked = selectedIds.includes(subscriber.id);
                  return (
                    <label
                      key={subscriber.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm ${
                        checked ? "bg-rust-500/10" : "hover:bg-zinc-50 dark:hover:bg-ink-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSubscriber(subscriber.id)}
                      />
                      <span className="min-w-0 truncate">{subscriber.email}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </form>
      ) : null}

      {tab === "templates" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" onClick={openCreate}>
              New template
            </Button>
          </div>
          <div className="grid gap-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl">{template.name}</h3>
                      {template.is_system ? <Badge>System</Badge> : null}
                      <Badge>{template.slug}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{template.subject}</p>
                    {template.description ? (
                      <p className="mt-1 text-sm text-zinc-500">{template.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" onClick={() => runPreview(template)}>
                      Preview
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => openEdit(template)}>
                      Edit
                    </Button>
                    {!template.is_system ? (
                      <Button type="button" variant="ghost" onClick={() => setPendingDelete(template)}>
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-ink-800 dark:bg-ink-900">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-ink-800">
                <tr>
                  <th className="p-3">Campaign</th>
                  <th className="p-3">Template</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Sent</th>
                  <th className="p-3">When</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-zinc-500">
                      No campaigns yet.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-zinc-100 dark:border-ink-800">
                      <td className="p-3 font-medium">{campaign.name}</td>
                      <td className="p-3">{campaign.template?.name || "—"}</td>
                      <td className="p-3">
                        <Badge tone={campaign.status === "scheduled" ? "scheduled" : campaign.status === "failed" ? "archived" : "default"}>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {campaign.sent_count}
                        {campaign.failed_count ? ` / ${campaign.failed_count} failed` : ""}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {campaign.status === "scheduled" && campaign.scheduled_at
                          ? `Scheduled ${formatDate(campaign.scheduled_at, "MMM d, HH:mm")}`
                          : campaign.sent_at
                            ? formatDate(campaign.sent_at)
                            : formatDate(campaign.created_at)}
                      </td>
                      <td className="p-3 text-right">
                        <Button type="button" variant="ghost" onClick={() => openCampaign(campaign)}>
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} lastPage={lastPage} onChange={setPage} />
        </div>
      ) : null}

      <Modal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? "Edit template" : "New template"}
      >
        <form onSubmit={saveTemplate} className="space-y-3">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={160} />
          </Field>
          <Field label="Subject" hint="{{site_name}}, {{email}}, {{year}}">
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required maxLength={255} />
          </Field>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={255} />
          </Field>
          <Field label="HTML body" hint="Include {{logo_block}} near the top for the site logo.">
            <Textarea
              value={form.html_body}
              onChange={(e) => setForm({ ...form, html_body: e.target.value })}
              required
              className="min-h-56 font-mono text-xs"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Save template</Button>
          </div>
        </form>
      </Modal>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Template preview" className="max-w-3xl">
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">Subject: {previewSubject}</p>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-ink-700">
            <iframe title="Email preview" className="h-[28rem] w-full bg-white" srcDoc={previewHtml} />
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name || "Campaign"} className="max-w-xl">
        {detail ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone={detail.status === "scheduled" ? "scheduled" : "default"}>{detail.status}</Badge>
              <span>{detail.sent_count} sent</span>
              {detail.failed_count ? <span>{detail.failed_count} failed</span> : null}
              {detail.scheduled_at ? <span>Scheduled {formatDate(detail.scheduled_at, "MMM d, HH:mm")}</span> : null}
            </div>
            {detail.failed_count > 0 ? (
              <Button type="button" variant="outline" disabled={resending} onClick={resendFailed}>
                {resending ? "Resending…" : "Resend all failed"}
              </Button>
            ) : null}
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {(detail.recipients || []).map((recipient) => (
                <div key={recipient.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-ink-700">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{recipient.email}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge>{recipient.status}</Badge>
                      {recipient.status === "failed" ? (
                        <Button type="button" variant="ghost" disabled={resending} onClick={() => resendOne(recipient.id)}>
                          Resend
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {recipient.error ? <p className="mt-1 text-xs text-red-600">{recipient.error}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete template?"
        message={pendingDelete ? `Remove “${pendingDelete.name}”?` : ""}
        confirmLabel="Delete"
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await emailCampaignService.deleteTemplate(pendingDelete.id);
            push("Template deleted.");
            setPendingDelete(null);
            await loadTemplates();
          } catch (error) {
            push(getErrorMessage(error), "error");
          }
        }}
      />

      <div className="flex items-start gap-2 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-ink-700">
        <Mail className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Welcome mail retries until it succeeds. With Resend’s test sender you can only deliver to your Resend account email until you verify a domain. The emblem is embedded inline in sends (works in Gmail). Optional: set a public <strong>https</strong> Email logo URL under Site pages → Site basics. Gmail’s sender avatar needs a verified sending domain (BIMI / Google profile) — it is not set by the email HTML.
        </p>
      </div>
    </div>
  );
}
