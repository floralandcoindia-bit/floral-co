import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Home, LayoutGrid, Package, ShoppingBag, Store, TrendingUp } from "lucide-react";
import Logo from "./Logo";
import HamburgerButton from "./HamburgerButton";
import HamburgerMenu from "./HamburgerMenu";
import { useCart } from "../../hooks/useCart";
import { siteConfig } from "../../config/site";
import { useLoaded } from "../../utils/loader";

const ICONS = { home: Home, shop: Store, trending: TrendingUp, collections: LayoutGrid, orders: Package, cart: ShoppingBag };

function CartCount({ count }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[11px] font-semibold leading-none text-forest"
      >
        {count}
      </motion.span>
    </AnimatePresence>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { pathname, hash } = useLocation();
  const close = useCallback(() => setOpen(false), []);
  const loaded = useLoaded();

  // Sliding "you are here" pill. It is measured from the real tab positions (no layout animation),
  // so it never flies in from below and always glides sideways between tabs.
  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });
  const activeIndex = siteConfig.navLinks.findIndex((l) => (l.to === "/" ? pathname === "/" : pathname.startsWith(l.to)));

  const measure = useCallback(() => {
    const list = listRef.current;
    const el = itemRefs.current[activeIndex];
    if (!list || !el) {
      setPill((p) => (p.width ? { ...p, width: 0 } : p));
      return;
    }
    const l = list.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPill((p) => ({ left: r.left - l.left, width: r.width, ready: p.ready }));
  }, [activeIndex]);

  useLayoutEffect(() => {
    measure();
  }, [measure, count]);

  useEffect(() => {
    // after the first position is set, allow the slide animation
    const t = requestAnimationFrame(() => setPill((p) => (p.ready ? p : { ...p, ready: true })));
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(measure);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("resize", onResize);
    };
  }, [measure]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, hash]);

  return (
    <>
      {/* Top: brand + menu button, floating and unobtrusive */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center px-4 pt-4 sm:px-6">
        <span aria-hidden="true" />
        <div className="pointer-events-auto flex items-center justify-center rounded-full border border-ivory/15 bg-evergreen/70 px-5 py-2.5 backdrop-blur-[10px]">
          <Logo textClassName="text-lg" />
        </div>
        <div className="pointer-events-auto justify-self-end">
          <HamburgerButton open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </header>

      {/* Bottom: floating tab bar */}
      <motion.nav
        aria-label="Primary"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        initial={{ y: 90, opacity: 0 }}
        animate={loaded ? { y: 0, opacity: 1 } : { y: 90, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26, delay: 0.15 }}
      >
        <ul ref={listRef} className="pointer-events-auto relative flex items-center gap-0.5 rounded-full border border-ivory/15 bg-evergreen/75 p-1.5 shadow-[0_14px_44px_-10px_rgba(0,0,0,0.75)] backdrop-blur-[12px]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1.5 left-0 rounded-full border border-ivory/20 bg-ivory/15"
            style={{
              width: pill.width,
              transform: `translateX(${pill.left}px)`,
              opacity: pill.width ? 1 : 0,
              transition: pill.ready ? "transform 380ms cubic-bezier(0.22,1,0.36,1), width 380ms cubic-bezier(0.22,1,0.36,1)" : "none",
            }}
          />
          {siteConfig.navLinks.map((link, idx) => {
            const Icon = ICONS[link.icon] || Home;
            return (
              <li key={link.to} ref={(el) => (itemRefs.current[idx] = el)} className="relative">
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `relative flex h-12 items-center rounded-full px-2 text-[13px] transition-colors duration-300 min-[360px]:px-3 min-[400px]:px-3.5 sm:px-5 sm:text-sm ${
                      isActive ? "text-ivory" : "text-mist hover:text-ivory"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative flex items-center gap-2">
                        <span className="relative">
                          <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} aria-hidden="true" />
                          {link.isCart && count > 0 && (
                            <span className="absolute -right-2.5 -top-2.5">
                              <CartCount count={count} />
                            </span>
                          )}
                        </span>
                        {/* Mobile: only the active tab shows its label. Larger screens show all labels. */}
                        <span className={isActive ? "" : "sr-only sm:not-sr-only"}>{link.label}</span>
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </motion.nav>

      <HamburgerMenu open={open} onClose={close} />
    </>
  );
}
