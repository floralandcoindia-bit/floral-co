import { motion } from "motion/react";
import { Eye } from "lucide-react";
import LazyImage from "../common/LazyImage";
import { useQuickView } from "../../context/QuickViewContext";
import { formatPrice } from "../../utils/currency";
import { useCatalog } from "../../context/CatalogContext";

/**
 * Reusable product card. `ratio` lets layouts mix proportions ("4/5", "1/1", "3/4", "5/4").
 * Clicking the image opens the quick view (there is no separate product page).
 */
export default function ProductCard({ product, ratio = "4/5", className = "", eager = false }) {
  const { openQuickView } = useQuickView();
  const { getCategoryLabel } = useCatalog();
  const soldOut = !product.isAvailable;

  return (
    <motion.article className={`group ${className}`} initial="rest" animate="rest" whileHover="hover">
      <button
        type="button"
        onClick={() => openQuickView(product)}
        aria-label={`Quick view: ${product.name}`}
        className="relative block w-full overflow-hidden rounded-sm bg-evergreen text-left"
      >
        <motion.div variants={{ rest: { scale: 1 }, hover: { scale: 1.05 } }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <LazyImage src={product.images[0]} alt={product.name} ratio={ratio} eager={eager} />
        </motion.div>

        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full border border-ivory/30 bg-forest/80 px-3 py-1 text-xs text-ivory">
            Sold out
          </span>
        )}

        <motion.span
          variants={{ rest: { opacity: 0, y: 8 }, hover: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.3 }}
          className="absolute inset-x-3 bottom-3 hidden items-center justify-center gap-2 rounded-full bg-ivory/95 py-2.5 text-sm font-medium text-forest [@media(hover:hover)]:flex"
        >
          <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Quick view
        </motion.span>
        <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-ivory/90 text-forest [@media(hover:hover)]:hidden" aria-hidden="true">
          <Eye className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </button>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-xl leading-tight text-ivory sm:text-2xl">{product.name}</h3>
          <p className="mt-1 text-sm text-mist">{getCategoryLabel(product.category)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base text-ivory">{formatPrice(product.price)}</p>
          <p className={`mt-0.5 text-xs ${soldOut ? "text-mist/70" : "text-sage"}`}>{soldOut ? "Sold out" : "Available"}</p>
        </div>
      </div>
    </motion.article>
  );
}
