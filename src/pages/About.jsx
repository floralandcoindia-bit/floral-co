import { motion } from "motion/react";
import Seo from "../components/common/Seo";
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

      {/* Story blocks: text card on the left, overlapping a large image on the right */}
      <div className="container-page mt-24 space-y-24 sm:mt-36 sm:space-y-40">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24 md:grid md:grid-cols-12 md:items-center">
            <motion.div
              className="overflow-hidden rounded-sm md:col-span-8 md:col-start-5 md:row-start-1"
              initial={{ opacity: 0, scale: 1.06 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.2, ease: EASE }}
            >
              <LazyImage src={makePlaceholder({ ...s.image, w: 1100, h: 900, variant: i })} alt={s.image.label} ratio="5/4" />
            </motion.div>

            <motion.div
              className="relative z-10 mx-4 -mt-16 rounded-sm border border-ivory/10 bg-evergreen/95 p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-sm sm:mx-8 sm:p-8 md:col-span-6 md:col-start-1 md:row-start-1 md:mx-0 md:mt-0 md:p-10"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
            >
              <h2 id={`${s.id}-title`} className="text-3xl sm:text-5xl">{s.title}</h2>
              {s.paragraphs.map((p, j) => (
                <p key={j} className="mt-4 max-w-md text-base text-mist sm:text-lg">{p}</p>
              ))}
            </motion.div>
          </section>
        ))}
      </div>
    </div>
  );
}
