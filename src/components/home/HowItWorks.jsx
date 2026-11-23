import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { MessageCircle } from "lucide-react";
import Reveal from "../common/Reveal";
import LazyImage from "../common/LazyImage";
import { useProducts } from "../../hooks/useProducts";
import { siteConfig } from "../../config/site";

const EASE = [0.22, 1, 0.36, 1];

/* ---------- Step visuals ---------- */

function DiscoverVisual() {
  const { bestSellers } = useProducts();
  const shots = bestSellers.slice(0, 3);
  const poses = [
    { rotate: -7, x: -62, y: 10 },
    { rotate: 0, x: 0, y: -8 },
    { rotate: 7, x: 62, y: 10 },
  ];
  return (
    <div className="relative mx-auto flex h-80 w-full max-w-md items-center justify-center sm:h-72" aria-hidden="true">
      {shots.map((p, i) => (
        <motion.div
          key={p.id}
          className="absolute w-44 overflow-hidden rounded-sm border border-ivory/20 shadow-xl sm:w-40"
          style={{ zIndex: i === 1 ? 2 : 1 }}
          initial={{ rotate: 0, x: 0, y: 0, opacity: 0 }}
          whileInView={{ ...poses[i], opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: "spring", stiffness: 110, damping: 16, delay: 0.1 + i * 0.12 }}
        >
          <LazyImage src={p.images[0]} alt="" ratio="3/4" />
        </motion.div>
      ))}
    </div>
  );
}

function ShareVisual() {
  const bubble = "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-snug";
  const items = [
    { mine: true, text: "Hi! I'd love the Pocket Garden Keychain." },
    { mine: true, text: "Could you make it with the initial A?" },
    { mine: false, text: "Lovely choice. Let us check availability for you." },
  ];
  return (
    <div className="mx-auto w-full max-w-sm rounded-sm border border-ivory/15 bg-evergreen/70 p-5" aria-hidden="true">
      <div className="flex items-center gap-3 border-b border-ivory/10 pb-4">
        <span className="grid h-9 w-9 place-items-center rounded-full border border-ivory/20 text-gold">
          <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
        </span>
        <div className="leading-tight">
          <p className="text-sm text-ivory">{siteConfig.whatsappDisplay}</p>
          <p className="text-xs text-mist">WhatsApp chat</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        {items.map((m, i) => (
          <motion.p
            key={i}
            className={`${bubble} ${m.mine ? "self-end bg-ivory/15 text-ivory" : "self-start bg-botanical text-ivory"}`}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 + i * 0.5 }}
          >
            {m.text}
          </motion.p>
        ))}
      </div>
    </div>
  );
}

// Gift box geometry (isometric). Every edge is its own closed segment so nothing is ever left half-drawn.
const BOX = [
  // lid (top face)
  "M70 78 L160 52 L250 78 L160 104 L70 78",
  // visible side edges
  "M70 78 L70 140 L160 166 L250 140 L250 78",
  "M160 104 L160 166",
];
const RIBBON = [
  "M115 65 L205 91", // across the lid
  "M205 91 L205 153", // down the right face
  "M115 65 L115 65",
];
const BOW = [
  "M160 78 C 134 36, 100 62, 160 78",
  "M160 78 C 186 36, 220 62, 160 78",
  "M160 78 L146 100 M160 78 L176 100",
];

function BoxDrawing({ stroke, gold, draw }) {
  return (
    <>
      {BOX.map((d, i) => <motion.path key={d} d={d} stroke="#F3EDE0" strokeOpacity="0.65" strokeWidth="1.6" {...draw(i * 0.15)} />)}
      {RIBBON.slice(0, 2).map((d, i) => <motion.path key={d} d={d} stroke={gold} strokeWidth="1.8" {...draw(0.5 + i * 0.2)} />)}
      {BOW.map((d, i) => <motion.path key={d} d={d} stroke={gold} strokeWidth="1.8" {...draw(0.9 + i * 0.1)} />)}
    </>
  );
}

function DeliverVisual() {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);
  const draw = (delay) => ({
    initial: { pathLength: reduce ? 1 : 0 },
    whileInView: { pathLength: 1 },
    viewport: { once: true, amount: 0.1 },
    transition: { duration: 1.1, ease: EASE, delay },
    onAnimationComplete: () => setDone(true),
  });
  const stages = ["Crafted", "Packed", "Delivered"];
  return (
    <div className="mx-auto w-full max-w-sm" aria-hidden="true">
      <svg viewBox="50 24 220 152" className="w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <BoxDrawing gold="#B5A477" draw={draw} />
        {/* Once the drawing animation has run, a plain full copy sits on top so no stroke can ever look unfinished */}
        {done && (
          <g>
            {BOX.map((d) => <path key={d} d={d} stroke="#F3EDE0" strokeOpacity="0.65" strokeWidth="1.6" />)}
            {[...RIBBON.slice(0, 2), ...BOW].map((d) => <path key={d} d={d} stroke="#B5A477" strokeWidth="1.8" />)}
          </g>
        )}
      </svg>
      <div className="relative mt-2 flex justify-between px-1 text-xs text-mist">
        <span aria-hidden="true" className="absolute left-3 right-3 top-[5px] h-px bg-ivory/20" />
        {stages.map((s, i) => (
          <motion.span
            key={s}
            className="relative flex flex-col items-center gap-2 bg-forest px-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 + i * 0.35 }}
          >
            <span className="h-[10px] w-[10px] rounded-full border border-gold bg-forest" />
            {s}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  {
    number: "01",
    title: "Discover Your Favourite",
    text: "Browse the shop, the collections and what's trending, and find the piece that feels like it was made for you.",
    Visual: DiscoverVisual,
  },
  {
    number: "02",
    title: "Share Your Selection",
    text: "Send your selection to us on WhatsApp. That's where we confirm your order and talk through any customisation.",
    Visual: ShareVisual,
  },
  {
    number: "03",
    title: "Crafted, Packed & Delivered",
    text: "Once everything is confirmed and payment is made, your piece is made by hand, packed with care and sent on its way.",
    Visual: DeliverVisual,
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 65%", "end 75%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-24 border-y border-ivory/10 bg-evergreen/30 py-16 sm:py-32">
      <div className="container-page">
        <Reveal className="max-w-3xl">
          <h2 id="how-title" className="text-5xl sm:text-7xl">A Little Creativity, Delivered With Love.</h2>
          <p className="mt-6 max-w-xl text-lg text-mist">
            Every piece begins with an idea and is carefully brought to life by hand. Finding something you love should be just as special as receiving it.
          </p>
        </Reveal>

        <div ref={ref} className="relative mt-14 sm:mt-28">
          {/* Connecting rail: draws itself as you scroll */}
          <div aria-hidden="true" className="absolute bottom-0 left-2 top-0 w-px bg-ivory/15 md:left-1/2">
            <motion.div className="h-full w-px origin-top bg-gold" style={{ scaleY: reduce ? 1 : progress }} />
          </div>

          <ol className="space-y-16 md:space-y-36">
            {STEPS.map((step, i) => {
              const flip = i % 2 === 1;
              return (
                <li key={step.number} className="relative grid gap-5 pl-7 md:grid-cols-2 md:gap-28 md:pl-0">
                  {/* Node on the rail */}
                  <span aria-hidden="true" className="absolute left-2 top-3 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full border border-gold/70 bg-forest md:left-1/2">
                    <motion.span
                      className="h-2 w-2 rounded-full bg-gold"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    />
                  </span>
                  {/* Connector from the node toward the visual */}
                  <motion.span
                    aria-hidden="true"
                    className={`absolute top-[19px] hidden h-px w-24 bg-gold/50 md:block ${flip ? "right-1/2 origin-right" : "left-1/2 origin-left"}`}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
                  />

                  <Reveal className={`max-w-md ${flip ? "md:order-2" : "md:justify-self-end md:text-right"}`}>
                    <p className="font-serif text-5xl text-sage sm:text-6xl" aria-hidden="true">{step.number}</p>
                    <h3 className="mt-3 text-3xl sm:text-4xl">{step.title}</h3>
                    <p className="mt-4 text-mist">{step.text}</p>
                  </Reveal>

                  <div className={flip ? "md:order-1" : ""}>
                    <step.Visual />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <Reveal className="mt-16 max-w-3xl sm:mt-32">
          <p className="font-serif text-3xl italic leading-snug text-ivory sm:text-5xl">
            Thoughtfully handcrafted. Carefully packaged. Made to make someone smile.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
