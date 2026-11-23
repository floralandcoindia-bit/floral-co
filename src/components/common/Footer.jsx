import { Link } from "react-router-dom";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { MessageCircle, Mail, Phone } from "lucide-react";
import Logo from "./Logo";
import { siteConfig } from "../../config/site";
import { useCatalog } from "../../context/CatalogContext";

const group = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] } }),
};

const linkClass = "text-mist transition-colors hover:text-ivory";

export default function Footer() {
  const year = new Date().getFullYear();
  const { categories } = useCatalog();
  const ref = useRef(null);
  // The footer rises up OVER the bottom of the page as you scroll to the end (it ends flush at the bottom).
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], ["100%", "0%"]);
  return (
    <footer ref={ref} id="contact" className="relative z-30 -mt-24 overflow-hidden">
      <motion.div style={{ y }} className="border-t border-ivory/15 bg-evergreen shadow-[0_-24px_50px_-12px_rgba(0,0,0,0.7)]">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12">
        <motion.div className="md:col-span-5" variants={group} custom={0} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <Logo textClassName="text-2xl" />
          <p className="mt-5 max-w-sm text-mist">{siteConfig.description}</p>
          <p className="mt-6 font-serif text-3xl leading-tight text-ivory/90">Made by hand, one at a time.</p>
        </motion.div>

        <motion.nav aria-label="Footer" className="md:col-span-2" variants={group} custom={1} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <h2 className="font-sans text-sm font-medium text-ivory">Explore</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {siteConfig.navLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={linkClass}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </motion.nav>

        <motion.div className="md:col-span-2" variants={group} custom={2} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <h2 className="font-sans text-sm font-medium text-ivory">Shop</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/shop?category=${c.id}`} className={linkClass}>{c.label}</Link>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div className="md:col-span-3" variants={group} custom={3} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <h2 className="font-sans text-sm font-medium text-ivory">Say hello</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={siteConfig.whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${linkClass} inline-flex items-center gap-2`}>
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                {siteConfig.whatsappDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className={`${linkClass} inline-flex items-center gap-2`}>
                <Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                {siteConfig.email}
              </a>
            </li>
            {siteConfig.phone && (
              <li>
                <a href={`tel:${siteConfig.phone.replace(/\s+/g, "")}`} className={`${linkClass} inline-flex items-center gap-2`}>
                  <Phone className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  {siteConfig.phone}
                </a>
              </li>
            )}
          </ul>
          <p className="mt-5 text-sm text-mist/80">Orders are placed and confirmed on WhatsApp.</p>
        </motion.div>
      </div>

      <div className="border-t border-ivory/10">
        <p className="container-page pb-28 pt-6 text-xs text-mist/80">
          © {year} {siteConfig.brandName}. All rights reserved.
        </p>
      </div>
      </motion.div>
    </footer>
  );
}
