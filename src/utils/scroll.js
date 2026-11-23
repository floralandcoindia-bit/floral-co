// Small helpers so route changes / anchors work with or without Lenis.
let lenis = null;

export const setLenis = (instance) => {
  lenis = instance;
};
export const getLenis = () => lenis;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

export function scrollToElement(el, offset = 96) {
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: -offset, immediate: prefersReducedMotion() });
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
}
