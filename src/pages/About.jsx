import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import Seo from "../components/common/Seo";
import Reveal from "../components/common/Reveal";
import Button from "../components/common/Button";
import LazyImage from "../components/common/LazyImage";
import ScrollWords from "../components/common/ScrollWords";
import { aboutContent } from "../data/about";
import { makePlaceholder } from "../utils/placeholder";
import { siteConfig } from "../config/site";

const EASE = [0.22, 1, 0.36, 1];

function Faq({ q, a, id, open, onToggle }) {
  return (
    <div className="border-b border-ivory/10">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-button`}
          className="flex w-full items-center justify-between gap-6 py-6 text-left font-serif text-2xl text-ivory transition-colors hover:text-sage sm:text-3xl"
        >
          {q}
          <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl pb-6 text-mist">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  const [openFaq, setOpenFaq] = useState(0);
  const { intro, sections, process, faqs } = aboutContent;

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

      {/* Process */}
      <section aria-labelledby="process-title" className="mt-32 border-y border-ivory/10 bg-evergreen/30 py-24 sm:mt-48 sm:py-32">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <h2 id="process-title" className="text-5xl sm:text-7xl">How each piece comes to life</h2>
          </Reveal>
          <ol className="mt-16 grid gap-10 md:grid-cols-4 md:gap-8">
            {process.map((step, i) => (
              <li key={step.title} className="relative pt-8">
                <motion.span
                  aria-hidden="true"
                  className="absolute left-0 right-0 top-0 h-px origin-left bg-gold/70"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 1 }}
                  transition={{ duration: 1, ease: EASE, delay: i * 0.15 }}
                />
                <span aria-hidden="true" className="absolute -top-[5px] left-0 h-[9px] w-[9px] rounded-full border border-gold bg-forest" />
                <Reveal delay={0.1 + i * 0.1} y={20}>
                  <h3 className="text-3xl">{step.title}</h3>
                  <p className="mt-3 text-mist">{step.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" aria-labelledby="faqs-title" className="container-page mt-32 scroll-mt-24 sm:mt-48">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <h2 id="faqs-title" className="text-5xl sm:text-6xl">Questions, answered.</h2>
            <p className="mt-4 max-w-xs text-mist">Can't find what you need? Message us on WhatsApp.</p>
          </Reveal>
          <div className="border-t border-ivory/10 md:col-span-8">
            {faqs.map((f, i) => (
              <Faq key={f.q} id={`faq-${i}`} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="container-page mt-32 sm:mt-48">
        <Reveal className="flex flex-col items-start justify-between gap-8 border-t border-ivory/15 pt-12 sm:flex-row sm:items-end">
          <h2 className="max-w-xl text-4xl sm:text-6xl">Ready to find something you love?</h2>
          <div className="flex flex-wrap gap-3">
            <Button to="/shop" variant="primary" size="lg">Shop now</Button>
            <Button href={siteConfig.whatsappUrl} variant="outline" size="lg">Say hello on WhatsApp</Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
