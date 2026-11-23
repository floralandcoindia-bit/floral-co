import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

function Word({ word, progress, range, still }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span style={{ opacity: still ? 1 : opacity }} className="mr-[0.25em] inline-block">
      {word}
    </motion.span>
  );
}

/** Words brighten one by one as the paragraph scrolls into view. Static when reduced motion is requested. */
export default function ScrollWords({ text, className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.55"] });
  const words = text.split(" ");
  const n = words.length;

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => {
        const start = (i / n) * 0.9;
        return <Word key={i} word={w} progress={scrollYProgress} range={[start, start + 0.1]} still={reduce} />;
      })}
    </p>
  );
}
