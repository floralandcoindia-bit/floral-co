import { motion } from "motion/react";
import Seo from "../components/common/Seo";
import Reveal from "../components/common/Reveal";
import LazyImage from "../components/common/LazyImage";
import ScrollWords from "../components/common/ScrollWords";
import { aboutContent } from "../data/about";
import { makePlaceholder } from "../utils/placeholder";

const EASE = [0.22, 1, 0.36, 1];

export default function About() {
  const { intro, sections } = aboutContent;

  return (
    <div className="pb-16 pt-32">
      <Seo title="About" description="The story behind our handmade creations: inspiration, craft, personalisation and care." />

      {/* Opening */}
      <header className="container-page">
        <h1 className="max-w-5xl text-6xl leading-[0.95] sm:text-8xl lg:text-9xl">Small Creations. Endless Stories.</h1>
        <div className="mt-16 max-w-4xl sm:mt-24">
          <ScrollWords text={intro} className="font-serif text-3xl leading-snug sm:text-5xl" />
        </div>
      </header>

      {/* Story blocks */}
      <div className="container-page mt-24 space-y-28 sm:mt-36 sm:space-y-44">
        {sections.map((s, i) => {
          const flip = i % 2 === 1;
          return (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24 grid items-center gap-10 md:grid-cols-12 md:gap-16">
              <motion.div
                className={`overflow-hidden rounded-sm md:col-span-6 ${flip ? "md:order-2" : ""}`}
                initial={{ opacity: 0, scale: 1.08 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.2, ease: EASE }}
              >
                <LazyImage
                  src={makePlaceholder({ ...s.image, w: 900, h: 1100, variant: i })}
                  alt={s.image.label}
                  ratio={i % 2 ? "1/1" : "4/5"}
                />
              </motion.div>

              <div className={`md:col-span-5 ${flip ? "md:order-1 md:col-start-1" : "md:col-start-8"}`}>
                <Reveal>
                  <h2 id={`${s.id}-title`} className="text-4xl sm:text-6xl">{s.title}</h2>
                </Reveal>
                {s.paragraphs.map((p, j) => (
                  <Reveal key={j} delay={0.1 + j * 0.1} className="mt-6 max-w-md text-lg text-mist">
                    <p>{p}</p>
                  </Reveal>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
