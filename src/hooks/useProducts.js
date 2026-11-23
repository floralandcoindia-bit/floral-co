import { useMemo } from "react";
import { useCatalog } from "../context/CatalogContext";

export const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "newest", label: "Newest" },
];

const toNumber = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Pure filter + sort used by the Shop page. All options combine. */
export function filterProducts(
  list,
  { query = "", category = "all", collection = "all", minPrice = "", maxPrice = "", sort = "featured" } = {},
  getCategoryLabel = (id) => id
) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const min = toNumber(minPrice);
  const max = toNumber(maxPrice);

  let result = list.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (collection !== "all" && p.collection !== collection) return false;
    if (min !== null && p.price < min) return false;
    if (max !== null && p.price > max) return false;
    if (terms.length) {
      const haystack = [p.name, getCategoryLabel(p.category), ...(p.keywords || [])].join(" ").toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });

  result = [...result];
  switch (sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    default:
      result.sort((a, b) => Number(b.featured) - Number(a.featured)); // stable: keeps data order within groups
  }
  return result;
}

export function useProducts() {
  const catalog = useCatalog();
  const { products, categories, collections, getCategoryLabel } = catalog;
  return useMemo(
    () => ({
      ...catalog,
      bestSellers: products.filter((p) => p.featured),
      trending: products.filter((p) => p.trending),
      getByCollection: (slug) => products.filter((p) => p.collection === slug),
      filterProducts: (list, opts) => filterProducts(list, opts, getCategoryLabel),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog, products, categories, collections]
  );
}
