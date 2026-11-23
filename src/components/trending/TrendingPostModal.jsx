import { useRef } from "react";
import { motion } from "motion/react";
import { ExternalLink, X } from "lucide-react";
import Button from "../common/Button";
import LazyImage from "../common/LazyImage";
import { useDialog } from "../../hooks/useDialog";
import { getProductById } from "../../data/products";
import { formatPrice } from "../../utils/currency";

export default function TrendingPostModal({ post, onClose, onViewProduct }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  useDialog({ onClose, panelRef, initialFocusRef: closeRef });
  const product = post.productId ? getProductById(post.productId) : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-black/75"
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
        aria-label={`Post: ${post.caption}`}
        data-lenis-prevent
        className="relative z-10 max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-t-2xl border border-ivory/10 bg-evergreen shadow-2xl sm:rounded-sm md:grid md:h-[min(46rem,90dvh)] md:max-h-none md:grid-cols-[1.1fr_1fr] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden"
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close post"
          className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-forest/80 text-ivory transition-colors hover:bg-forest"
        >
          <X className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </button>

        <div className="bg-forest md:h-full">
          {post.type === "video" ? (
            <video
              src={post.src}
              poster={post.poster || undefined}
              controls
              playsInline
              loop
              className="aspect-[4/5] w-full object-cover md:aspect-auto md:h-full"
            />
          ) : (
            <img src={post.src} alt={post.caption} className="aspect-[4/5] w-full object-cover md:aspect-auto md:h-full" />
          )}
        </div>

        <div data-lenis-prevent className="flex flex-col gap-6 p-6 sm:p-8 md:overflow-y-auto">
          <div>
            <p className="text-sm text-mist">{post.category}</p>
            <p className="mt-3 pr-10 font-serif text-3xl leading-snug sm:text-4xl">{post.caption}</p>
          </div>

          {product && (
            <div className="border-t border-ivory/10 pt-6">
              <p className="mb-4 text-sm text-mist">Featured in this post</p>
              <div className="flex items-center gap-4">
                <div className="w-20 shrink-0">
                  <LazyImage src={product.images[0]} alt="" ratio="1/1" className="rounded-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-xl leading-tight">{product.name}</p>
                  <p className="mt-1 text-sm text-mist">
                    {formatPrice(product.price)} · {product.isAvailable ? "Available" : "Sold out"}
                  </p>
                </div>
              </div>
              <Button onClick={() => onViewProduct(product)} variant="primary" className="mt-5">View product</Button>
            </div>
          )}

          {post.instagramUrl && (
            <a
              href={post.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center gap-2 text-sm text-ivory underline underline-offset-4 transition-colors hover:text-sage"
            >
              View the original post on Instagram
              <ExternalLink className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}
