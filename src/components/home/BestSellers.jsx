import { useCallback, useEffect, useRef } from "react";
import Reveal from "../common/Reveal";
import Button from "../common/Button";
import ProductCard from "../shop/ProductCard";
import { useProducts } from "../../hooks/useProducts";
import { useDragScroll } from "../../hooks/useDragScroll";

const RATIOS = ["4/5"]; // same proportions so every card starts and ends on the same line

export default function BestSellers() {
  const { bestSellers } = useProducts();
  const scroller = useRef(null);
  const bar = useRef(null);
  useDragScroll(scroller);

  // Thin progress line showing how much of the gallery has been seen (no arrows or dots)
  const updateProgress = useCallback(() => {
    const el = scroller.current;
    const b = bar.current;
    if (!el || !b) return;
    const seen = (el.scrollLeft + el.clientWidth) / el.scrollWidth;
    b.style.transform = `scaleX(${Math.min(1, Math.max(0.05, seen))})`;
  }, []);

  useEffect(() => {
    updateProgress();
    window.addEventListener("resize", updateProgress);
    return () => window.removeEventListener("resize", updateProgress);
  }, [updateProgress]);

  return (
    <section aria-labelledby="best-sellers-title" className="py-24 sm:py-32">
      <div className="container-page flex items-end justify-between gap-6">
        <Reveal>
          <h2 id="best-sellers-title" className="text-5xl sm:text-7xl">Best Sellers</h2>
          <p className="mt-4 max-w-md text-mist">The pieces people reach for first. Drag, swipe or scroll sideways to browse.</p>
        </Reveal>
        <Button to="/shop" variant="outline" size="sm" className="hidden sm:inline-flex">View all</Button>
      </div>

      <div
        ref={scroller}
        onScroll={updateProgress}
        role="region"
        aria-label="Best sellers gallery"
        tabIndex={0}
        className="drag-scroll no-scrollbar mt-12 flex items-start gap-5 overflow-x-auto overscroll-x-contain px-5 pb-6 sm:gap-8 sm:px-8 lg:pl-[max(3rem,calc((100%_-_80rem)/2_+_3rem))] lg:pr-12"
      >
        {bestSellers.map((p, i) => (
          <div key={p.id} className="w-[74vw] shrink-0 sm:w-[340px] lg:w-[400px]">
            <ProductCard product={p} ratio={RATIOS[i % RATIOS.length]} />
          </div>
        ))}
      </div>

      <div className="container-page mt-6">
        <div className="h-px bg-ivory/15">
          <div ref={bar} className="h-px origin-left bg-gold" style={{ transform: "scaleX(0.2)" }} />
        </div>
        <Button to="/shop" variant="outline" size="sm" className="mt-8 sm:hidden">View all</Button>
      </div>
    </section>
  );
}
