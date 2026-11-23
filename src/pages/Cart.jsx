import { AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import Seo from "../components/common/Seo";
import Button from "../components/common/Button";
import CartItem from "../components/cart/CartItem";
import OrderSummary from "../components/cart/OrderSummary";
import OrderForm from "../components/cart/OrderForm";
import { useCart } from "../hooks/useCart";

export default function Cart() {
  const { items, count, subtotal, clearCart, loading, hasLines } = useCart();

  const handleClear = () => {
    if (window.confirm("Remove everything from your cart?")) {
      clearCart();
      toast("Cart cleared.");
    }
  };

  return (
    <div className="container-page pb-16 pt-32">
      <Seo title="My Cart" />
      <h1 className="text-6xl sm:text-8xl">My Cart</h1>

      {loading && hasLines ? (
        <p role="status" className="mt-14 text-mist">Loading your cart…</p>
      ) : items.length === 0 ? (
        <div className="mt-14 max-w-xl">
          <p className="font-serif text-4xl leading-tight sm:text-5xl">Your little collection starts here.</p>
          <p className="mt-4 text-mist">Nothing in your cart yet. Browse the shop and add the pieces you love.</p>
          <Button to="/shop" variant="primary" size="lg" className="mt-8">Shop the collection</Button>
        </div>
      ) : (
        <>
          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
            <section aria-label="Items in your cart" className="lg:col-span-7">
              <ul className="relative divide-y divide-ivory/10 border-y border-ivory/10">
                <AnimatePresence initial={false} mode="popLayout">
                  {items.map((item) => (
                    <CartItem key={item.lineId} item={item} />
                  ))}
                </AnimatePresence>
              </ul>
              <button type="button" onClick={handleClear} className="mt-5 text-sm text-mist underline underline-offset-4 transition-colors hover:text-ivory">
                Clear cart
              </button>
            </section>

            <aside aria-label="Order summary" className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
              <OrderSummary count={count} subtotal={subtotal} />
            </aside>
          </div>

          <div className="mt-24 border-t border-ivory/10 pt-16">
            <OrderForm items={items} subtotal={subtotal} />
          </div>
        </>
      )}
    </div>
  );
}
