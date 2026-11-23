import toast from "react-hot-toast";
import { ShoppingBag } from "lucide-react";
import Reveal from "../common/Reveal";
import LazyImage from "../common/LazyImage";
import { useCart } from "../../hooks/useCart";
import { useQuickView } from "../../context/QuickViewContext";
import { useCatalog } from "../../context/CatalogContext";
import { formatPrice } from "../../utils/currency";

/** One Instagram-style post: category header, picture, price + add to cart, then the caption with details. */
export default function TrendingPost({ post }) {
  const { addItem } = useCart();
  const { getProductById } = useCatalog();
  const { openQuickView } = useQuickView();
  const product = post.productId ? getProductById(post.productId) : null;
  const soldOut = product ? !product.isAvailable : false;
  const needsChoices = product?.customisationOptions?.some((o) => o.required);

  const onAdd = () => {
    if (!product || soldOut) return;
    // Products with required options (name, date…) open the quick view so nothing is missed
    if (needsChoices) {
      openQuickView(product);
      return;
    }
    addItem(product, { quantity: 1 });
    toast.success(`${product.name} added to your cart.`);
  };

  return (
    <Reveal as="article" y={20} className="overflow-hidden rounded-sm border border-ivory/10 bg-evergreen/60">
      {/* Top bar: category name only */}
      <header className="px-4 py-3.5">
        <p className="font-serif text-xl leading-none text-ivory">{post.category}</p>
      </header>

      <button
        type="button"
        onClick={() => (product ? openQuickView(product) : undefined)}
        aria-label={product ? `View details: ${product.name}` : post.caption}
        className="block w-full text-left"
      >
        {post.type === "video" ? (
          <video src={post.src} poster={post.poster || undefined} controls playsInline loop muted className="aspect-[4/5] w-full object-cover" />
        ) : (
          <LazyImage src={post.poster || post.src} alt={post.caption} ratio="4/5" />
        )}
      </button>

      {product && (
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <p className="font-serif text-2xl leading-none text-ivory">{formatPrice(product.price)}</p>
          <button
            type="button"
            onClick={onAdd}
            disabled={soldOut}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ivory px-5 text-sm font-medium text-forest transition-colors hover:bg-white disabled:opacity-50"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {soldOut ? "Sold out" : needsChoices ? "Choose options" : "Add to cart"}
          </button>
        </div>
      )}

      <div className="px-4 pb-5 pt-3 text-[15px] leading-relaxed text-ivory/90">
        {product && <p className="font-medium text-ivory">{product.name}</p>}
        <p>{post.caption}</p>
        {product?.description && <p className="mt-1 line-clamp-3 text-sm text-mist">{product.description}</p>}
      </div>
    </Reveal>
  );
}
