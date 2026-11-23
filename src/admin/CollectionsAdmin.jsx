import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import { slugify } from "../lib/catalog";
import { supabase } from "./supabase";
import { Field, Sheet, card, errMsg } from "./ui";
import ImageUploader from "./ImageUploader";

const PATTERNS = [
  ["botanical", "Botanical leaves"],
  ["dots", "Dots"],
  ["handmade-paper", "Handmade paper"],
  ["paper-texture", "Paper texture"],
  ["weave", "Weave"],
  ["stars", "Stars"],
];

const blank = () => ({
  id: null,
  title: "",
  slug: "",
  slugTouched: false,
  description: "",
  cover: [],
  sort_order: 0,
  theme: { pattern: "botanical", from: "#1B2B23", to: "#496B52", accent: "#82977A" },
  productIds: [],
});

function CollectionForm({ initial, products, onClose, onSaved }) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const setTheme = (patch) => setF((x) => ({ ...x, theme: { ...x.theme, ...patch } }));
  const editing = Boolean(f.id);

  const toggle = (id) => set({ productIds: f.productIds.includes(id) ? f.productIds.filter((x) => x !== id) : [...f.productIds, id] });

  const save = async () => {
    const title = f.title.trim();
    const slug = slugify(f.slug || title);
    if (!title) return toast.error("Please give the collection a name.");
    if (!slug) return toast.error("The web address (slug) can't be empty.");

    const row = {
      title,
      slug,
      description: f.description.trim(),
      cover_url: f.cover[0] || null,
      sort_order: Number(f.sort_order) || 0,
      theme: f.theme,
    };
    setSaving(true);
    const id = f.id || `c-${crypto.randomUUID().slice(0, 8)}`;
    const { error } = editing ? await supabase.from("collections").update(row).eq("id", id) : await supabase.from("collections").insert({ id, ...row });
    if (error) {
      setSaving(false);
      toast.error(error.code === "23505" ? "Another collection already uses that web address (slug)." : errMsg(error));
      return;
    }

    // Products in this collection: the ticked ones join, anyone unticked leaves (they keep existing, with no collection).
    const keep = f.productIds;
    const a = keep.length ? await supabase.from("products").update({ collection_slug: slug }).in("id", keep) : { error: null };
    let b = supabase.from("products").update({ collection_slug: null }).eq("collection_slug", slug);
    if (keep.length) b = b.not("id", "in", `(${keep.map((id) => `"${id}"`).join(",")})`);
    const bRes = await b;
    setSaving(false);
    if (a.error || bRes.error) return toast.error(errMsg(a.error || bRes.error));

    toast.success(editing ? "Collection saved." : "Collection added.");
    onSaved();
  };

  return (
    <Sheet
      title={editing ? "Edit collection" : "Add collection"}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} variant="ghost" size="sm">Cancel</Button>
          <Button onClick={save} variant="primary" size="sm" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Save collection
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Field id="c-title" label="Name">
          <input id="c-title" className="field" value={f.title} onChange={(e) => set({ title: e.target.value, ...(f.slugTouched ? {} : { slug: slugify(e.target.value) }) })} />
        </Field>
        <Field id="c-desc" label="Description">
          <textarea id="c-desc" className="field" rows={3} value={f.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="c-slug" label="Web address (slug)">
            <input id="c-slug" className="field" value={f.slug} onChange={(e) => set({ slug: e.target.value, slugTouched: true })} />
          </Field>
          <Field id="c-order" label="Position" hint="Smaller numbers come first.">
            <input id="c-order" className="field" type="number" value={f.sort_order} onChange={(e) => set({ sort_order: e.target.value })} />
          </Field>
        </div>

        <div>
          <p className="mb-1.5 text-sm text-ivory">Cover image</p>
          <ImageUploader images={f.cover} onChange={(cover) => set({ cover })} folder="collections" single />
        </div>

        <div className="space-y-4 rounded-sm border border-ivory/15 p-4">
          <p className="text-sm text-ivory">Look of the collection page</p>
          <Field id="c-pattern" label="Pattern">
            <select id="c-pattern" className="field" value={f.theme.pattern} onChange={(e) => setTheme({ pattern: e.target.value })}>
              {PATTERNS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <div className="flex flex-wrap gap-5">
            {[["from", "Colour from"], ["to", "Colour to"], ["accent", "Accent"]].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm text-ivory">
                <input type="color" value={f.theme[k]} onChange={(e) => setTheme({ [k]: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-ivory/20 bg-transparent" /> {l}
              </label>
            ))}
          </div>
          <div className="h-16 rounded-sm" style={{ background: `linear-gradient(135deg, ${f.theme.from}, ${f.theme.to})` }} aria-hidden="true" />
        </div>

        <div>
          <p className="mb-1.5 text-sm text-ivory">Products in this collection</p>
          {products.length === 0 ? (
            <p className="text-sm text-mist">Add some products first.</p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-sm border border-ivory/15 p-2">
              {products.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 text-sm text-ivory hover:bg-ivory/5">
                    <input type="checkbox" checked={f.productIds.includes(p.id)} onChange={() => toggle(p.id)} />
                    <span className="flex-1">{p.name}</span>
                    {p.collection_slug && p.collection_slug !== f.slug && !f.productIds.includes(p.id) && <span className="text-xs text-mist">in another collection</span>}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-xs text-mist">A product can be in one collection, or none. Ticking it here moves it from its old collection.</p>
        </div>
      </div>
    </Sheet>
  );
}

export default function CollectionsAdmin() {
  const [collections, setCollections] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      supabase.from("collections").select("*").order("sort_order").order("created_at"),
      supabase.from("products").select("id,name,collection_slug").order("name"),
    ]);
    if (c.error) return toast.error(errMsg(c.error));
    setCollections(c.data);
    setProducts(p.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const edit = (c) =>
    setForm({
      id: c.id,
      title: c.title,
      slug: c.slug,
      slugTouched: true,
      description: c.description || "",
      cover: c.cover_url ? [c.cover_url] : [],
      sort_order: c.sort_order ?? 0,
      theme: { pattern: "botanical", from: "#1B2B23", to: "#496B52", accent: "#82977A", ...(c.theme || {}) },
      productIds: products.filter((p) => p.collection_slug === c.slug).map((p) => p.id),
    });

  const remove = async (c) => {
    const n = products.filter((p) => p.collection_slug === c.slug).length;
    if (!window.confirm(`Delete “${c.title}”?${n ? ` Its ${n} product${n === 1 ? "" : "s"} will stay in the shop with no collection.` : ""}`)) return;
    const { error } = await supabase.from("collections").delete().eq("id", c.id);
    if (error) return toast.error(errMsg(error));
    toast.success("Collection deleted.");
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-5xl">Collections</h1>
        <Button onClick={() => setForm(blank())} variant="primary" size="sm"><Plus className="h-4 w-4" aria-hidden="true" /> Add collection</Button>
      </div>

      {collections === null ? (
        <p className="mt-10 text-mist">Loading…</p>
      ) : collections.length === 0 ? (
        <p className="mt-10 text-mist">No collections yet.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {collections.map((c) => {
            const n = products.filter((p) => p.collection_slug === c.slug).length;
            return (
              <li key={c.id} className={`${card} overflow-hidden`}>
                <div className="relative h-24" style={{ background: `linear-gradient(135deg, ${c.theme?.from || "#1B2B23"}, ${c.theme?.to || "#496B52"})` }}>
                  {c.cover_url && <img src={c.cover_url} alt="" className="h-full w-full object-cover opacity-60" />}
                </div>
                <div className="p-4">
                  <p className="font-serif text-2xl text-ivory">{c.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-mist">{c.description}</p>
                  <p className="mt-2 text-xs text-sage">{n} {n === 1 ? "product" : "products"}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => edit(c)} className="flex items-center gap-1.5 rounded-full border border-ivory/25 px-3 py-1.5 text-sm text-ivory hover:bg-ivory/10"><Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit</button>
                    <button type="button" onClick={() => remove(c)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-red-300 hover:bg-ivory/10"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {form && (
        <CollectionForm
          key={form.id || "new"}
          initial={form}
          products={products}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            load();
          }}
        />
      )}
    </div>
  );
}
