import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Seo from "../components/common/Seo";
import Button from "../components/common/Button";
import ShopFilters from "../components/shop/ShopFilters";
import ProductCard from "../components/shop/ProductCard";
import CatalogStatus from "../components/common/CatalogStatus";
import { SORT_OPTIONS, useProducts } from "../hooks/useProducts";

export default function Shop() {
  const { products, categories, collections, filterProducts, loading, error } = useProducts();
  const [params, setParams] = useSearchParams();

  // Filters live in the URL so they can be shared, bookmarked and linked from Collections/Footer.
  const categoryParam = params.get("category") ?? "all";
  const collectionParam = params.get("collection") ?? "all";
  const sortParam = params.get("sort") ?? "featured";

  const category = categories.some((c) => c.id === categoryParam) ? categoryParam : "all";
  const activeCollection = collections.find((c) => c.slug === collectionParam) || null;
  const collection = activeCollection ? activeCollection.slug : "all";
  const sort = SORT_OPTIONS.some((o) => o.id === sortParam) ? sortParam : "featured";
  const query = params.get("q") ?? "";
  const minPrice = params.get("min") ?? "";
  const maxPrice = params.get("max") ?? "";

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      const empty = value === "" || value == null || value === "all" || (key === "sort" && value === "featured");
      if (empty) next.delete(key);
      else next.set(key, value);
    });
    setParams(next, { replace: true });
  };
  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  const results = useMemo(
    () => filterProducts(products, { query, category, collection, minPrice, maxPrice, sort }),
    [filterProducts, products, query, category, collection, minPrice, maxPrice, sort]
  );

  const hasFilters = Boolean(query || category !== "all" || collection !== "all" || minPrice || maxPrice || sort !== "featured");
  const priceConflict = minPrice !== "" && maxPrice !== "" && Number(minPrice) > Number(maxPrice);

  return (
    <div className="container-page pb-16 pt-32">
      <Seo title="Shop" description="Browse handmade bouquets, keychains, magazines, personalised gifts and other crafts." />

      <header className="max-w-2xl">
        <h1 className="text-6xl sm:text-8xl">Shop</h1>
        <p className="mt-4 text-lg text-mist">Everything in the studio, made by hand. Add what you love, then send your order to us on WhatsApp.</p>
      </header>

      <div className="mt-12">
        <ShopFilters
          values={{ query, category, sort, minPrice, maxPrice }}
          categories={categories}
          activeCollection={activeCollection}
          onChange={update}
          onClear={clearAll}
          hasFilters={hasFilters}
        />
      </div>

      <CatalogStatus />

      {!loading && !error && (<>
      <p className="mt-10 text-sm text-mist" role="status" aria-live="polite">
        {results.length} {results.length === 1 ? "piece" : "pieces"}
        {priceConflict && " · The minimum price is higher than the maximum."}
      </p>

      {results.length > 0 ? (
        <>
        <h2 className="sr-only">Products</h2>
        <ul className="relative mt-6 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {results.map((p) => (
              <motion.li
                key={p.id}
                layout="position"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard product={p} ratio="4/5" />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        </>
      ) : (
        <div className="mt-6 rounded-sm border border-dashed border-ivory/20 px-6 py-20 text-center">
          <h2 className="text-4xl">Nothing matches that yet.</h2>
          <p className="mx-auto mt-3 max-w-md text-mist">Try a different word, widen the price range or pick another category.</p>
          <Button onClick={clearAll} variant="outline" className="mt-8">Clear all filters</Button>
        </div>
      )}
      </>)}
    </div>
  );
}
