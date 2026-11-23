import { createContext, useCallback, useEffect, useMemo, useReducer } from "react";
import { useCatalog } from "./CatalogContext";

export const CartContext = createContext(null);

const STORAGE_KEY = "craft-store:cart:v1";
export const MAX_QUANTITY = 20;

// A "line" is a product + a specific set of customisations. Same product with
// different customisations becomes a separate line.
export function makeLineId(productId, customisations = {}) {
  const key = Object.keys(customisations)
    .sort()
    .map((k) => `${k}=${customisations[k]}`)
    .join("|");
  return key ? `${productId}::${key}` : productId;
}

const clampQty = (n) => Math.max(1, Math.min(MAX_QUANTITY, Math.floor(n)));

function loadLines() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && typeof l.productId === "string" && Number.isFinite(l.quantity) && l.quantity > 0)
      .map((l) => {
        const customisations = l.customisations && typeof l.customisations === "object" ? l.customisations : {};
        return {
          lineId: makeLineId(l.productId, customisations),
          productId: l.productId,
          quantity: clampQty(l.quantity),
          customisations,
        };
      });
  } catch {
    return [];
  }
}

function reducer(lines, action) {
  switch (action.type) {
    case "add": {
      const { productId, quantity, customisations } = action;
      const lineId = makeLineId(productId, customisations);
      const existing = lines.find((l) => l.lineId === lineId);
      if (existing) {
        return lines.map((l) =>
          l.lineId === lineId ? { ...l, quantity: clampQty(l.quantity + quantity) } : l
        );
      }
      return [...lines, { lineId, productId, quantity: clampQty(quantity), customisations }];
    }
    case "setQuantity": {
      if (action.quantity <= 0) return lines.filter((l) => l.lineId !== action.lineId);
      return lines.map((l) => (l.lineId === action.lineId ? { ...l, quantity: clampQty(action.quantity) } : l));
    }
    case "remove":
      return lines.filter((l) => l.lineId !== action.lineId);
    case "clear":
      return [];
    case "replace":
      return action.lines;
    default:
      return lines;
  }
}

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, null, loadLines);
  const { getProductById, loading: catalogLoading } = useCatalog();

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage may be unavailable (private mode); cart still works in memory */
    }
  }, [lines]);

  // Keep multiple tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) dispatch({ type: "replace", lines: loadLines() });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback((product, { quantity = 1, customisations = {} } = {}) => {
    if (!product || !product.isAvailable) return;
    dispatch({ type: "add", productId: product.id, quantity, customisations });
  }, []);
  const updateQuantity = useCallback((lineId, quantity) => dispatch({ type: "setQuantity", lineId, quantity }), []);
  const removeItem = useCallback((lineId) => dispatch({ type: "remove", lineId }), []);
  const clearCart = useCallback(() => dispatch({ type: "clear" }), []);

  const value = useMemo(() => {
    // Derive display data from the central product list (no duplicated product data in the cart).
    const items = lines.flatMap((l) => {
      const product = getProductById(l.productId);
      if (!product || !product.isAvailable) return [];
      return [{ ...l, product, unitPrice: product.price, lineTotal: product.price * l.quantity }];
    });
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    return { items, count, subtotal, hasLines: lines.length > 0, loading: catalogLoading, addItem, updateQuantity, removeItem, clearCart };
  }, [lines, getProductById, catalogLoading, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
