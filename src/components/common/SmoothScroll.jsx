import { useEffect } from "react";
import Lenis from "lenis";
import { siteConfig } from "../../config/site";
import { setLenis } from "../../utils/scroll";

/** Optional Lenis smooth scrolling. Skipped when disabled in config or when reduced motion is requested. */
export default function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!siteConfig.smoothScroll || reduce) return undefined;

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    setLenis(lenis);

    let frame;
    const raf = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return null;
}
