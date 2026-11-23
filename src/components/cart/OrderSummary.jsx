import { formatPrice } from "../../utils/currency";
import { siteConfig } from "../../config/site";
import Button from "../common/Button";

export default function OrderSummary({ count, subtotal }) {
  return (
    <div className="rounded-sm border border-ivory/15 bg-evergreen/50 p-6 sm:p-8">
      <h2 className="text-3xl">Summary</h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-mist">Subtotal ({count} {count === 1 ? "item" : "items"})</dt>
          <dd className="text-ivory">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-mist">Shipping</dt>
          <dd className="text-ivory">To be confirmed</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-ivory/15 pt-4">
          <dt className="text-ivory">Total before shipping</dt>
          <dd className="font-serif text-3xl text-gold">{formatPrice(subtotal)}</dd>
        </div>
      </dl>
      <p className="mt-5 text-sm leading-relaxed text-mist">{siteConfig.shippingText}</p>
      <p className="mt-3 text-sm leading-relaxed text-mist">{siteConfig.orderNote}</p>
      <Button to="#checkout" variant="primary" size="lg" className="mt-7 w-full">Send your order</Button>
    </div>
  );
}
