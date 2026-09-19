import { FormEvent, useState } from "react";
import { publicService } from "../../services/public";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui/Button";
import { Field, Input, Textarea } from "../../components/ui/Input";

export function ContactPage() {
  const { push } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      await publicService.contact(form);
      setForm({ name: "", email: "", message: "" });
      push("Message sent to the newsroom.");
    } catch (error) {
      push(getErrorMessage(error), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-5xl">Write to us</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Message">
          <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        </Field>
        <Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send"}</Button>
      </form>
    </div>
  );
}
