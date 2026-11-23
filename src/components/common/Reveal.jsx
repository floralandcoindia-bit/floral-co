import { motion } from "motion/react";

/** Scroll-reveal wrapper (runs once). Reduced motion is handled globally by MotionConfig. */
export default function Reveal({ as = "div", delay = 0, y = 32, className = "", children, ...rest }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "some", margin: "0px 0px -6% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
