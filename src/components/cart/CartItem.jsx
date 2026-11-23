import { motion } from "motion/react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import LazyImage from "../common/LazyImage";
import QuantityStepper from "../common/QuantityStepper";
import { useCart } from "../../hooks/useCart";
import { formatPrice } from "../../utils/currency";
import { useCatalog } from "../../context/CatalogContext";

export default function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();
  const { getCategoryLabel } = useCatalog();
  const { product, quantity, unitPrice, lineTotal, customisations, lineId } = item;
  const entries = Object.entries(customisations || {});

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-4 py-7 sm:gap-6"
    >
      <div className="w-24 shrink-0 sm:w-32">
        <LazyImage src={product.images[0]} alt={product.name} ratio="4/5" className="rounded-sm" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-serif text-xl leading-tight sm:text-2xl">{product.name}</h3>
            <p className="mt-1 text-sm text-mist">{getCategoryLabel(product.category)}</p>
            {entries.length > 0 && (
              <dl className="mt-3 space-y-0.5 text-sm">
                {entries.map(([label, value]) => (
                  <div key={label} className="flex gap-2">
                    <dt className="text-mist">{label}:</dt>
                    <dd className="text-ivory">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <p className="shrink-0 text-ivory">{formatPrice(lineTotal)}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="flex items-center gap-3">
            <QuantityStepper value={quantity} onChange={(q) => updateQuantity(lineId, q)} label={`Quantity of ${product.name}`} />
            <span className="text-sm text-mist">{formatPrice(unitPrice)} each</span>
          </div>
          <button
            type="button"
            onClick={() => {
              removeItem(lineId);
              toast(`${product.name} removed.`);
            }}
            aria-label={`Remove ${product.name} from cart`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-mist transition-colors hover:bg-ivory/10 hover:text-ivory"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>
    </motion.li>
  );
}
