import { motion } from "motion/react";

/** Wraps each page. A very short fade so switching tabs feels instant. */
export default function PageTransition({ children, className = "" }) {
  return (
    <motion.main
      id="main"
      className={`min-h-screen min-h-[100dvh] ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.main>
  );
}
