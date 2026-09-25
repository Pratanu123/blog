import { FormEvent, useEffect, useState } from "react";
import { settingsService } from "../../services/admin";
import type { AuditLog, SiteSettings, WelcomeDoor } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui/Button";
import { Field, Input, Textarea } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { formatRelative } from "../../utils/format";
import { DEFAULT_DOORS, DEFAULT_THOUGHTS, inspirationThoughts, welcomeDoors } from "../../utils/siteContent";

type Tab =
  | "site"
  | "welcome"
  | "inspiration"
  | "about-me"
  | "contact"
  | "dispatch"
  | "photography"
  | "painting"
  | "analytics";

function ensureDoors(settings: SiteSettings): WelcomeDoor[] {
  return welcomeDoors(settings).map((door) => ({ ...door }));
}

function ensureThoughts(settings: SiteSettings): string[] {
  const thoughts = inspirationThoughts(settings);
  return thoughts.length > 0 ? [...thoughts] : [...DEFAULT_THOUGHTS];
}

export function SettingsPage() {
  const { push } = useToast();
  const [settings, setSettings] = useState<SiteSettings>({});
  const [doors, setDoors] = useState<WelcomeDoor[]>(DEFAULT_DOORS);
  const [thoughts, setThoughts] = useState<string[]>(DEFAULT_THOUGHTS);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tab, setTab] = useState<Tab>("welcome");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.get().then((data) => {
      setSettings(data);
      setDoors(ensureDoors(data));
      setThoughts(ensureThoughts(data));
    });
    settingsService.logs().then((result) => setLogs(result.items));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: SiteSettings = {
        ...settings,
        welcome_doors: doors
          .map((door) => ({
            to: door.to.trim(),
            label: door.label.trim(),
            hint: (door.hint || "").trim(),
          }))
          .filter((door) => door.to && door.label),
        inspiration_thoughts: thoughts.map((item) => item.trim()).filter(Boolean),
        about_content: thoughts.map((item) => item.trim()).filter(Boolean).join("\n\n"),
      };
      const saved = await settingsService.save(payload);
      setSettings(saved);
      setDoors(ensureDoors(saved));
      setThoughts(ensureThoughts(saved));
      push("Site content saved — public pages update immediately.");
    } catch (error) {
      push(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "welcome", label: "Welcome Hall" },
    { id: "inspiration", label: "Blog Inspiration" },
    { id: "about-me", label: "About Me" },
    { id: "photography", label: "Photography" },
    { id: "painting", label: "Painting" },
    { id: "contact", label: "Contact Us" },
    { id: "dispatch", label: "Sunday Dispatch" },
    { id: "analytics", label: "Analytics & Search" },
    { id: "site", label: "Site basics" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">CMS</p>
        <h1 className="font-display text-3xl sm:text-4xl">Site pages</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Edit the Welcome Hall, Blog Inspiration, About Me, Photography, Painting, Contact, Sunday Dispatch,
          Analytics & Search Console, and site basics here. Add or remove text blocks and doors — then save.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? "rounded-full bg-ink-900 px-4 py-2 text-sm text-white dark:bg-paper-50 dark:text-ink-900"
                : "rounded-full border border-ink-200 px-4 py-2 text-sm dark:border-ink-700"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="space-y-4">
          {tab === "site" ? (
            <>
              <h2 className="font-display text-2xl">Site basics</h2>
              <Field label="Site name">
                <Input value={settings.site_name || ""} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} />
              </Field>
              <Field label="Description">
                <Textarea value={settings.site_description || ""} onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} />
              </Field>
              <Field
                label="Site URL"
                hint="Use your live HTTPS origin (e.g. https://inkandvoltage.com). If this is left as localhost, sitemap/robots fall back to the server APP_URL."
              >
                <Input value={settings.site_url || ""} onChange={(e) => setSettings({ ...settings, site_url: e.target.value })} />
              </Field>
              <Field label="Default OG image" hint="Public path or https URL used when a page has no custom share image.">
                <Input
                  value={settings.default_og_image || ""}
                  onChange={(e) => setSettings({ ...settings, default_og_image: e.target.value })}
                  placeholder="/logos/ink-voltage-og-1200x630.png"
                />
              </Field>
              <Field label="Twitter / X handle">
                <Input
                  value={settings.twitter_handle || ""}
                  onChange={(e) => setSettings({ ...settings, twitter_handle: e.target.value })}
                  placeholder="@inkvoltage"
                />
              </Field>
              <Field label="Organization">
                <Input value={settings.organization_name || ""} onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })} />
              </Field>
              <Field
                label="Email logo URL"
                hint="Optional public https image for campaigns. Leave blank to embed the Ink & Voltage emblem inline (works in Gmail). Localhost URLs never show in inboxes. Sender avatar in Gmail needs a verified domain + BIMI — not the email HTML."
              >
                <Input
                  value={settings.email_logo_url || settings.organization_logo || ""}
                  onChange={(e) => setSettings({ ...settings, email_logo_url: e.target.value })}
                  placeholder="https://yoursite.com/logos/ink-voltage-mark-148.png"
                />
              </Field>
              <Field label="Contact email (receives form mail)">
                <Input value={settings.contact_email || ""} onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })} />
              </Field>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink-200 px-4 py-3 text-sm dark:border-ink-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings.allow_right_click === "1"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      allow_right_click: e.target.checked ? "1" : "0",
                    })
                  }
                />
                <span>
                  <span className="font-medium text-ink-900 dark:text-paper-50">Allow right-click on the public site</span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-500">
                    Turn this on when you need DevTools / Inspect. Leave off to keep copy, save, and context-menu protection.
                  </span>
                </span>
              </label>
            </>
          ) : null}

          {tab === "analytics" ? (
            <>
              <h2 className="font-display text-2xl">Analytics & Search Console</h2>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Tracking runs on the public site only (journal, galleries, About Me puzzle, etc.). Admin pages are never tracked.
                After you publish a journal piece or gallery work, <code className="text-xs">/sitemap.xml</code> refreshes
                automatically (and again hourly).
              </p>
              <Field
                label="GA4 Measurement ID"
                hint="From Google Analytics → Admin → Data streams → Web. Example: G-XXXXXXXXXX"
              >
                <Input
                  value={settings.ga4_measurement_id || ""}
                  onChange={(e) => setSettings({ ...settings, ga4_measurement_id: e.target.value.trim() })}
                  placeholder="G-XXXXXXXXXX"
                />
              </Field>
              <Field
                label="Search Console meta verification"
                hint="Optional backup. Prefer the HTML file method below for this SPA."
              >
                <Input
                  value={settings.google_site_verification || ""}
                  onChange={(e) => setSettings({ ...settings, google_site_verification: e.target.value.trim() })}
                  placeholder="google-site-verification content value"
                />
              </Field>
              <Field
                label="Verification filename"
                hint="Exact filename Google gives you, e.g. google1234567890abcdef.html"
              >
                <Input
                  value={settings.google_site_verification_filename || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, google_site_verification_filename: e.target.value.trim() })
                  }
                  placeholder="googleXXXXXXXX.html"
                />
              </Field>
              <Field
                label="Verification file contents"
                hint="Paste the full file body Google provides. Served at https://yoursite.com/google….html"
              >
                <Textarea
                  value={settings.google_site_verification_file_content || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, google_site_verification_file_content: e.target.value })
                  }
                  rows={4}
                  placeholder="google-site-verification: …"
                />
              </Field>
            </>
          ) : null}

          {tab === "welcome" ? (
            <>
              <h2 className="font-display text-2xl">Welcome Hall</h2>
              <p className="text-sm text-zinc-500">Homepage arrival screen after the opening animation.</p>
              <Field label="Eyebrow">
                <Input value={settings.welcome_eyebrow || ""} onChange={(e) => setSettings({ ...settings, welcome_eyebrow: e.target.value })} />
              </Field>
              <Field label="Title">
                <Input value={settings.welcome_title || ""} onChange={(e) => setSettings({ ...settings, welcome_title: e.target.value })} />
              </Field>
              <Field label="Subtitle">
                <Textarea value={settings.welcome_subtitle || ""} onChange={(e) => setSettings({ ...settings, welcome_subtitle: e.target.value })} />
              </Field>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Doors / destinations</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDoors((current) => [...current, { to: "/blog", label: "New door", hint: "" }])}
                  >
                    Add door
                  </Button>
                </div>
                {doors.map((door, index) => (
                  <div key={`door-${index}`} className="space-y-2 rounded-2xl border border-ink-200 p-3 dark:border-ink-700">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Door {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setDoors((current) => current.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                    <Field label="Label">
                      <Input
                        value={door.label}
                        onChange={(e) =>
                          setDoors((current) => current.map((item, i) => (i === index ? { ...item, label: e.target.value } : item)))
                        }
                      />
                    </Field>
                    <Field label="Path" hint="Example: /blog, /photography, /about">
                      <Input
                        value={door.to}
                        onChange={(e) =>
                          setDoors((current) => current.map((item, i) => (i === index ? { ...item, to: e.target.value } : item)))
                        }
                      />
                    </Field>
                    <Field label="Hint">
                      <Input
                        value={door.hint || ""}
                        onChange={(e) =>
                          setDoors((current) => current.map((item, i) => (i === index ? { ...item, hint: e.target.value } : item)))
                        }
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {tab === "inspiration" ? (
            <>
              <h2 className="font-display text-2xl">Blog Inspiration</h2>
              <p className="text-sm text-zinc-500">Each thought becomes one floating card. Add or remove freely.</p>
              <Field label="Eyebrow">
                <Input value={settings.inspiration_eyebrow || ""} onChange={(e) => setSettings({ ...settings, inspiration_eyebrow: e.target.value })} />
              </Field>
              <Field label="Title">
                <Input value={settings.inspiration_title || ""} onChange={(e) => setSettings({ ...settings, inspiration_title: e.target.value })} />
              </Field>
              <Field label="Footer label">
                <Input value={settings.inspiration_footer || ""} onChange={(e) => setSettings({ ...settings, inspiration_footer: e.target.value })} />
              </Field>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Thoughts</p>
                  <Button type="button" variant="outline" onClick={() => setThoughts((current) => [...current, ""])}>
                    Add thought
                  </Button>
                </div>
                {thoughts.map((thought, index) => (
                  <div key={`thought-${index}`} className="space-y-2 rounded-2xl border border-ink-200 p-3 dark:border-ink-700">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Thought {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setThoughts((current) => current.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                    <Textarea
                      value={thought}
                      onChange={(e) =>
                        setThoughts((current) => current.map((item, i) => (i === index ? e.target.value : item)))
                      }
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {tab === "about-me" ? (
            <>
              <h2 className="font-display text-2xl">About Me</h2>
              <p className="text-sm text-zinc-500">Letter above the puzzle, plus the body text that fills the puzzle pieces.</p>
              <Field label="Letter greeting">
                <Input value={settings.about_me_greeting || ""} onChange={(e) => setSettings({ ...settings, about_me_greeting: e.target.value })} />
              </Field>
              <Field label="Letter body">
                <Textarea value={settings.about_me_letter || ""} onChange={(e) => setSettings({ ...settings, about_me_letter: e.target.value })} rows={4} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Sign-off">
                  <Input value={settings.about_me_signoff || ""} onChange={(e) => setSettings({ ...settings, about_me_signoff: e.target.value })} />
                </Field>
                <Field label="Signature name">
                  <Input value={settings.about_me_signature || ""} onChange={(e) => setSettings({ ...settings, about_me_signature: e.target.value })} />
                </Field>
              </div>
              <Field label="Puzzle hint">
                <Input value={settings.about_me_puzzle_hint || ""} onChange={(e) => setSettings({ ...settings, about_me_puzzle_hint: e.target.value })} />
              </Field>
              <Field label="About Me body" hint="Split paragraphs with a blank line. This text is cut into puzzle pieces.">
                <Textarea value={settings.about_me_content || ""} onChange={(e) => setSettings({ ...settings, about_me_content: e.target.value })} rows={10} />
              </Field>
            </>
          ) : null}

          {tab === "contact" ? (
            <>
              <h2 className="font-display text-2xl">Contact Us</h2>
              <Field label="Page title">
                <Input value={settings.contact_title || ""} onChange={(e) => setSettings({ ...settings, contact_title: e.target.value })} />
              </Field>
              <Field label="Intro">
                <Textarea value={settings.contact_intro || ""} onChange={(e) => setSettings({ ...settings, contact_intro: e.target.value })} />
              </Field>
              <Field label="Submit button label">
                <Input value={settings.contact_submit_label || ""} onChange={(e) => setSettings({ ...settings, contact_submit_label: e.target.value })} />
              </Field>
              <Field label="Success message">
                <Input value={settings.contact_success_message || ""} onChange={(e) => setSettings({ ...settings, contact_success_message: e.target.value })} />
              </Field>
              <Field label="Inbox email">
                <Input value={settings.contact_email || ""} onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })} />
              </Field>
            </>
          ) : null}

          {tab === "photography" ? (
            <>
              <h2 className="font-display text-2xl">Photography</h2>
              <p className="text-sm text-zinc-500">Static intro copy for the public Photography gallery page.</p>
              <Field label="Eyebrow">
                <Input
                  value={settings.photography_eyebrow || ""}
                  onChange={(e) => setSettings({ ...settings, photography_eyebrow: e.target.value })}
                  placeholder="Photography"
                />
              </Field>
              <Field label="Title">
                <Input
                  value={settings.photography_title || ""}
                  onChange={(e) => setSettings({ ...settings, photography_title: e.target.value })}
                  placeholder="Light, place, and the frame around both."
                />
              </Field>
              <Field label="Intro">
                <Textarea
                  value={settings.photography_body || ""}
                  onChange={(e) => setSettings({ ...settings, photography_body: e.target.value })}
                  rows={4}
                  placeholder="A separate gallery of photographs — each with its own ALT text, short caption, and description."
                />
              </Field>
            </>
          ) : null}

          {tab === "painting" ? (
            <>
              <h2 className="font-display text-2xl">Painting</h2>
              <p className="text-sm text-zinc-500">Static intro copy for the public Painting gallery page.</p>
              <Field label="Eyebrow">
                <Input
                  value={settings.painting_eyebrow || ""}
                  onChange={(e) => setSettings({ ...settings, painting_eyebrow: e.target.value })}
                  placeholder="Painting"
                />
              </Field>
              <Field label="Title">
                <Input
                  value={settings.painting_title || ""}
                  onChange={(e) => setSettings({ ...settings, painting_title: e.target.value })}
                  placeholder="Color held still long enough to look twice."
                />
              </Field>
              <Field label="Intro">
                <Textarea
                  value={settings.painting_body || ""}
                  onChange={(e) => setSettings({ ...settings, painting_body: e.target.value })}
                  rows={4}
                  placeholder="A separate gallery of paintings — each with its own ALT text, short caption, and description."
                />
              </Field>
            </>
          ) : null}

          {tab === "dispatch" ? (
            <>
              <h2 className="font-display text-2xl">Sunday Dispatch</h2>
              <p className="text-sm text-zinc-500">
                Footer newsletter signup that appears on every public page.
              </p>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink-200 px-4 py-3 text-sm dark:border-ink-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings.newsletter_enabled !== "0"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      newsletter_enabled: e.target.checked ? "1" : "0",
                    })
                  }
                />
                <span>
                  <span className="font-medium text-ink-900 dark:text-paper-50">Show newsletter signup</span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-500">
                    Turn off to hide the Sunday Dispatch box in the site footer.
                  </span>
                </span>
              </label>
              <Field label="Title">
                <Input
                  value={settings.dispatch_title || ""}
                  onChange={(e) => setSettings({ ...settings, dispatch_title: e.target.value })}
                  placeholder="The Sunday dispatch"
                />
              </Field>
              <Field label="Subtitle">
                <Textarea
                  value={settings.dispatch_subtitle || ""}
                  onChange={(e) => setSettings({ ...settings, dispatch_subtitle: e.target.value })}
                  placeholder="One letter. No noise. Unsubscribe whenever the weather changes."
                  rows={3}
                />
              </Field>
              <Field label="Email placeholder">
                <Input
                  value={settings.dispatch_placeholder || ""}
                  onChange={(e) => setSettings({ ...settings, dispatch_placeholder: e.target.value })}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Button label">
                <Input
                  value={settings.dispatch_button_label || ""}
                  onChange={(e) => setSettings({ ...settings, dispatch_button_label: e.target.value })}
                  placeholder="Subscribe"
                />
              </Field>
            </>
          ) : null}

          <Button type="submit" variant="rust" disabled={saving}>
            {saving ? "Saving…" : "Save page content"}
          </Button>
        </Card>

        <Card>
          <h2 className="mb-4 font-display text-2xl">Recent changes</h2>
          <div className="space-y-3 text-sm">
            {logs.length === 0 ? <p className="text-zinc-500">No audit entries yet.</p> : null}
            {logs.slice(0, 12).map((log) => (
              <div key={log.id} className="rounded-2xl bg-zinc-50 p-3 dark:bg-ink-800">
                <p className="font-medium">{log.action}</p>
                <p className="text-xs text-zinc-500">
                  {log.user?.name} · {formatRelative(log.created_at)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </form>
    </div>
  );
}
