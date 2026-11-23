import { Plus, Trash2 } from "lucide-react";
import { slugify } from "../lib/catalog";

/** Edits the product's customisation options (e.g. "Ribbon colour": Ivory, Sage…). */
export const blankOption = () => ({ key: Math.random().toString(36).slice(2), label: "", type: "select", required: false, choicesText: "", placeholder: "", maxLength: 40 });

export const optionsToDraft = (options = []) =>
  options.map((o) => ({
    key: Math.random().toString(36).slice(2),
    label: o.label || "",
    type: o.type === "text" ? "text" : "select",
    required: Boolean(o.required),
    choicesText: (o.choices || []).join("\n"),
    placeholder: o.placeholder || "",
    maxLength: o.maxLength || 40,
  }));

/** Draft -> stored options. Returns { options } or { error }. */
export function draftToOptions(draft) {
  const used = new Set();
  const options = [];
  for (const d of draft) {
    const label = d.label.trim();
    if (!label) return { error: "Every customisation needs a name (for example “Ribbon colour”)." };
    let id = slugify(label) || "option";
    while (used.has(id)) id += "-2";
    used.add(id);
    if (d.type === "select") {
      const choices = [...new Set(d.choicesText.split(/\n|,/).map((c) => c.trim()).filter(Boolean))];
      if (!choices.length) return { error: `“${label}” needs at least one choice.` };
      options.push({ id, label, type: "select", required: d.required, choices });
    } else {
      const maxLength = Math.max(1, Math.min(200, Number(d.maxLength) || 40));
      options.push({ id, label, type: "text", required: d.required, placeholder: d.placeholder.trim(), maxLength });
    }
  }
  return { options };
}

export default function CustomisationBuilder({ draft, onChange }) {
  const update = (key, patch) => onChange(draft.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  return (
    <div className="space-y-4">
      {draft.length === 0 && <p className="text-sm text-mist">No customisations. Customers just add the product to their cart.</p>}
      {draft.map((d) => (
        <div key={d.key} className="space-y-3 rounded-sm border border-ivory/15 bg-evergreen/40 p-4">
          <div className="flex gap-3">
            <input className="field" placeholder="Name, e.g. Ribbon colour" aria-label="Customisation name" value={d.label} onChange={(e) => update(d.key, { label: e.target.value })} />
            <select className="field w-40" aria-label="Type" value={d.type} onChange={(e) => update(d.key, { type: e.target.value })}>
              <option value="select">Pick from list</option>
              <option value="text">Type text</option>
            </select>
            <button type="button" onClick={() => onChange(draft.filter((x) => x.key !== d.key))} aria-label="Remove customisation" className="rounded p-2 text-red-300 hover:bg-ivory/10">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {d.type === "select" ? (
            <textarea className="field" rows={3} placeholder={"One choice per line\nIvory\nSage\nAntique gold"} aria-label="Choices" value={d.choicesText} onChange={(e) => update(d.key, { choicesText: e.target.value })} />
          ) : (
            <div className="flex gap-3">
              <input className="field" placeholder="Hint, e.g. e.g. Aarohi" aria-label="Hint text" value={d.placeholder} onChange={(e) => update(d.key, { placeholder: e.target.value })} />
              <input className="field w-32" type="number" min="1" max="200" aria-label="Max characters" title="Max characters" value={d.maxLength} onChange={(e) => update(d.key, { maxLength: e.target.value })} />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-ivory">
            <input type="checkbox" checked={d.required} onChange={(e) => update(d.key, { required: e.target.checked })} /> Customer must fill this in
          </label>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...draft, blankOption()])} className="flex items-center gap-2 text-sm text-gold hover:underline">
        <Plus className="h-4 w-4" aria-hidden="true" /> Add a customisation
      </button>
    </div>
  );
}
