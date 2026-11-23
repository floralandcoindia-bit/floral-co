import { motion } from "motion/react";

export default function HamburgerButton({ open, onClick }) {
  const line = "absolute left-0 h-px w-5 rounded-full bg-ivory";
  const t = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      aria-controls="site-menu"
      className={`grid h-11 w-11 place-items-center rounded-full border border-ivory/15 backdrop-blur-[10px] transition-colors hover:bg-ivory/15 ${
        open ? "bg-evergreen" : "bg-evergreen/70"
      }`}
    >
      <span className="relative block h-3 w-5">
        <motion.span className={`${line} top-0`} animate={open ? { y: 5.5, rotate: 45 } : { y: 0, rotate: 0 }} transition={t} />
        <motion.span className={`${line} top-[5.5px]`} animate={{ opacity: open ? 0 : 1 }} transition={{ duration: 0.2 }} />
        <motion.span className={`${line} top-[11px]`} animate={open ? { y: -5.5, rotate: -45 } : { y: 0, rotate: 0 }} transition={t} />
      </span>
    </button>
  );
}
