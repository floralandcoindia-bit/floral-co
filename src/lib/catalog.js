import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { makePlaceholder } from "../utils/placeholder";

export const BASE_CATEGORIES = [
  { id: "magazines", label: "Magazines" },
  { id: "bouquets", label: "Bouquets" },
  { id: "keychains", label: "Keychains" },
  { id: "personalised-gifts", label: "Personalised Gifts" },
  { id: "other-crafts", label: "Other Crafts" },
];

export const labelFromId = (id) =>
  String(id || "")
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const TONES = ["forest", "sage", "gold", "ivory"];
const MOTIFS = ["leaf", "rings", "lines"];
const hashOf = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Products without photos get three tidy placeholder views (same look the sample data used). */
export function placeholderImages(product) {
  const h = hashOf(product.id || product.slug || product.name);
  return [0, 1, 2].map((variant) =>
    makePlaceholder({ label: product.name, w: 800, h: 1000, tone: TONES[h % TONES.length], motif: MOTIFS[h % MOTIFS.length], variant })
  );
}

/** Database row -> the shape the storefront components already use. */
export function mapProduct(row) {
  const images = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
  const product = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    price: Number(row.price) || 0,
    category: row.category || "other-crafts",
    collection: row.collection_slug || null,
    featured: Boolean(row.featured),
    trending: Boolean(row.trending),
    isAvailable: Boolean(row.is_available),
    createdAt: row.created_at,
    keywords: row.keywords || [],
    customisationOptions: Array.isArray(row.customisation_options) ? row.customisation_options : [],
    hasRealImages: images.length > 0,
  };
  product.images = images.length ? images : placeholderImages(product);
  return product;
}

export function mapCollection(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    coverUrl: row.cover_url || "",
    sortOrder: row.sort_order ?? 0,
    theme: { pattern: "botanical", from: "#1B2B23", to: "#496B52", accent: "#82977A", ...(row.theme || {}) },
  };
}

/** Categories = the built-in list plus any extra category an admin typed on a product. */
export function deriveCategories(products) {
  const known = new Map(BASE_CATEGORIES.map((c) => [c.id, c]));
  products.forEach((p) => {
    if (p.category && !known.has(p.category)) known.set(p.category, { id: p.category, label: labelFromId(p.category) });
  });
  return [...known.values()];
}

async function rest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Catalog request failed (${res.status})`);
  return res.json();
}

/** Public read of products and collections (allowed for everyone by row-level security). */
export async function fetchCatalog() {
  const [products, collections] = await Promise.all([
    rest("products?select=*&order=created_at.desc"),
    rest("collections?select=*&order=sort_order.asc,created_at.asc"),
  ]);
  return { products, collections };
}
