import { useMemo, useState } from "react";
import { motion } from "motion/react";
import Seo from "../components/common/Seo";
import Button from "../components/common/Button";
import TrendingPost from "../components/trending/TrendingPost";
import { trendingPosts } from "../data/trending";
import { siteConfig } from "../config/site";

export default function Trending() {
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => [...new Set(trendingPosts.map((p) => p.category))], []);
  const posts = category === "all" ? trendingPosts : trendingPosts.filter((p) => p.category === category);
  const chips = ["all", ...categories];

  return (
    <div className="container-page pb-28 pt-28">
      <Seo title="Trending" description="What's new and loved at the studio." />

      <header className="mx-auto max-w-[480px]">
        <h1 className="text-5xl sm:text-6xl">Trending</h1>
        <p className="mt-3 text-mist">Fresh from the workbench. Scroll, pick what you love and add it to your cart.</p>
      </header>

      {trendingPosts.length > 0 ? (
        <>
          <div role="group" aria-label="Filter posts by category" className="no-scrollbar mx-auto mt-6 flex max-w-[480px] gap-2 overflow-x-auto pb-1">
            {chips.map((c) => {
              const on = category === c;
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
                  <span className="relative">{c === "all" ? "All" : c}</span>
                </button>
              );
            })}
          </div>

          <div key={category} className="mx-auto mt-6 flex max-w-[480px] flex-col gap-8">
            {posts.map((p) => (
              <TrendingPost key={p.id} post={p} />
            ))}
          </div>
        </>
      ) : (
        <div className="mx-auto mt-14 max-w-xl rounded-sm border border-dashed border-ivory/20 px-6 py-20 text-center">
          <h2 className="text-4xl">Posts are on their way.</h2>
          <p className="mx-auto mt-3 max-w-md text-mist">Nothing has been added here yet. Message us on WhatsApp in the meantime.</p>
          <Button href={siteConfig.whatsappUrl} variant="outline" className="mt-8">Message us on WhatsApp</Button>
        </div>
      )}
    </div>
  );
}
