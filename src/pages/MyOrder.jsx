import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Seo from "../components/common/Seo";
import Button from "../components/common/Button";
import { trackOrder } from "../lib/orders";
import { siteConfig } from "../config/site";

export const STEPS = [
  { id: "waiting", label: "Waiting for approval", hint: "We're checking your order. We reply within 24 hours." },
  { id: "approved", label: "Approved", hint: "Your order is confirmed. We'll message you about payment on WhatsApp." },
  { id: "crafting", label: "Crafting", hint: "Your pieces are being made by hand." },
  { id: "packed", label: "Packed", hint: "Everything is wrapped and ready to go." },
  { id: "shipped", label: "Shipped", hint: "Your order is on its way." },
  { id: "delivered", label: "Delivered", hint: "Enjoy! Thank you for choosing us." },
];

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString(siteConfig.currency.locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";

function Timeline({ order }) {
  const current = STEPS.findIndex((s) => s.id === order.status);
  const when = (id) => [...(order.history || [])].reverse().find((h) => h.status === id)?.at;
  return (
    <ol className="mt-6 space-y-0">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.id} className="relative flex gap-4 pb-7 last:pb-0" aria-current={active ? "step" : undefined}>
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className={`absolute left-[11px] top-6 h-full w-px ${done ? "bg-gold/70" : "bg-ivory/15"}`} />
            )}
            <span
              aria-hidden="true"
              className={`relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] ${
                active ? "border-gold bg-gold text-forest" : done ? "border-gold/70 bg-gold/20 text-gold" : "border-ivory/25 text-mist"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <div>
              <p className={`font-medium ${active ? "text-gold" : done ? "text-ivory" : "text-mist"}`}>
                {step.label}
                {(done || active) && when(step.id) && <span className="ml-2 text-xs font-normal text-mist">{fmtDate(when(step.id))}</span>}
              </p>
              {active && <p className="mt-0.5 text-sm text-mist">{step.hint}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Result({ order }) {
  const dismissed = order.status === "dismissed";
  const headingId = `order-result-${order.orderNumber}`;
  return (
    <section aria-labelledby={headingId} className="mt-10 max-w-2xl rounded-sm border border-ivory/15 bg-evergreen/60 p-6 sm:p-8">
      <p className="text-sm text-mist">Order</p>
      <h2 id={headingId} className="text-4xl sm:text-5xl">{order.orderNumber}</h2>
      <p className="mt-1 text-sm text-mist">Placed {fmtDate(order.createdAt)}</p>

      {dismissed ? (
        <div role="status" className="mt-6 rounded-sm border border-gold/40 bg-gold/10 p-4 text-ivory">
          {order.dismissReason === "rejected" ? (
            <p>We couldn't accept this order. Please message us on WhatsApp if you'd like to know more or try again.</p>
          ) : (
            <p>This order was dismissed because it wasn't approved in time. Your details have been removed. You're welcome to place it again.</p>
          )}
        </div>
      ) : (
        <>
          <Timeline order={order} />
          {order.status === "waiting" && order.expiresAt && (
            <p className="mt-6 text-sm text-mist">
              If we haven't approved it by {fmtDate(order.expiresAt)}, it will be dismissed and your details erased.
            </p>
          )}
        </>
      )}

      {order.adminNote && (
        <div className="mt-6 rounded-sm border border-ivory/15 bg-forest/60 p-4">
          <p className="text-xs uppercase tracking-wider text-sage">Note from {siteConfig.brandName}</p>
          <p className="mt-1 whitespace-pre-line text-ivory">{order.adminNote}</p>
        </div>
      )}

      <div className="mt-8">
        <Button href={siteConfig.whatsappLink(`Hi ${siteConfig.brandName}! About my order ${order.orderNumber}: `)} variant="outline" size="sm">
          Message us on WhatsApp
        </Button>
      </div>
    </section>
  );
}

const MESSAGE = {
  not_found: "Order not found. Please check the order number and the last 4 digits of your phone. If your order was deleted, it can't be looked up any more.",
  rate_limited: "Too many tries. Please wait a few minutes and try again.",
  server: "We couldn't check right now. Please try again in a moment.",
};

export default function MyOrder() {
  const [params, setParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("no") || "");
  const [last4, setLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { order } | { error }

  const canSubmit = orderNumber.trim().length >= 8 && last4.length === 4;

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !canSubmit) return;
    setBusy(true);
    setResult(null);
    const no = orderNumber.trim().toUpperCase();
    setResult(await trackOrder(no, last4));
    setBusy(false);
    setParams({ no }, { replace: true });
  };

  return (
    <div className="container-page pb-24 pt-32">
      <Seo title="Track My Order" description="Track your order with your order number and the last 4 digits of your phone number." />
      <h1 className="text-6xl sm:text-8xl">Track My Order</h1>
      <p className="mt-4 max-w-xl text-lg text-mist">Enter your order number and the last 4 digits of your phone number.</p>

      <form onSubmit={submit} className="mt-10 grid max-w-2xl gap-5 sm:grid-cols-2" noValidate>
        <div>
          <label htmlFor="track-no" className="mb-1.5 block text-sm text-ivory">Order number</label>
          <input
            id="track-no"
            className="field uppercase"
            placeholder="FC-2611-4827"
            autoComplete="off"
            autoCapitalize="characters"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="track-phone" className="mb-1.5 block text-sm text-ivory">Last 4 digits of your phone</label>
          <input
            id="track-phone"
            className="field"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder="1234"
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" size="lg" disabled={busy || !canSubmit}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? "Looking…" : "Track order"}
          </Button>
        </div>
      </form>

      <div aria-live="polite">
        {result?.order && <Result order={result.order} />}
        {result?.error && (
          <p role="alert" className="mt-10 max-w-xl rounded-sm border border-dashed border-ivory/25 p-5 text-ivory">
            {MESSAGE[result.error] || MESSAGE.server}
          </p>
        )}
      </div>
    </div>
  );
}
