import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Loader2, RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Seo from "../components/common/Seo";
import Button from "../components/common/Button";
import { forgetOrder, getRecentOrders, rememberOrder, trackOrder } from "../lib/orders";
import { formatPrice } from "../utils/currency";
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

function Result({ order, compact = false }) {
  const dismissed = order.status === "dismissed";
  const headingId = `order-result-${order.orderNumber}`;
  return (
    <section aria-labelledby={headingId} className={`${compact ? "mt-4" : "mt-10"} rounded-sm border border-ivory/15 bg-evergreen/60 p-6 sm:p-8`}>
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

      {!dismissed && order.items?.length > 0 && (
        <div className="mt-8 border-t border-ivory/10 pt-6">
          <h3 className="text-2xl">Your items</h3>
          <ul className="mt-4 divide-y divide-ivory/10">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-4 py-3">
                <div>
                  <p className="text-ivory">{item.name} <span className="text-mist">× {item.quantity}</span></p>
                  {Object.entries(item.customisations || {}).map(([k, v]) => (
                    <p key={k} className="text-sm text-mist">{k}: {v}</p>
                  ))}
                </div>
                <p className="shrink-0 text-ivory">{formatPrice(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-ivory/10 pt-4">
            <span className="text-mist">Subtotal (shipping confirmed on WhatsApp)</span>
            <span className="font-serif text-3xl text-gold">{formatPrice(order.subtotal)}</span>
          </div>
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


const STATUS_TONE = {
  waiting: "border-gold/50 bg-gold/10 text-gold",
  delivered: "border-sage/60 bg-sage/15 text-ivory",
};

/** Orders saved on this device, with their live status. Rejected / expired / deleted orders drop off by themselves. */
function SavedOrders({ version }) {
  const [, redraw] = useReducer((n) => n + 1, 0); // re-read the saved list after a removal
  const [rows, setRows] = useState({}); // order number -> { state: "loading" | "ok" | "error", order }
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const saved = getRecentOrders().filter((o) => o.last4);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const list = getRecentOrders().filter((o) => o.last4);
    if (!list.length) return;
    setBusy(true);
    setRows((r) => Object.fromEntries(list.map((o) => [o.no, r[o.no]?.order ? { ...r[o.no] } : { state: "loading" }])));
    for (const o of list) {
      const res = await trackOrder(o.no, o.last4);
      if (!alive.current) return;
      if (res.order && res.order.status !== "dismissed") {
        setRows((r) => ({ ...r, [o.no]: { state: "ok", order: res.order } }));
      } else if (res.order || res.error === "not_found") {
        // Rejected, expired (details erased) or deleted: not approved, so it is removed from this device.
        forgetOrder(o.no);
        const why = res.order?.dismissReason === "rejected" ? "wasn't accepted" : "wasn't approved in time";
        toast(res.order ? `Order ${o.no} ${why}, so it was removed from this list.` : `Order ${o.no} no longer exists and was removed from this list.`, { icon: "ℹ️", duration: 6000 });
        setRows((r) => {
          const { [o.no]: _gone, ...rest } = r;
          return rest;
        });
        redraw();
      } else {
        setRows((r) => ({ ...r, [o.no]: { ...r[o.no], state: "error" } })); // keep it; we just couldn't check
      }
    }
    if (alive.current) setBusy(false);
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  if (!saved.length) {
    return (
      <section aria-labelledby="saved-title" className="mt-10 max-w-3xl rounded-sm border border-dashed border-ivory/20 p-6">
        <h2 id="saved-title" className="text-3xl">Your orders</h2>
        <p className="mt-2 text-mist">
          Orders you place on this device show up here with their status. Placed one on another phone? Find it below and it will be saved here too.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="saved-title" className="mt-10 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h2 id="saved-title" className="text-3xl sm:text-4xl">Your orders</h2>
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full border border-ivory/25 px-4 py-2 text-sm text-ivory transition-colors hover:bg-ivory/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh
        </button>
      </div>
      <p className="mt-2 text-sm text-mist">Saved on this device only. Clearing your browser data removes the list. Orders that aren't approved are removed automatically.</p>

      <ul className="mt-5 space-y-3">
        {saved.map((o) => {
          const row = rows[o.no];
          const order = row?.order;
          const step = order ? STEPS.findIndex((s) => s.id === order.status) : -1;
          const label = order ? STEPS[step]?.label || order.status : row?.state === "error" ? "Couldn't check" : "Checking…";
          const isOpen = open === o.no;
          return (
            <li key={o.no} className="rounded-sm border border-ivory/15 bg-evergreen/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl text-ivory">{o.no}</p>
                  <p className="text-sm text-mist">{order ? `Placed ${fmtDate(order.createdAt)}` : "Placed on this device"}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-sm ${STATUS_TONE[order?.status] || "border-ivory/25 text-ivory"}`}>{label}</span>
              </div>

              {order && step >= 0 && (
                <div className="mt-4" role="img" aria-label={`Step ${step + 1} of ${STEPS.length}: ${label}`}>
                  <div className="flex gap-1">
                    {STEPS.map((s, i) => (
                      <span key={s.id} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-gold" : "bg-ivory/15"}`} />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-mist">{STEPS[step].hint}</p>
                  {order.status === "waiting" && order.expiresAt && (
                    <p className="mt-1 text-xs text-mist">If it isn't approved by {fmtDate(order.expiresAt)}, it will be removed.</p>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={!order}
                  onClick={() => setOpen(isOpen ? null : o.no)}
                  aria-expanded={isOpen}
                  className="inline-flex items-center gap-1.5 text-sm text-ivory underline-offset-4 hover:underline disabled:opacity-40"
                >
                  {isOpen ? "Hide details" : "View details"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    forgetOrder(o.no);
                    redraw();
                  }}
                  className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-ivory"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
                </button>
              </div>
              {isOpen && order && <Result order={order} compact />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function MyOrder() {
  const [params, setParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("no") || "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { order } | { error }
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const recent = getRecentOrders();

  useEffect(() => {
    // Only jump into the form when arriving from a tracking link (no keyboard pop-up otherwise)
    if (orderNumber) document.getElementById("track-phone")?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    const no = orderNumber.trim().toUpperCase();
    const r = await trackOrder(no, phone);
    setResult(r);
    setBusy(false);
    if (r.order && r.order.status !== "dismissed") {
      rememberOrder(r.order.orderNumber, phone); // keep it on this device so it shows in "Your orders"
      bump();
    }
    if (no) setParams({ no }, { replace: true });
  };

  const canSubmit = orderNumber.trim().length >= 8 && phone.replace(/\D/g, "").length >= 4;

  return (
    <div className="container-page pb-24 pt-32">
      <Seo title="My Orders" description="Track your order with your order number and the last 4 digits of your phone number." />
      <h1 className="text-6xl sm:text-8xl">My Orders</h1>
      <p className="mt-4 max-w-xl text-lg text-mist">Follow your orders from approval to delivery.</p>

      <SavedOrders version={version} />

      <h2 className="mt-14 text-3xl sm:text-4xl">Find an order</h2>
      <p className="mt-2 max-w-xl text-mist">Enter your order number and the last 4 digits of the phone number you used when ordering.</p>

      <form onSubmit={submit} className="mt-6 grid max-w-2xl gap-5 sm:grid-cols-2" noValidate>
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
            maxLength={15}
            placeholder="1234"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" size="lg" disabled={busy || !canSubmit}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? "Looking…" : "Find my order"}
          </Button>
          {recent.length > 0 && (
            <p className="mt-4 text-sm text-mist">
              Recent on this device:{" "}
              {recent.map((o) => (
                <button key={o.no} type="button" onClick={() => setOrderNumber(o.no)} className="mr-3 underline underline-offset-4 hover:text-ivory">
                  {o.no}
                </button>
              ))}
            </p>
          )}
        </div>
      </form>

      <div aria-live="polite">
        {result?.order && <Result order={result.order} />}
        {result?.error === "not_found" && (
          <p role="alert" className="mt-10 max-w-xl rounded-sm border border-dashed border-ivory/25 p-5 text-ivory">
            Order not found. Please check the order number and the last 4 digits of your phone. If your order was deleted, it can't be looked up any more.
          </p>
        )}
        {result?.error === "rate_limited" && (
          <p role="alert" className="mt-10 max-w-xl rounded-sm border border-dashed border-ivory/25 p-5 text-ivory">
            Too many tries. Please wait a few minutes and try again.
          </p>
        )}
        {result?.error === "server" && (
          <p role="alert" className="mt-10 max-w-xl rounded-sm border border-dashed border-ivory/25 p-5 text-ivory">
            We couldn't check right now. Please try again in a moment.
          </p>
        )}
      </div>
    </div>
  );
}
