import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { siteConfig } from "../../config/site";
import { useScrollLock } from "../../hooks/useScrollLock";

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};
const reveal = {
  hidden: { y: "108%" },
  show: { y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  exit: { y: "108%", transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
};

const linkClass =
  "block pb-1 font-serif text-5xl leading-[1.12] text-ivory transition-all duration-300 hover:translate-x-2 hover:text-sage sm:text-6xl md:text-7xl";

export default function HamburgerMenu({ open, onClose }) {
  const panelRef = useRef(null);
  useScrollLock(open);

  // Keep keyboard and screen-reader focus inside the menu (the top bar and tab bar stay usable)
  useEffect(() => {
    if (!open) return undefined;
    const behind = [...document.querySelectorAll("main, footer")];
    behind.forEach((el) => el.setAttribute("inert", ""));
    return () => behind.forEach((el) => el.removeAttribute("inert"));
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="site-menu"
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          data-lenis-prevent
          className="fixed inset-0 z-40 overflow-y-auto bg-forest outline-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.1 } }}
          transition={{ duration: 0.35 }}
        >
          <div className="container-page flex min-h-full flex-col justify-center gap-12 pb-32 pt-28 md:flex-row md:items-end md:justify-between">
            <motion.ul variants={list} initial="hidden" animate="show" exit="exit" className="space-y-1">
              {siteConfig.menuLinks.map((item) => (
                <li key={item.label} className="overflow-hidden">
                  <motion.div variants={reveal}>
                    {item.external ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={linkClass}>
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.to} onClick={onClose} className={linkClass}>
                        {item.label}
                      </Link>
                    )}
                  </motion.div>
                </li>
              ))}
            </motion.ul>

            <motion.div
              className="max-w-xs space-y-3 text-sm text-mist"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.6 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <p className="font-serif text-2xl text-ivory">{siteConfig.tagline}</p>
              <p>
                <a href={siteConfig.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-ivory underline-offset-4 hover:underline">
                  {siteConfig.whatsappDisplay}
                </a>{" "}
                on WhatsApp
              </p>
              <p>
                <a href={`mailto:${siteConfig.email}`} className="underline-offset-4 hover:text-ivory hover:underline">
                  {siteConfig.email}
                </a>
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
