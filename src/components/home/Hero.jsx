import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Button from "../common/Button";
import { useLoaded } from "../../utils/loader";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.25 } } };
const line = { hidden: { y: "110%" }, show: { y: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } } };
const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } } };

const VIDEO_SRC = "/assets/videos/hero.mp4";
const POSTER_SRC = "/assets/images/hero-poster.jpg";

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const loaded = useLoaded(); // hero text animates in after the intro slides away
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <section aria-label="Welcome" className="relative isolate flex min-h-screen min-h-[100dvh] items-end overflow-hidden bg-forest">
      {/* Fallback backdrop (visible if the poster and video files are missing) */}
      <svg aria-hidden="true" className="absolute inset-0 z-0 h-full w-full text-sage/20" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="1">
        {[160, 260, 360, 460, 560].map((r) => (
          <circle key={r} cx="880" cy="320" r={r} />
        ))}
        <path d="M880 620 C 640 480, 660 220, 880 120 C 1100 220, 1120 480, 880 620 Z" />
        <path d="M880 620 L880 220" />
      </svg>

      {/* Poster as a CSS background: no broken-image icon if the file is missing */}
      <div aria-hidden="true" className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${POSTER_SRC})` }} />

      {!videoFailed && (
        <video
          className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
        />
      )}

      <div aria-hidden="true" className="absolute inset-0 z-10 bg-forest/55" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-forest to-transparent" />

      <motion.div className="container-page relative z-20 pb-36 pt-32" variants={container} initial="hidden" animate={loaded ? "show" : "hidden"}>
        <h1 className="text-[clamp(3.4rem,11vw,9.5rem)] leading-[1]">
          <span className="block overflow-hidden pb-[0.2em] -mb-[0.1em]">
            <motion.span variants={line} className="block">Little Things.</motion.span>
          </span>
          <span className="block overflow-hidden pb-[0.2em] -mb-[0.1em]">
            <motion.span variants={line} className="block italic text-ivory/90">Beautifully Made.</motion.span>
          </span>
        </h1>

        <motion.p variants={fade} className="mt-8 max-w-md text-lg text-ivory/85">
          Thoughtfully handcrafted creations, made to turn everyday moments into something special.
        </motion.p>

        <motion.div variants={fade} className="mt-10 flex flex-wrap gap-3">
          <Button to="/collections" variant="primary" size="lg">Explore Collection</Button>
          <Button to="/shop" variant="outline" size="lg">Shop Now</Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
