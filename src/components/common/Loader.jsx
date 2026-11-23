import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { siteConfig } from "../../config/site";
import { markLoaded } from "../../utils/loader";

const MIN_MS = 1500; // always show the intro for a moment so it never just flashes
const MAX_MS = 5000; // never block the site longer than this

/** Branded intro. Waits for the page + fonts, then the whole screen slides away left → right. */
export default function Loader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const start = performance.now();
    const root = document.documentElement;
    root.style.overflow = "hidden";
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, MIN_MS - (performance.now() - start));
      setTimeout(() => {
        root.style.overflow = "";
        setVisible(false);
      }, wait);
    };

    const ready = Promise.all([
      document.readyState === "complete" ? Promise.resolve() : new Promise((r) => window.addEventListener("load", r, { once: true })),
      document.fonts?.ready ?? Promise.resolve(),
    ]);
    ready.then(finish, finish);
    const cap = setTimeout(finish, MAX_MS);
    return () => {
      clearTimeout(cap);
      root.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={markLoaded}>
      {visible && (
        <motion.div
          key="loader"
          role="status"
          aria-live="polite"
          aria-label="Loading"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-forest"
          initial={{ x: 0 }}
          exit={{ x: "100%", transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
        >
          {/* soft glow */}
          <div aria-hidden="true" className="absolute h-[60vmax] w-[60vmax] rounded-full bg-botanical/20 blur-3xl" />

          <div className="relative flex flex-col items-center">
            <svg viewBox="0 0 32 32" className="h-16 w-16 text-gold" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <motion.path d="M16 27C8 23 8.5 12 16 7c7.5 5 8 16 0 20Z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeInOut" }} />
              <motion.path d="M16 27V13" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.5, ease: "easeInOut" }} />
            </svg>

            <div className="mt-6 overflow-hidden pb-2">
              <motion.p
                className="font-serif text-4xl text-ivory sm:text-5xl"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {siteConfig.brandName}
              </motion.p>
            </div>
            <motion.p className="mt-1 text-sm tracking-wide text-mist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}>
              {siteConfig.tagline}
            </motion.p>

            <div className="mt-10 h-px w-40 overflow-hidden bg-ivory/15">
              <motion.div className="h-px bg-gold" initial={{ x: "-100%" }} animate={{ x: 0 }} transition={{ duration: MIN_MS / 1000, ease: "easeInOut" }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
