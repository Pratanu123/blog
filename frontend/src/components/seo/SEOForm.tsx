import { Field, Input, Select, Textarea } from "../ui/Input";
import type { Article } from "../../types";

export function SEOForm({
  value,
  onChange,
}: {
  value: Partial<Article>;
  onChange: (patch: Partial<Article>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="SEO title">
        <Input value={value.meta_title || ""} onChange={(e) => onChange({ meta_title: e.target.value })} maxLength={70} />
      </Field>
      <Field label="Meta description">
        <Textarea value={value.meta_description || ""} onChange={(e) => onChange({ meta_description: e.target.value })} maxLength={180} />
      </Field>
      <Field label="Canonical URL">
        <Input value={value.canonical_url || ""} onChange={(e) => onChange({ canonical_url: e.target.value })} />
      </Field>
      <Field label="Open Graph title">
        <Input value={value.og_title || ""} onChange={(e) => onChange({ og_title: e.target.value })} />
      </Field>
      <Field label="Open Graph description">
        <Textarea value={value.og_description || ""} onChange={(e) => onChange({ og_description: e.target.value })} />
      </Field>
      <Field label="Twitter card">
        <Select value={value.twitter_card || "summary_large_image"} onChange={(e) => onChange({ twitter_card: e.target.value })}>
          <option value="summary_large_image">Summary large image</option>
          <option value="summary">Summary</option>
        </Select>
      </Field>
    </div>
  );
}
