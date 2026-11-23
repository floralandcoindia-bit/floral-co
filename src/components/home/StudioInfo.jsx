import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import Reveal from "../common/Reveal";
import Button from "../common/Button";
import { aboutContent } from "../../data/about";
import { siteConfig } from "../../config/site";

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

/** "How each piece comes to life", the FAQs and the closing call-to-action. Sits on the home page just before the reviews. */
export default function StudioInfo() {
  const [openFaq, setOpenFaq] = useState(0);
  const { process, faqs } = aboutContent;

  return (
    <>
      {/* Process */}
      <section aria-labelledby="process-title" className="mt-20 border-y border-ivory/10 bg-evergreen/30 py-20 sm:mt-32 sm:py-28">
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
      <section id="faqs" aria-labelledby="faqs-title" className="container-page mt-24 scroll-mt-24 sm:mt-36">
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
      <section className="container-page mt-24 sm:mt-36">
        <Reveal className="flex flex-col items-start justify-between gap-8 border-t border-ivory/15 pt-12 sm:flex-row sm:items-end">
          <h2 className="max-w-xl text-4xl sm:text-6xl">Ready to find something you love?</h2>
          <div className="flex flex-wrap gap-3">
            <Button to="/shop" variant="primary" size="lg">Shop now</Button>
            <Button href={siteConfig.whatsappUrl} variant="outline" size="lg">Say hello on WhatsApp</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
