import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import Seo from "../components/common/Seo";
import Button from "../components/common/Button";
import { useCatalog } from "../context/CatalogContext";

export default function NotFound() {
  const reduce = useReducedMotion();
  const { categories } = useCatalog();
  return (
    <div className="container-page flex min-h-[85dvh] flex-col justify-center pb-24 pt-32">
      <Seo title="Page not found" description="This page could not be found." />

      <svg aria-hidden="true" viewBox="0 0 120 120" className="h-24 w-24 text-gold sm:h-32 sm:w-32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          d="M60 104 C 22 86, 26 40, 60 18 C 94 40, 98 86, 60 104 Z"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path d="M60 104 V46" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.8 }} />
      </svg>

      <h1 className="mt-8 max-w-3xl text-6xl sm:text-8xl">This page wandered off.</h1>
      <p className="mt-6 max-w-md text-lg text-mist">The link may be old or mistyped. Head back home, or pick up where you like.</p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button to="/" variant="primary" size="lg">Back to home</Button>
        <Button to="/shop" variant="outline" size="lg">Visit the shop</Button>
      </div>

      <nav aria-label="Browse categories" className="mt-14 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {categories.map((c) => (
          <Link key={c.id} to={`/shop?category=${c.id}`} className="text-mist underline-offset-4 transition-colors hover:text-ivory hover:underline">
            {c.label}
          </Link>
        ))}
        <Link to="/collections" className="text-mist underline-offset-4 transition-colors hover:text-ivory hover:underline">Collections</Link>
      </nav>
    </div>
  );
}
