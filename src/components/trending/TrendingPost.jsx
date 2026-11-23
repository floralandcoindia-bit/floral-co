import toast from "react-hot-toast";
import { ShoppingBag } from "lucide-react";
import Reveal from "../common/Reveal";
import LazyImage from "../common/LazyImage";
import { useCart } from "../../hooks/useCart";
import { useQuickView } from "../../context/QuickViewContext";
import { useCatalog } from "../../context/CatalogContext";
import { formatPrice } from "../../utils/currency";

/** One card for a product marked "Trending": category header, picture, price + add to cart, then the name and description. */
export default function TrendingPost({ product }) {
  const { addItem } = useCart();
  const { getCategoryLabel } = useCatalog();
  const { openQuickView } = useQuickView();
  const soldOut = !product.isAvailable;
  const needsChoices = product.customisationOptions?.some((o) => o.required);

  const onAdd = () => {
    if (soldOut) return;
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
      <header className="px-4 py-3.5">
        <p className="font-serif text-xl leading-none text-ivory">{getCategoryLabel(product.category)}</p>
      </header>

      <button type="button" onClick={() => openQuickView(product)} aria-label={`View details: ${product.name}`} className="block w-full text-left">
        <LazyImage src={product.images[0]} alt={product.name} ratio="4/5" />
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
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

      <div className="px-4 pb-5 pt-3 text-[15px] leading-relaxed text-ivory/90">
        <p className="font-medium text-ivory">{product.name}</p>
        {product.description && <p className="mt-1 line-clamp-3 text-sm text-mist">{product.description}</p>}
      </div>
    </Reveal>
  );
}
