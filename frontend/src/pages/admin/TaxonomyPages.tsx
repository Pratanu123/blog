import { FormEvent, useEffect, useState } from "react";
import { taxonomyService } from "../../services/admin";
import type { Category, Tag } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select, Textarea } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";

function flatten(categories: Category[], prefix = ""): Category[] {
  return categories.flatMap((category) => [
    { ...category, name: `${prefix}${category.name}` },
    ...flatten(category.children || [], `${prefix}${category.name} / `),
  ]);
}

export function CategoriesPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState<Partial<Category>>({ name: "", description: "", parent_id: null });

  async function load() {
    setItems(await taxonomyService.categories());
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await taxonomyService.saveCategory(form, form.id);
      setForm({ name: "", description: "", parent_id: null });
      push("Category saved");
      await load();
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <Card>
        <h1 className="mb-4 font-display text-3xl">{form.id ? "Edit category" : "New category"}</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Name"><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Parent">
            <Select value={form.parent_id || ""} onChange={(e) => setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : null })}>
              <option value="">None</option>
              {flatten(items).filter((item) => item.id !== form.id).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Description"><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Button type="submit">Save</Button>
        </form>
      </Card>
      <div className="space-y-3">
        {flatten(items).map((category) => (
          <Card key={category.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-xs text-zinc-500">/{category.slug}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setForm(category)}>Edit</Button>
              <Button variant="ghost" onClick={() => taxonomyService.deleteCategory(category.id).then(() => { push("Deleted"); load(); })}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TagsPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Tag[]>([]);
  const [name, setName] = useState("");

  async function load() {
    setItems(await taxonomyService.tags());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl">Tags</h1>
      <form
        className="flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await taxonomyService.saveTag({ name });
            setName("");
            push("Tag created");
            await load();
          } catch (error) {
            push(getErrorMessage(error), "error");
          }
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New tag" required />
        <Button type="submit">Add</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {items.map((tag) => (
          <button
            key={tag.id}
            className="rounded-full bg-zinc-200 px-3 py-1 text-sm dark:bg-ink-800"
            onClick={() => taxonomyService.deleteTag(tag.id).then(() => { push("Deleted"); load(); })}
          >
            {tag.name} ×
          </button>
        ))}
      </div>
    </div>
  );
}
