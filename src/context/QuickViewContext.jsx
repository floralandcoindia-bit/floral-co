import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import ProductQuickView from "../components/shop/ProductQuickView";

const QuickViewContext = createContext(null);

/** Renders one quick-view modal at the app root so any page can open it. */
export function QuickViewProvider({ children }) {
  const [product, setProduct] = useState(null);
  const openQuickView = useCallback((p) => setProduct(p), []);
  const closeQuickView = useCallback(() => setProduct(null), []);
  const value = useMemo(() => ({ openQuickView, closeQuickView }), [openQuickView, closeQuickView]);

  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {product && <ProductQuickView key={product.id} product={product} onClose={closeQuickView} />}
      </AnimatePresence>
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  const ctx = useContext(QuickViewContext);
  if (!ctx) throw new Error("useQuickView must be used inside <QuickViewProvider>");
  return ctx;
}
