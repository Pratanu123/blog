import { FormEvent, useEffect, useState } from "react";
import { settingsService } from "../../services/admin";
import type { AuditLog, SiteSettings } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui/Button";
import { Field, Input, Textarea } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { formatRelative } from "../../utils/format";

export function SettingsPage() {
  const { push } = useToast();
  const [settings, setSettings] = useState<SiteSettings>({});
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    settingsService.get().then(setSettings);
    settingsService.logs().then((result) => setLogs(result.items));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSettings(await settingsService.save(settings));
      push("Settings saved");
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <h1 className="mb-4 font-display text-3xl">Settings</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Site name"><Input value={settings.site_name || ""} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} /></Field>
          <Field label="Description"><Textarea value={settings.site_description || ""} onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} /></Field>
          <Field label="Site URL"><Input value={settings.site_url || ""} onChange={(e) => setSettings({ ...settings, site_url: e.target.value })} /></Field>
          <Field label="Organization"><Input value={settings.organization_name || ""} onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })} /></Field>
          <Field label="Contact email"><Input value={settings.contact_email || ""} onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })} /></Field>
          <Field label="Blog Inspiration" hint="Split into thought bubbles on the Blog Inspiration page.">
            <Textarea value={settings.about_content || ""} onChange={(e) => setSettings({ ...settings, about_content: e.target.value })} />
          </Field>
          <Field label="About Me" hint="Shown on the About Me page. Separate paragraphs with a blank line.">
            <Textarea value={settings.about_me_content || ""} onChange={(e) => setSettings({ ...settings, about_me_content: e.target.value })} />
          </Field>
          <Button type="submit">Save settings</Button>
        </form>
      </Card>
      <Card>
        <h2 className="mb-4 font-display text-3xl">Audit log</h2>
        <div className="space-y-3 text-sm">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl bg-zinc-50 p-3 dark:bg-ink-800">
              <p className="font-medium">{log.action}</p>
              <p className="text-xs text-zinc-500">{log.user?.name} · {formatRelative(log.created_at)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
