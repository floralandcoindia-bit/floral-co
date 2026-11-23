import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import { BASE_CATEGORIES, deriveCategories, labelFromId, slugify } from "../lib/catalog";
import { formatPrice } from "../utils/currency";
import { supabase } from "./supabase";
import { Badge, Field, Sheet, Toggle, card, errMsg } from "./ui";
import ImageUploader from "./ImageUploader";
import CustomisationBuilder, { draftToOptions, optionsToDraft } from "./CustomisationBuilder";

const NEW_CATEGORY = "__new__";

const emptyForm = () => ({
  id: null,
  name: "",
  slug: "",
  slugTouched: false,
  description: "",
  price: "",
  category: "bouquets",
  newCategory: "",
  collection_slug: "",
  images: [],
  featured: false,
  trending: false,
  is_available: true,
  keywordsText: "",
  options: [],
});

const fromRow = (r) => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  slugTouched: true,
  description: r.description || "",
  price: String(r.price),
  category: r.category,
  newCategory: "",
  collection_slug: r.collection_slug || "",
  images: Array.isArray(r.images) ? r.images : [],
  featured: r.featured,
  trending: r.trending,
  is_available: r.is_available,
  keywordsText: (r.keywords || []).join(", "),
  options: optionsToDraft(r.customisation_options),
});

function ProductForm({ initial, collections, categories, onClose, onSaved }) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const editing = Boolean(f.id);

  const onName = (name) => set({ name, ...(f.slugTouched ? {} : { slug: slugify(name) }) });

  const save = async () => {
    const name = f.name.trim();
    const price = Number(f.price);
    const slug = slugify(f.slug || name);
    if (!name) return toast.error("Please give the product a name.");
    if (!Number.isFinite(price) || price < 0) return toast.error("Please enter a valid price.");
    if (!slug) return toast.error("The web address (slug) can't be empty.");
    let category = f.category;
    if (category === NEW_CATEGORY) {
      category = slugify(f.newCategory);
      if (!category) return toast.error("Please type the new category's name.");
    }
    const parsed = draftToOptions(f.options);
    if (parsed.error) return toast.error(parsed.error);

    const row = {
      name,
      slug,
      description: f.description.trim(),
      price,
      category,
      collection_slug: f.collection_slug || null,
      images: f.images,
      featured: f.featured,
      trending: f.trending,
      is_available: f.is_available,
      keywords: f.keywordsText.split(",").map((k) => k.trim()).filter(Boolean),
      customisation_options: parsed.options,
    };

    setSaving(true);
    const id = f.id || `p-${crypto.randomUUID().slice(0, 8)}`;
    const { error } = editing ? await supabase.from("products").update(row).eq("id", id) : await supabase.from("products").insert({ id, ...row });
    setSaving(false);
    if (error) {
      toast.error(error.code === "23505" ? "Another product already uses that web address (slug). Change it and save again." : errMsg(error));
      return;
    }
    toast.success(editing ? "Product saved." : "Product added.");
    onSaved();
  };

  return (
    <Sheet
      title={editing ? "Edit product" : "Add product"}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} variant="ghost" size="sm">Cancel</Button>
          <Button onClick={save} variant="primary" size="sm" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Save product
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Field id="p-name" label="Name">
          <input id="p-name" className="field" value={f.name} onChange={(e) => onName(e.target.value)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="p-price" label="Price (₹)">
            <input id="p-price" className="field" type="number" min="0" step="1" inputMode="decimal" value={f.price} onChange={(e) => set({ price: e.target.value })} />
          </Field>
          <Field id="p-slug" label="Web address (slug)" hint="Made from the name. Only change it if you need to.">
            <input id="p-slug" className="field" value={f.slug} onChange={(e) => set({ slug: e.target.value, slugTouched: true })} />
          </Field>
        </div>
        <Field id="p-desc" label="Description">
          <textarea id="p-desc" className="field" rows={4} value={f.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="p-cat" label="Category">
            <select id="p-cat" className="field" value={f.category} onChange={(e) => set({ category: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              <option value={NEW_CATEGORY}>+ New category…</option>
            </select>
            {f.category === NEW_CATEGORY && (
              <input className="field mt-2" placeholder="New category name" aria-label="New category name" value={f.newCategory} onChange={(e) => set({ newCategory: e.target.value })} />
            )}
          </Field>
          <Field id="p-col" label="Collection">
            <select id="p-col" className="field" value={f.collection_slug} onChange={(e) => set({ collection_slug: e.target.value })}>
              <option value="">No collection</option>
              {collections.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
          </Field>
        </div>

        <div>
          <p className="mb-1.5 text-sm text-ivory">Photos</p>
          <ImageUploader images={f.images} onChange={(images) => set({ images })} folder="products" />
          <p className="mt-1 text-xs text-mist">The first photo is the cover. Without photos the shop shows a placeholder.</p>
        </div>

        <div className="space-y-3 rounded-sm border border-ivory/15 p-4">
          <Toggle checked={f.is_available} onChange={(v) => set({ is_available: v })}>Available to order (turn off to show “Sold out”)</Toggle>
          <Toggle checked={f.featured} onChange={(v) => set({ featured: v })}>Featured (shown in Best Sellers)</Toggle>
          <Toggle checked={f.trending} onChange={(v) => set({ trending: v })}>Trending</Toggle>
        </div>

        <Field id="p-kw" label="Search keywords" hint="Separate with commas, e.g. flowers, gift, everlasting">
          <input id="p-kw" className="field" value={f.keywordsText} onChange={(e) => set({ keywordsText: e.target.value })} />
        </Field>

        <div>
          <p className="mb-1.5 text-sm text-ivory">Customisations</p>
          <CustomisationBuilder draft={f.options} onChange={(options) => set({ options })} />
        </div>
      </div>
    </Sheet>
  );
}

export default function ProductsAdmin() {
  const [rows, setRows] = useState(null);
  const [collections, setCollections] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("collections").select("slug,title").order("sort_order"),
    ]);
    if (p.error) return toast.error(errMsg(p.error));
    setRows(p.data);
    setCollections(c.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => {
    const extra = (rows || []).map((r) => ({ category: r.category }));
    return deriveCategories(extra).length ? deriveCategories(extra) : BASE_CATEGORIES;
  }, [rows]);

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? This can't be undone. (Orders that already include it are not affected.)`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(errMsg(error));
    toast.success("Product deleted.");
    load();
  };

  const toggleAvailable = async (p) => {
    const { error } = await supabase.from("products").update({ is_available: !p.is_available }).eq("id", p.id);
    if (error) return toast.error(errMsg(error));
    setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, is_available: !p.is_available } : r)));
  };

  const shown = (rows || []).filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()));
  const colTitle = (slug) => collections.find((c) => c.slug === slug)?.title;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-5xl">Products</h1>
        <Button onClick={() => setForm(emptyForm())} variant="primary" size="sm"><Plus className="h-4 w-4" aria-hidden="true" /> Add product</Button>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-mist" aria-hidden="true" />
        <input className="field pl-9" placeholder="Search products" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {rows === null ? (
        <p className="mt-10 text-mist">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="mt-10 text-mist">{rows.length ? "No products match." : "No products yet. Add your first one."}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((p) => {
            const img = Array.isArray(p.images) ? p.images[0] : null;
            return (
              <li key={p.id} className={`${card} flex items-center gap-4 p-3`}>
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-sm bg-forest">
                  {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[10px] text-mist">No photo</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ivory">{p.name}</p>
                  <p className="text-sm text-mist">
                    {formatPrice(p.price)} · {labelFromId(p.category)}
                    {colTitle(p.collection_slug) ? ` · ${colTitle(p.collection_slug)}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {p.featured && <Badge tone="gold">Featured</Badge>}
                    {p.trending && <Badge tone="gold">Trending</Badge>}
                    {!p.is_available && <Badge tone="red">Sold out</Badge>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => toggleAvailable(p)} className="hidden rounded-full border border-ivory/20 px-3 py-1 text-xs text-mist hover:text-ivory sm:block">
                    {p.is_available ? "Mark sold out" : "Mark available"}
                  </button>
                  <button type="button" onClick={() => setForm(fromRow(p))} aria-label={`Edit ${p.name}`} className="rounded-full p-2 text-ivory hover:bg-ivory/10"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" onClick={() => remove(p)} aria-label={`Delete ${p.name}`} className="rounded-full p-2 text-red-300 hover:bg-ivory/10"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {form && (
        <ProductForm
          key={form.id || "new"}
          initial={form}
          collections={collections}
          categories={categories}
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
