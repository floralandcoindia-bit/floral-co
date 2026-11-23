import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { hasBackend } from "../lib/config";
import { BASE_CATEGORIES, deriveCategories, fetchCatalog, labelFromId, mapCollection, mapProduct } from "../lib/catalog";
import { products as seedProducts } from "../data/products";
import { collections as seedCollections } from "../data/collections";

const CatalogContext = createContext(null);
const CACHE_KEY = "craft-store:catalog:v1";
const STALE_MS = 60 * 1000;

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (raw && Array.isArray(raw.products) && Array.isArray(raw.collections)) return raw;
  } catch {
    /* ignore a corrupt or unavailable cache */
  }
  return null;
}

const seed = () => ({ products: seedProducts, collections: seedCollections });

/**
 * Loads products and collections from Supabase. Shows the last saved copy instantly (so the shop never flashes empty)
 * and refreshes it in the background. Without Supabase configured, the sample data in src/data is used.
 */
export function CatalogProvider({ children }) {
  const cached = useRef(hasBackend ? readCache() : null);
  const [state, setState] = useState(() => {
    if (!hasBackend) return { ...seed(), loading: false, error: null };
    if (cached.current) return { products: cached.current.products.map(mapProduct), collections: cached.current.collections.map(mapCollection), loading: false, error: null };
    return { products: [], collections: [], loading: true, error: null };
  });
  const lastLoad = useRef(cached.current?.at || 0);

  const load = useCallback(async () => {
    if (!hasBackend) return;
    try {
      const raw = await fetchCatalog();
      lastLoad.current = Date.now();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ...raw, at: lastLoad.current }));
      } catch {
        /* storage full or blocked: fine */
      }
      setState({ products: raw.products.map(mapProduct), collections: raw.collections.map(mapCollection), loading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: s.products.length ? null : err }));
    }
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastLoad.current > STALE_MS) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const value = useMemo(() => {
    const { products, collections } = state;
    const categories = deriveCategories(products);
    const byId = new Map(products.map((p) => [p.id, p]));
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return {
      products,
      collections,
      categories: products.length ? categories : BASE_CATEGORIES,
      loading: state.loading,
      error: state.error,
      reload: load,
      getProductById: (id) => byId.get(id),
      getProductBySlug: (slug) => bySlug.get(slug),
      getCategoryLabel: (id) => categories.find((c) => c.id === id)?.label ?? labelFromId(id),
      getCollectionBySlug: (slug) => collections.find((c) => c.slug === slug),
    };
  }, [state, load]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
