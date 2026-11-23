import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Loader2, MessageCircle, RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import { siteConfig } from "../config/site";
import { formatPrice } from "../utils/currency";
import { adminCall } from "./api";
import { supabase } from "./supabase";
import { Badge, card, errMsg } from "./ui";

const TABS = [
  { id: "waiting", label: "Waiting approval", match: ["waiting"] },
  { id: "approved", label: "Approved", match: ["approved"] },
  { id: "progress", label: "In progress", match: ["crafting", "packed"] },
  { id: "shipped", label: "Shipped", match: ["shipped"] },
  { id: "delivered", label: "Delivered", match: ["delivered"] },
  { id: "dismissed", label: "Dismissed", match: ["dismissed"] },
];

const STATUS_LABEL = {
  waiting: "Waiting for approval",
  approved: "Approved",
  crafting: "Crafting",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  dismissed: "Dismissed",
};
const SETTABLE = ["waiting", "approved", "crafting", "packed", "shipped", "delivered"];
const NEXT = { approved: ["crafting", "Start crafting"], crafting: ["packed", "Mark packed"], packed: ["shipped", "Mark shipped"], shipped: ["delivered", "Mark delivered"] };

const fmt = (iso) => (iso ? new Date(iso).toLocaleString(siteConfig.currency.locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

function waNumber(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
}

function replyText(o, note) {
  const track = `${window.location.origin}/my-order?no=${o.order_number}`;
  const lines = {
    waiting: `Thank you for your order ${o.order_number}! We're checking it and will confirm very soon.`,
    approved: `Good news, your order ${o.order_number} is approved! The subtotal is ${formatPrice(o.subtotal)}. We'll share shipping and payment details here.`,
    crafting: `Your order ${o.order_number} is now being crafted by hand.`,
    packed: `Your order ${o.order_number} is packed and ready.`,
    shipped: `Your order ${o.order_number} has been shipped!`,
    delivered: `Your order ${o.order_number} should be with you now. We hope you love it!`,
    dismissed: `About your order ${o.order_number}:`,
  };
  return [`Hi ${o.customer_name || "there"}! This is ${siteConfig.brandName}.`, lines[o.status], note && note.trim(), `Track your order: ${track}`].filter(Boolean).join("\n\n");
}

function Countdown({ iso }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return <Badge tone="red">Expired: will be dismissed within the hour</Badge>;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return <Badge tone={h < 4 ? "red" : "gold"}>{h}h {String(m).padStart(2, "0")}m left to approve</Badge>;
}

function OrderCard({ order, onChange, onDeleted }) {
  const [open, setOpen] = useState(order.status === "waiting");
  const [note, setNote] = useState(order.admin_note || "");
  const [busy, setBusy] = useState(false);
  const erased = order.pii_erased;

  const update = async (patch, okMsg) => {
    setBusy(true);
    const payload = { ...patch };
    if (note !== (order.admin_note || "")) payload.admin_note = note.trim() || null;
    const { data, error } = await supabase.from("orders").update(payload).eq("id", order.id).select().single();
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    onChange(data);
    toast.success(okMsg || "Saved.");
  };

  const reject = () => {
    if (!window.confirm(`Reject order ${order.order_number}?\n\nIt moves to Dismissed. The customer's details are erased 24 hours later, so message them first if you want to.`)) return;
    update({ status: "dismissed", dismiss_reason: "rejected" }, "Order rejected.");
  };

  const del = async () => {
    if (!window.confirm(`Delete order ${order.order_number} completely?\n\nThe order and its picture on ImageKit are removed for good. The customer will see “Order not found”.`)) return;
    setBusy(true);
    try {
      await adminCall("delete-order", { id: order.id });
      toast.success("Order deleted.");
      onDeleted(order.id);
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  const wa = !erased && order.phone ? `https://wa.me/${waNumber(order.phone)}?text=${encodeURIComponent(replyText(order, note))}` : null;
  const next = NEXT[order.status];

  return (
    <li className={`${card} p-4`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-3 text-left">
        <div>
          <p className="font-serif text-2xl text-ivory">{order.order_number}</p>
          <p className="text-sm text-mist">
            {erased ? "Details erased" : order.customer_name} · {fmt(order.created_at)}
            {!erased && ` · ${formatPrice(order.subtotal)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {order.status === "waiting" && order.expires_at && <Countdown iso={order.expires_at} />}
          <Badge tone={order.status === "dismissed" ? "red" : order.status === "delivered" ? "green" : "neutral"}>
            {order.status === "dismissed" ? `Dismissed (${order.dismiss_reason})` : STATUS_LABEL[order.status]}
          </Badge>
          <ChevronDown className={`h-4 w-4 text-mist transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </div>
      </button>

      {open && (
        <div className="mt-5 grid gap-6 border-t border-ivory/10 pt-5 lg:grid-cols-2">
          <div className="space-y-5">
            {!erased ? (
              <dl className="space-y-1.5 text-sm">
                <div className="flex gap-3"><dt className="w-20 text-mist">Name</dt><dd className="text-ivory">{order.customer_name}</dd></div>
                <div className="flex gap-3"><dt className="w-20 text-mist">Phone</dt><dd className="text-ivory">{order.phone}</dd></div>
                <div className="flex gap-3"><dt className="w-20 shrink-0 text-mist">Address</dt><dd className="whitespace-pre-line text-ivory">{order.address}</dd></div>
                {order.notes && <div className="flex gap-3"><dt className="w-20 shrink-0 text-mist">Notes</dt><dd className="whitespace-pre-line text-ivory">{order.notes}</dd></div>}
              </dl>
            ) : (
              <p className="text-sm text-mist">This order was dismissed, so the customer's name, phone, address, notes and items were erased. Only the order number is kept.</p>
            )}

            {!erased && (
              <ul className="divide-y divide-ivory/10 rounded-sm border border-ivory/10">
                {(order.items || []).map((it, i) => (
                  <li key={i} className="flex justify-between gap-3 px-3 py-2 text-sm">
                    <div>
                      <p className="text-ivory">{it.name} <span className="text-mist">× {it.quantity}</span></p>
                      {Object.entries(it.customisations || {}).map(([k, v]) => <p key={k} className="text-xs text-sage">{k}: {v}</p>)}
                    </div>
                    <span className="text-ivory">{formatPrice(it.lineTotal)}</span>
                  </li>
                ))}
                <li className="flex justify-between px-3 py-2 text-sm"><span className="text-mist">Subtotal</span><span className="font-medium text-gold">{formatPrice(order.subtotal)}</span></li>
              </ul>
            )}

            {order.image_url && (
              <a href={order.image_url} target="_blank" rel="noopener noreferrer" className="block w-40" aria-label="Open the order picture in full size">
                <img src={order.image_url} alt="Order picture" loading="lazy" className="w-full rounded-sm border border-ivory/15" />
                <span className="mt-1 flex items-center gap-1 text-xs text-mist"><ExternalLink className="h-3 w-3" aria-hidden="true" /> Open full size</span>
              </a>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor={`note-${order.id}`} className="mb-1.5 block text-sm text-ivory">Note to customer <span className="text-mist">(shown on their My Order page)</span></label>
              <textarea id={`note-${order.id}`} rows={3} className="field" value={note} onChange={(e) => setNote(e.target.value)} disabled={busy} />
              {note !== (order.admin_note || "") && (
                <button type="button" onClick={() => update({}, "Note saved.")} disabled={busy} className="mt-1 text-sm text-gold hover:underline">Save note</button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {order.status === "waiting" && (
                <>
                  <Button onClick={() => update({ status: "approved" }, "Order approved.")} variant="primary" size="sm" disabled={busy}>Approve</Button>
                  <Button onClick={reject} variant="outline" size="sm" disabled={busy}>Reject</Button>
                </>
              )}
              {next && <Button onClick={() => update({ status: next[0] }, `Marked ${next[0]}.`)} variant="primary" size="sm" disabled={busy}>{next[1]}</Button>}
              {wa && (
                <Button href={wa} variant="green" size="sm"><MessageCircle className="h-4 w-4" aria-hidden="true" /> Message customer on WhatsApp</Button>
              )}
            </div>

            {order.status !== "dismissed" && (
              <div className="flex items-center gap-2 text-sm">
                <label htmlFor={`st-${order.id}`} className="text-mist">Change status</label>
                <select id={`st-${order.id}`} className="field w-auto py-1.5" value={order.status} disabled={busy} onChange={(e) => update({ status: e.target.value }, "Status updated.")}>
                  {SETTABLE.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            )}

            <button type="button" onClick={del} disabled={busy} className="flex items-center gap-1.5 text-sm text-red-300 hover:underline disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />} Delete order
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState("waiting");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
    setRefreshing(false);
    if (error) return quiet || toast.error(errMsg(error));
    setOrders(data);
  }, []);

  useEffect(() => {
    load(true);
    const t = setInterval(() => document.visibilityState === "visible" && load(true), 30000);
    return () => clearInterval(t);
  }, [load]);

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.id, (orders || []).filter((o) => t.match.includes(o.status)).length])), [orders]);
  const shown = useMemo(() => (orders || []).filter((o) => TABS.find((t) => t.id === tab).match.includes(o.status)), [orders, tab]);

  const replace = (row) => setOrders((os) => os.map((o) => (o.id === row.id ? row : o)));
  const removeLocal = (id) => setOrders((os) => os.filter((o) => o.id !== id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-5xl">Orders</h1>
        <button type="button" onClick={() => load()} className="flex items-center gap-2 text-sm text-mist hover:text-ivory">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh
        </button>
      </div>

      <div role="tablist" aria-label="Order status" className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              tab === t.id ? "border-ivory bg-ivory text-forest" : "border-ivory/25 text-mist hover:text-ivory"
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 text-xs ${tab === t.id ? "bg-forest/15" : "bg-ivory/10"}`}>{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {orders === null ? (
        <p className="mt-10 text-mist">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="mt-10 text-mist">No orders here.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {shown.map((o) => <OrderCard key={o.id} order={o} onChange={replace} onDeleted={removeLocal} />)}
        </ul>
      )}
    </div>
  );
}
