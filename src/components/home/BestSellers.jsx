import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import Reveal from "../common/Reveal";
import Button from "../common/Button";
import ProductCard from "../shop/ProductCard";
import LazyImage from "../common/LazyImage";
import { useProducts } from "../../hooks/useProducts";
import { useDragScroll } from "../../hooks/useDragScroll";
import { useQuickView } from "../../context/QuickViewContext";
import { formatPrice } from "../../utils/currency";

const RATIOS = ["4/5"]; // same proportions so every card starts and ends on the same line
const SCROLL_PER_ITEM = 70; // vh of scrolling for each item
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const pad = (n) => String(n).padStart(2, "0");

/**
 * Scroll-velocity 3D planes.
 *
 *   scroll progress --spring--> pos (which plane is at the front, as a fractional index)
 *   pos --useVelocity--> speed --spring--> wave (a springy -1…1 value that swings while you scroll and settles when you stop)
 *   each plane: depth t = index - pos. Its 3D transform comes from t (the line) plus wave * sin(t) (the ripple travelling along the line)
 */
function planeTransform(t, wave, W, H) {
  const small = W < 700;
  const base = small ? { x: -0.1, y: -0.02 } : { x: -0.1, y: 0.06 };
  const step = small ? { x: 0.2, y: 0.05, z: 190 } : { x: 0.125, y: 0.06, z: 215 };

  // Smooth curve through t = 0 (no kink): planes that already passed accelerate towards the viewer
  const u = t >= 0 ? t : t - 0.85 * t * t;
  const phase = t * 0.95;
  const ripple = Math.sin(phase);

  const x = (base.x + u * step.x) * W + wave * ripple * 0.035 * W;
  const y = (base.y - u * step.y) * H + wave * Math.cos(phase) * 0.09 * H;
  const z = -u * step.z + wave * ripple * 150;
  const rotY = -17 + wave * ripple * 16;
  const rotZ = wave * Math.cos(phase) * 3.2;

  const opacity = t >= 0 ? clamp(1 - (t - 4.4) * 0.5, 0, 1) : clamp(1 + t * 1.25, 0, 1);
  return { transform: `translate3d(${x}px, ${y}px, ${z}px) translate(-50%, -50%) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`, opacity, t };
}

function Plane({ product, index, pos, wave, dims, onOpen, onFocus }) {
  const frame = useTransform([pos, wave, dims], ([p, w, d]) => planeTransform(index - p, w, d.W, d.H));
  const transform = useTransform(frame, (f) => f.transform);
  const opacity = useTransform(frame, (f) => f.opacity);
  const zIndex = useTransform(frame, (f) => 1000 - Math.round(f.t * 10));
  const visibility = useTransform(frame, (f) => (f.opacity > 0.02 ? "visible" : "hidden"));
  const pointerEvents = useTransform(frame, (f) => (f.opacity > 0.02 && f.t > -0.6 && f.t < 5 ? "auto" : "none"));

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(product)}
      onFocus={() => onFocus(index)}
      aria-label={`${product.name}, ${formatPrice(product.price)}. Open quick view`}
      className="absolute left-1/2 top-1/2 w-[46vw] max-w-[340px] text-left will-change-transform sm:w-[24vw] lg:w-[19vw]"
      style={{ transform, opacity, zIndex, visibility, pointerEvents, transformStyle: "preserve-3d" }}
    >
      <span className="mb-2 block font-mono text-[11px] tracking-widest text-ivory/60">#{pad(index + 1)}</span>
      <motion.span
        className="block overflow-hidden rounded-sm bg-evergreen shadow-[0_30px_60px_-20px_rgba(0,0,0,0.75)]"
        whileHover={{ z: 70, scale: 1.03 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <LazyImage src={product.images[0]} alt="" ratio="4/5" eager={index < 4} />
      </motion.span>
    </motion.button>
  );
}

function BestSellersGallery({ items }) {
  const { openQuickView } = useQuickView();
  const reduce = useReducedMotion();
  const section = useRef(null);
  const stage = useRef(null);
  const N = items.length;
  const [active, setActive] = useState(0);
  const dims = useMotionValue({ W: 1440, H: 900 });

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const target = useTransform(scrollYProgress, (v) => clamp(v, 0, 1) * (N - 1));
  const pos = useSpring(target, { stiffness: 90, damping: 24, mass: 0.8 }); // smooth, slightly floaty scrolling
  const speed = useTransform(useVelocity(pos), (v) => clamp(v / 3.2, -1.4, 1.4));
  const wave = useSpring(speed, { stiffness: 110, damping: 11, mass: 0.9 }); // swings with scroll speed, then wobbles back to flat

  useMotionValueEvent(pos, "change", (p) => {
    const next = clamp(Math.round(p), 0, N - 1);
    setActive((a) => (a === next ? a : next));
  });

  useEffect(() => {
    const measure = () => {
      const el = stage.current;
      if (el) dims.set({ W: el.clientWidth, H: el.clientHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [dims]);

  // Keyboard: focusing a plane scrolls the page to that plane's moment in the gallery
  const jumpTo = useCallback(
    (i) => {
      const el = section.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const range = el.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + (i / (N - 1)) * range, behavior: reduce ? "auto" : "smooth" });
    },
    [N, reduce]
  );

  const current = items[active] || items[0];

  return (
    <section ref={section} aria-labelledby="best-sellers-title" className="relative" style={{ height: `calc(100dvh + ${(N - 1) * SCROLL_PER_ITEM}vh)` }}>
      <div ref={stage} className="sticky top-0 h-[100dvh] overflow-hidden" style={{ perspective: "1200px", perspectiveOrigin: "70% 30%" }}>
        <div className="container-page pointer-events-none absolute inset-x-0 top-24 z-[2000] sm:top-28">
          <h2 id="best-sellers-title" className="text-5xl sm:text-7xl lg:text-8xl">Best Sellers</h2>
          <p className="mt-3 max-w-sm text-mist">The pieces people reach for first.</p>
        </div>

        {items.map((p, i) => (
          <Plane key={p.id} product={p} index={i} pos={pos} wave={wave} dims={dims} onOpen={openQuickView} onFocus={jumpTo} />
        ))}

        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-[2000] sm:bottom-32">
          <div className="container-page flex items-end justify-between gap-6">
            <div className="pointer-events-auto max-w-xs [text-shadow:0_2px_20px_rgba(10,18,14,0.9)]">
              <p className="font-mono text-xs tracking-widest text-gold">{pad(active + 1)} / {pad(N)}</p>
              <p className="mt-2 font-serif text-3xl leading-tight text-ivory sm:text-4xl">{current.name}</p>
              <p className="mt-1 text-ivory/80">{formatPrice(current.price)}</p>
              <Button to="/shop" variant="outline" size="sm" className="mt-4">View all</Button>
            </div>
            <p className="hidden pb-1 text-right font-mono text-[11px] uppercase tracking-widest text-mist sm:block">Scroll to surf, click to open</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BestSellers() {
  const { bestSellers } = useProducts();
  const reduce = useReducedMotion();
  // The 3D gallery needs a few items and motion; otherwise use the simple swipeable row.
  if (reduce || bestSellers.length < 3) return <BestSellersScroller />;
  return <BestSellersGallery items={bestSellers} />;
}



function BestSellersScroller() {
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
