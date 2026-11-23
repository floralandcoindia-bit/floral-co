import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Minus, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../common/Button";
import { useCart } from "../../hooks/useCart";
import { useScrollLock } from "../../hooks/useScrollLock";
import { MAX_QUANTITY } from "../../context/CartContext";
import { formatPrice } from "../../utils/currency";
import { useCatalog } from "../../context/CatalogContext";
import { siteConfig } from "../../config/site";

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

export default function ProductQuickView({ product, onClose }) {
  const { addItem } = useCart();
  const { getCategoryLabel } = useCatalog();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const soldOut = !product.isAvailable;

  useScrollLock(true);

  // Escape to close, focus trap, restore focus on exit
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous && previous.focus) previous.focus();
    };
  }, [onClose]);

  const handleAdd = () => {
    const text = note.trim();
    addItem(product, { quantity, customisations: text ? { Note: text } : {} });
    toast.success(`${product.name} added to your cart.`);
    onClose();
  };

  const titleId = `qv-title-${product.id}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-lenis-prevent
        className="relative z-10 max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-t-2xl border border-ivory/10 bg-evergreen shadow-2xl sm:rounded-sm md:grid md:h-[min(46rem,90dvh)] md:max-h-none md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:overflow-hidden"
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-forest/80 text-ivory transition-colors hover:bg-forest"
        >
          <X className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </button>

        {/* Gallery */}
        <div className="relative bg-forest md:h-full">
          <motion.img
            key={activeImage}
            src={product.images[activeImage]}
            alt={`${product.name}, view ${activeImage + 1} of ${product.images.length}`}
            className="aspect-[4/5] w-full object-cover md:aspect-auto md:h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
          {product.images.length > 1 && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === activeImage}
                  className={`h-14 w-12 overflow-hidden rounded-sm border transition-opacity ${
                    i === activeImage ? "border-ivory opacity-100" : "border-ivory/30 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div data-lenis-prevent className="flex flex-col gap-6 p-6 sm:p-8 md:overflow-y-auto">
          <div>
            <p className="text-sm text-mist">{getCategoryLabel(product.category)}</p>
            <h2 id={titleId} className="mt-2 pr-10 text-4xl sm:text-5xl">{product.name}</h2>
            <p className="mt-4 flex items-baseline gap-4">
              <span className="font-serif text-3xl text-gold">{formatPrice(product.price)}</span>
              <span className={`text-sm ${soldOut ? "text-mist/70" : "text-sage"}`}>{soldOut ? "Sold out" : "Available"}</span>
            </p>
          </div>

          <p className="max-w-prose text-mist">{product.description}</p>

          <div>
            <label htmlFor={`qv-${product.id}-note`} className="mb-1.5 block text-sm text-ivory">
              Note for customisation <span className="text-mist">(optional)</span>
            </label>
            <textarea
              id={`qv-${product.id}-note`}
              rows={3}
              maxLength={300}
              disabled={soldOut}
              className="field resize-y"
              placeholder="Name, colour, message, anything you'd like changed…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="mt-auto space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-ivory/20" role="group" aria-label="Quantity">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={soldOut || quantity <= 1}
                  aria-label="Decrease quantity"
                  className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-ivory/10 disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="w-8 text-center tabular-nums" aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                  disabled={soldOut || quantity >= MAX_QUANTITY}
                  aria-label="Increase quantity"
                  className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-ivory/10 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <Button onClick={handleAdd} disabled={soldOut} variant="primary" size="lg" className="flex-1">
                {soldOut ? "Currently unavailable" : "Add to cart"}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-mist/80">
              {siteConfig.orderNote}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
