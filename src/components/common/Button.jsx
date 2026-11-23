import { Link } from "react-router-dom";
import { motion } from "motion/react";

const MotionLink = motion.create(Link);

const VARIANTS = {
  primary: "bg-ivory text-forest hover:bg-white",
  green: "bg-botanical text-ivory hover:bg-botanical/85",
  outline: "border border-ivory/30 text-ivory hover:border-ivory/60 hover:bg-ivory/5",
  ghost: "text-ivory hover:bg-ivory/10",
  gold: "border border-gold/60 text-gold hover:bg-gold/10",
};
const SIZES = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-7 text-sm",
  lg: "h-14 px-9 text-base",
};

/**
 * Renders a router link (`to`), an external/anchor link (`href`), or a button.
 */
export default function Button({ to, href, variant = "primary", size = "md", className = "", children, ...props }) {
  const cls = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-wide transition-colors duration-300 disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  const tap = props.disabled ? undefined : { scale: 0.97 };

  if (to) {
    return (
      <MotionLink to={to} className={cls} whileTap={tap} {...props}>
        {children}
      </MotionLink>
    );
  }
  if (href) {
    const external = /^https?:/.test(href);
    return (
      <motion.a
        href={href}
        className={cls}
        whileTap={tap}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      >
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button type="button" className={cls} whileTap={tap} {...props}>
      {children}
    </motion.button>
  );
}
