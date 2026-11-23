import { useState } from "react";
import { motion } from "motion/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SORT_OPTIONS } from "../../hooks/useProducts";
import { siteConfig } from "../../config/site";

/**
 * Controlled filter bar. `values` come from the URL (Shop page); `onChange` receives a patch like { q: "..." }.
 */
export default function ShopFilters({ values, categories, activeCollection, onChange, onClear, hasFilters }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const { query, category, sort, minPrice, maxPrice } = values;
  const chips = [{ id: "all", label: "All" }, ...categories];
  const symbol = siteConfig.currency.symbol;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" strokeWidth={1.75} aria-hidden="true" />
        <input
          type="text"
          inputMode="search"
          aria-label="Search products"
          placeholder="Search by name, category or keyword"
          value={query}
          onChange={(e) => onChange({ q: e.target.value })}
          className="field !rounded-full !py-3.5 pl-11 pr-12"
        />
        {query && (
          <button
            type="button"
            onClick={() => onChange({ q: "" })}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full transition-colors hover:bg-ivory/10"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div role="group" aria-label="Categories" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((c) => {
          const active = category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ category: c.id })}
              className={`relative shrink-0 rounded-full border px-5 py-2.5 text-sm transition-colors ${
                active ? "border-transparent text-forest" : "border-ivory/20 text-mist hover:border-ivory/50 hover:text-ivory"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="shop-chip"
                  className="absolute inset-0 rounded-full bg-ivory"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative">{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sort + price (collapsible on small screens, always open on large) */}
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        aria-expanded={panelOpen}
        aria-controls="shop-more-filters"
        className="inline-flex items-center gap-2 rounded-full border border-ivory/20 px-5 py-2.5 text-sm text-ivory transition-colors hover:bg-ivory/10 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        Sort and price
      </button>

      <div id="shop-more-filters" className={`${panelOpen ? "grid" : "hidden"} gap-4 sm:grid-cols-3 lg:grid lg:max-w-3xl`}>
        <div>
          <label htmlFor="shop-sort" className="mb-1.5 block text-sm text-mist">Sort by</label>
          <select id="shop-sort" className="field" value={sort} onChange={(e) => onChange({ sort: e.target.value })}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="shop-min" className="mb-1.5 block text-sm text-mist">Min price ({symbol})</label>
          <input id="shop-min" type="number" inputMode="numeric" min="0" placeholder="0" className="field" value={minPrice} onChange={(e) => onChange({ min: e.target.value })} />
        </div>
        <div>
          <label htmlFor="shop-max" className="mb-1.5 block text-sm text-mist">Max price ({symbol})</label>
          <input id="shop-max" type="number" inputMode="numeric" min="0" placeholder="Any" className="field" value={maxPrice} onChange={(e) => onChange({ max: e.target.value })} />
        </div>
      </div>

      {(activeCollection || hasFilters) && (
        <div className="flex flex-wrap items-center gap-3">
          {activeCollection && (
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 py-1.5 pl-4 pr-1.5 text-sm text-ivory">
              Collection: {activeCollection.title}
              <button
                type="button"
                onClick={() => onChange({ collection: "all" })}
                aria-label={`Remove collection filter: ${activeCollection.title}`}
                className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-ivory/10"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          )}
          {hasFilters && (
            <button type="button" onClick={onClear} className="text-sm text-mist underline underline-offset-4 transition-colors hover:text-ivory">
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
