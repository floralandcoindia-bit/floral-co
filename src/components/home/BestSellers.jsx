import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "motion/react";
import Reveal from "../common/Reveal";
import Button from "../common/Button";
import ProductCard from "../shop/ProductCard";
import { useProducts } from "../../hooks/useProducts";
import { useDragScroll } from "../../hooks/useDragScroll";

const SPEED = 38; // px per second of automatic drift
const RESUME_AFTER = 1800; // ms of calm after the visitor touches, scrolls or drags before drifting again
const MIN_ITEMS = 6; // a set must be wider than the screen so the loop never shows a gap

/**
 * Best sellers: a row that drifts sideways on its own, one product after another, forever.
 * Visitors can swipe, scroll or drag it at any time; it pauses while they do and carries on afterwards.
 * Three identical sets sit side by side and the scroll position is wrapped by exactly one set, so the loop is seamless.
 */
export default function BestSellers() {
  const { bestSellers } = useProducts();
  const reduce = useReducedMotion();
  const scroller = useRef(null);
  useDragScroll(scroller);

  // One "set" = the best sellers repeated until it is long enough to fill any screen
  const set = useMemo(() => {
    if (!bestSellers.length) return [];
    const out = [];
    while (out.length < MIN_ITEMS) out.push(...bestSellers);
    return out;
  }, [bestSellers]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || !set.length) return undefined;

    let setWidth = 0;
    let pos = 0; // float position, because scrollLeft is rounded by some browsers
    let last = performance.now();
    let hovering = false;
    let holding = false;
    let touchedAt = 0;
    let raf = 0;

    const measure = () => {
      setWidth = el.scrollWidth / 3;
      if (setWidth && (el.scrollLeft < setWidth * 0.5 || el.scrollLeft > setWidth * 2.5)) el.scrollLeft = setWidth;
      pos = el.scrollLeft;
    };
    const wrap = () => {
      if (!setWidth) return;
      if (el.scrollLeft >= setWidth * 2) el.scrollLeft -= setWidth;
      else if (el.scrollLeft < 1) el.scrollLeft += setWidth;
      pos = el.scrollLeft;
    };

    const touch = () => {
      touchedAt = performance.now();
    };
    const onEnter = (e) => {
      if (e.pointerType === "mouse") hovering = true;
    };
    const onLeave = (e) => {
      if (e.pointerType === "mouse") hovering = false;
    };
    const onDown = () => {
      holding = true;
      touch();
    };
    const onUp = () => {
      holding = false;
      touch();
    };

    const tick = (now) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const paused = reduce || hovering || holding || now - touchedAt < RESUME_AFTER || document.hidden;
      if (paused) {
        pos = el.scrollLeft; // follow wherever the visitor took it
      } else if (setWidth) {
        pos += SPEED * dt;
        el.scrollLeft = pos;
      }
      wrap();
      raf = requestAnimationFrame(tick);
    };

    measure();
    raf = requestAnimationFrame(tick);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", touch, { passive: true });
    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove", touch, { passive: true });
    el.addEventListener("touchend", onUp, { passive: true });
    el.addEventListener("focusin", touch);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", touch);
      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("touchmove", touch);
      el.removeEventListener("touchend", onUp);
      el.removeEventListener("focusin", touch);
    };
  }, [set, reduce]);

  if (!set.length) return null;

  return (
    <section aria-labelledby="best-sellers-title" className="py-24 sm:py-32">
      <div className="container-page flex items-end justify-between gap-6">
        <Reveal>
          <h2 id="best-sellers-title" className="text-5xl sm:text-7xl">Best Sellers</h2>
          <p className="mt-4 max-w-md text-mist">The pieces people reach for first. Swipe or drag to browse.</p>
        </Reveal>
        <Button to="/shop" variant="outline" size="sm" className="hidden sm:inline-flex">View all</Button>
      </div>

      <div
        ref={scroller}
        role="region"
        aria-label="Best sellers"
        className="drag-scroll no-scrollbar mt-12 flex items-start overflow-x-auto overscroll-x-contain"
      >
        {[0, 1, 2].map((copy) =>
          set.map((p, i) => (
            <div
              key={`${copy}-${i}-${p.id}`}
              aria-hidden={copy !== 1 ? "true" : undefined}
              inert={copy !== 1 ? "" : undefined}
              className="w-[74vw] shrink-0 pr-5 sm:w-[340px] sm:pr-8 lg:w-[400px]"
            >
              <ProductCard product={p} ratio="4/5" eager={copy === 1 && i < 4} />
            </div>
          ))
        )}
      </div>

      <div className="container-page mt-8 sm:hidden">
        <Button to="/shop" variant="outline" size="sm">View all</Button>
      </div>
    </section>
  );
}
