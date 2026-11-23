import { useMemo, useState } from "react";
import { motion } from "motion/react";
import Seo from "../components/common/Seo";
import Button from "../components/common/Button";
import TrendingPost from "../components/trending/TrendingPost";
import { useProducts } from "../hooks/useProducts";
import { siteConfig } from "../config/site";

/** Trending = every product the admin has switched "Trending" on for (Admin → Products). Nothing is hard-coded. */
export default function Trending() {
  const { trending, loading, error, getCategoryLabel } = useProducts();
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => [...new Set(trending.map((p) => p.category))], [trending]);
  // If the chosen category disappears (admin changed something), fall back to "all"
  const active = category === "all" || categories.includes(category) ? category : "all";
  const posts = active === "all" ? trending : trending.filter((p) => p.category === active);
  const chips = ["all", ...categories];

  return (
    <div className="container-page pb-28 pt-28">
      <Seo title="Trending" description="What's new and loved at the studio." />

      <header className="mx-auto max-w-[480px] sm:mx-0 sm:max-w-none">
        <h1 className="text-5xl sm:text-6xl lg:text-8xl">Trending</h1>
        <p className="mt-3 max-w-xl text-mist">Fresh from the workbench. Pick what you love and add it to your cart.</p>
      </header>

      {trending.length > 0 ? (
        <>
          <div
            role="group"
            aria-label="Filter by category"
            className="no-scrollbar mx-auto mt-6 flex max-w-[480px] gap-2 overflow-x-auto pb-1 sm:mx-0 sm:max-w-none sm:flex-wrap sm:overflow-visible"
          >
            {chips.map((c) => {
              const on = active === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCategory(c)}
                  className={`relative shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                    on ? "border-transparent text-forest" : "border-ivory/20 text-mist hover:border-ivory/50 hover:text-ivory"
                  }`}
                >
                  {on && <motion.span layoutId="trending-chip" className="absolute inset-0 rounded-full bg-ivory" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                  <span className="relative">{c === "all" ? "All" : getCategoryLabel(c)}</span>
                </button>
              );
            })}
          </div>

          {/* Phone: one post at a time. Tablet: 2 columns. Laptop: 3. Large screens: 4. */}
          <div key={active} className="mx-auto mt-6 grid max-w-[480px] grid-cols-1 items-start gap-8 sm:mt-8 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((p) => (
              <TrendingPost key={p.id} product={p} />
            ))}
          </div>
        </>
      ) : loading ? (
        <p className="mt-14 text-mist" role="status">Loading what's trending…</p>
      ) : error ? (
        <div className="mx-auto mt-14 max-w-xl rounded-sm border border-dashed border-ivory/20 px-6 py-16 text-center">
          <h2 className="text-3xl">We couldn't load this right now.</h2>
          <p className="mx-auto mt-3 max-w-md text-mist">Please check your connection and refresh the page.</p>
        </div>
      ) : (
        <div className="mx-auto mt-14 max-w-xl rounded-sm border border-dashed border-ivory/20 px-6 py-20 text-center">
          <h2 className="text-4xl">Nothing trending just yet.</h2>
          <p className="mx-auto mt-3 max-w-md text-mist">New favourites will show up here soon. Message us on WhatsApp in the meantime.</p>
          <Button href={siteConfig.whatsappUrl} variant="outline" className="mt-8">Message us on WhatsApp</Button>
        </div>
      )}
    </div>
  );
}
