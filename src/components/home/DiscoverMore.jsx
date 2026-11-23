import { useMemo } from "react";
import Reveal from "../common/Reveal";
import Button from "../common/Button";
import ProductCard from "../shop/ProductCard";
import { useProducts } from "../../hooks/useProducts";

// Asymmetric 12-column layout with mixed proportions (mobile: 2 columns, first card full width)
const LAYOUT = [
  { cell: "col-span-2 md:col-span-5", ratio: "4/5" },
  { cell: "col-span-1 md:col-span-4 md:mt-28", ratio: "1/1" },
  { cell: "col-span-1 md:col-span-3 md:mt-10", ratio: "3/4" },
  { cell: "col-span-1 md:col-span-3 md:mt-6", ratio: "3/4" },
  { cell: "col-span-1 md:col-span-5 md:mt-20", ratio: "5/4" },
  { cell: "col-span-2 md:col-span-4", ratio: "4/5" },
];

export default function DiscoverMore() {
  const { products, categories } = useProducts();

  // One available piece from each category first, then fill with the newest remaining pieces
  const picks = useMemo(() => {
    const available = products.filter((p) => p.isAvailable);
    const chosen = [];
    categories.forEach((c) => {
      const p = available.find((x) => x.category === c.id);
      if (p) chosen.push(p);
    });
    available
      .filter((p) => !chosen.includes(p))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((p) => {
        if (chosen.length < LAYOUT.length) chosen.push(p);
      });
    return chosen.slice(0, LAYOUT.length);
  }, [products, categories]);

  return (
    <section aria-labelledby="discover-title" className="py-24 sm:py-32">
      <div className="container-page">
        <Reveal className="max-w-2xl">
          <h2 id="discover-title" className="text-5xl sm:text-7xl">Discover More</h2>
          <p className="mt-4 max-w-md text-mist">A little of everything from the studio, from bouquets to keepsakes.</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-12 md:gap-x-8 md:gap-y-16">
          {picks.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 0.08} className={LAYOUT[i].cell}>
              <ProductCard product={p} ratio={LAYOUT[i].ratio} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-24 flex flex-col items-start justify-between gap-8 border-t border-ivory/15 pt-12 sm:flex-row sm:items-end">
          <h3 className="max-w-md text-4xl sm:text-6xl">There's More to Explore</h3>
          <Button to="/shop" variant="primary" size="lg">Explore the Shop</Button>
        </Reveal>
      </div>
    </section>
  );
}
