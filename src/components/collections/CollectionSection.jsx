import { useEffect, useRef } from "react";
import { motion, useMotionValue, useScroll, useTransform } from "motion/react";
import Button from "../common/Button";
import ProductCard from "../shop/ProductCard";
import CollectionBackdrop from "./CollectionBackdrop";
import { useProducts } from "../../hooks/useProducts";
import { useDragScroll } from "../../hooks/useDragScroll";

export default function CollectionSection({ collection, index }) {
  const { getByCollection } = useProducts();
  const items = getByCollection(collection.slug);
  const { theme } = collection;
  const flip = index % 2 === 1;
  const titleId = `collection-${collection.slug}`;

  const card = useRef(null);
  const row = useRef(null);
  useDragScroll(row);

  // The collection background starts dark and lightens as you scroll: sideways through the row, or down the page.
  const sideways = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: card, offset: ["start end", "center center"] });
  const darkness = useTransform([sideways, scrollYProgress], ([h, v]) => 0.6 * (1 - Math.max(h, v)));

  useEffect(() => {
    const el = row.current;
    if (!el) return undefined;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      sideways.set(max > 4 ? Math.min(1, el.scrollLeft / max) : 0);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sideways, items.length]);

  return (
    <section id={collection.slug} aria-labelledby={titleId} className="scroll-mt-24 py-6 sm:py-10">
      <div className="container-page">
        <div
          ref={card}
          className="relative overflow-hidden rounded-sm border border-ivory/10"
          style={{ background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)` }}
        >
          {collection.coverUrl && (
            <img src={collection.coverUrl} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-luminosity" />
          )}
          <CollectionBackdrop pattern={theme.pattern} accent={theme.accent} slug={collection.slug} />
          {/* Dark veil that fades away as the row is scrolled */}
          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: darkness }} />

          <div className="relative">
            <div className={`flex flex-col gap-5 px-6 pb-4 pt-12 sm:px-12 sm:pt-16 ${flip ? "md:items-end md:text-right" : ""}`}>
              <p className="text-sm text-ivory/80">
                {items.length} {items.length === 1 ? "piece" : "pieces"}
              </p>
              <h2 id={titleId} className="max-w-3xl text-5xl sm:text-7xl">{collection.title}</h2>
              <p className="max-w-md text-lg text-ivory/85">{collection.description}</p>
              <div>
                <Button to={`/shop?collection=${collection.slug}`} variant="primary">View in the shop</Button>
              </div>
            </div>

            {items.length > 0 ? (
              <div
                ref={row}
                role="region"
                aria-label={`${collection.title} products`}
                tabIndex={0}
                className="drag-scroll no-scrollbar mt-8 flex snap-x items-start gap-4 overflow-x-auto overscroll-x-contain px-6 pb-10 sm:gap-6 sm:px-12"
              >
                {items.map((p) => (
                  <div key={p.id} className="w-[62vw] shrink-0 snap-start sm:w-[260px] lg:w-[300px]">
                    <ProductCard product={p} ratio="4/5" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-6 pb-12 pt-4 text-ivory/80 sm:px-12">New pieces for this collection are on the way.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
