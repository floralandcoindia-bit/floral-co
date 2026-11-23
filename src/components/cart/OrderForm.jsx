import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Check, Download, Loader2, MessageCircle } from "lucide-react";
import Button from "../common/Button";
import { buildOrderMessage } from "../../utils/whatsappOrder";
import { buildOrderImage, downloadBlob, orderSignature } from "../../utils/orderImage";
import { attachPicture, createOrder, rememberOrder, trackUrl, uploadOrderPicture } from "../../lib/orders";
import { useCart } from "../../hooks/useCart";
import { siteConfig } from "../../config/site";

export default function OrderForm({ items, subtotal }) {
  const { clearCart } = useCart();
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null); // { url } of the draft picture shown while typing
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [placed, setPlaced] = useState(null); // set once the order exists
  const [failure, setFailure] = useState(null); // { message } when the order could not be created
  const busyRef = useRef(false); // blocks double taps even before React re-renders
  const refs = { name: useRef(null), phone: useRef(null), address: useRef(null) };
  const cacheRef = useRef({ key: null, blob: null });
  const pendingRef = useRef({ key: null, promise: null });

  const order = useMemo(() => ({ items, customer, notes, subtotal }), [items, customer, notes, subtotal]);
  const signature = useMemo(() => orderSignature(order), [order]);

  /** Draft picture that matches the CURRENT order data (reuses one that is still current). */
  const getDraft = (o = order, key = signature) => {
    if (cacheRef.current.key === key && cacheRef.current.blob) return Promise.resolve(cacheRef.current.blob);
    if (pendingRef.current.key === key && pendingRef.current.promise) return pendingRef.current.promise;
    const promise = buildOrderImage(o)
      .then((blob) => {
        cacheRef.current = { key, blob };
        return blob;
      })
      .finally(() => {
        if (pendingRef.current.promise === promise) pendingRef.current = { key: null, promise: null };
      });
    pendingRef.current = { key, promise };
    return promise;
  };

  // Draw a draft picture in the background while the customer types.
  useEffect(() => {
    if (placed) return undefined;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const blob = await getDraft();
        if (cancelled) return;
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old.url);
          return { url: URL.createObjectURL(blob) };
        });
      } catch {
        /* the final picture is drawn (and any problem handled) when the order is placed */
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, placed]);

  useEffect(() => () => setPreview((old) => (old && URL.revokeObjectURL(old.url), null)), []);

  const set = (key) => (e) => {
    setCustomer((c) => ({ ...c, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!customer.name.trim()) next.name = "Please add your name so we know who the order is from.";
    const digits = customer.phone.replace(/\D/g, "");
    if (!customer.phone.trim()) next.phone = "Please add your phone number.";
    else if (digits.length < 7 || digits.length > 15) next.phone = "Please enter a valid phone number (7 to 15 digits).";
    if (customer.address.trim().length < 5) next.address = "Please add your full delivery address.";
    setErrors(next);
    const first = ["name", "phone", "address"].find((k) => next[k]);
    if (first) refs[first].current?.focus();
    return !first;
  };

  // Opens the studio's WhatsApp chat with the message typed in. Returns false if the browser blocked it.
  // (No "noopener" feature string: it makes window.open always return null, so a real open couldn't be told from a block.)
  const openChat = (message) => {
    const w = window.open(siteConfig.whatsappLink(message), "_blank");
    if (!w) return false;
    try {
      w.opener = null;
    } catch {
      /* cross-origin: fine */
    }
    return true;
  };

  const handleOrder = async () => {
    if (busyRef.current) return; // already working: ignore repeat taps
    if (!items.length) return toast.error("Your cart is empty. Add something first.");
    if (!validate()) return;

    busyRef.current = true;
    setBusy(true);
    setFailure(null);
    try {
      // 1. The server creates the order, re-prices everything and gives us the order number.
      setStep("Placing your order…");
      let data;
      try {
        data = await createOrder({ items, customer, notes });
      } catch (err) {
        setFailure({ message: err.userFacing ? err.message : "We couldn't reach our order system right now." });
        return;
      }
      rememberOrder(data.orderNumber);

      // 2. Draw the final order picture (with the order number) from the server's prices.
      const finalItems = data.items.map((s, i) => ({
        lineId: `${s.productId}-${i}`,
        quantity: s.quantity,
        unitPrice: s.unitPrice,
        lineTotal: s.lineTotal,
        customisations: s.customisations,
        product: { name: s.name, images: [items[i]?.product?.images?.[0] || s.image] },
      }));
      let blob = null;
      try {
        setStep("Making your order picture…");
        blob = await buildOrderImage({ items: finalItems, customer, notes, subtotal: data.subtotal, orderNumber: data.orderNumber });
      } catch {
        blob = null;
      }

      // 3. Upload it to ImageKit and save the link on the order. If anything fails we carry on with text only.
      let imageUrl = "";
      if (blob && data.upload) {
        try {
          setStep("Uploading your picture…");
          const uploaded = await uploadOrderPicture(blob, data.upload);
          imageUrl = uploaded.url;
          await attachPicture({ orderNumber: data.orderNumber, attachToken: data.attachToken, ...uploaded }).catch(() => false);
        } catch {
          imageUrl = "";
        }
      }

      // 4. Open WhatsApp with everything typed in.
      const link = trackUrl(data.orderNumber);
      const message = buildOrderMessage({
        items: finalItems,
        customer,
        notes,
        subtotal: data.subtotal,
        orderNumber: data.orderNumber,
        imageUrl,
        trackUrl: link,
      });
      setStep("Opening WhatsApp…");
      const opened = openChat(message);
      setPlaced({ orderNumber: data.orderNumber, message, opened, hasPictureLink: Boolean(imageUrl), blob, trackLink: link });
    } catch {
      toast.error("Something went wrong placing your order. Please try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
      setStep("");
    }
  };

  // Last resort if our order system is unreachable: the studio still gets the order as a normal WhatsApp message.
  const sendPlainMessage = () => {
    if (!validate()) return;
    const opened = openChat(buildOrderMessage(order));
    if (!opened) toast.error("Your browser blocked WhatsApp. Please allow pop-ups and try again.");
  };

  const finish = () => {
    clearCart();
    toast.success("Thank you! We'll be in touch on WhatsApp.");
  };

  const field = (key) => ({
    ref: refs[key],
    value: customer[key],
    onChange: set(key),
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `order-${key}-error` : undefined,
  });
  const err = (key) =>
    errors[key] ? (
      <p id={`order-${key}-error`} role="alert" className="mt-1.5 text-sm text-gold">{errors[key]}</p>
    ) : null;

  return (
    <section id="checkout" aria-labelledby="checkout-title" className="scroll-mt-24">
      <h2 id="checkout-title" className="text-4xl sm:text-5xl">Send your order on WhatsApp</h2>
      <ol className="mt-5 max-w-2xl list-decimal space-y-1 pl-5 text-mist">
        <li>Add your delivery details below.</li>
        <li>Tap Place Order via WhatsApp. We create your order and an order number, and our chat opens with your message and order picture link already typed.</li>
        <li>Press send in WhatsApp. We reply to confirm availability and final pricing, and you can follow your order on My Order.</li>
      </ol>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <label htmlFor="order-name" className="mb-1.5 block text-sm text-ivory">Your name <span className="text-mist">(required)</span></label>
            <input id="order-name" type="text" autoComplete="name" className="field" {...field("name")} />
            {err("name")}
          </div>
          <div>
            <label htmlFor="order-phone" className="mb-1.5 block text-sm text-ivory">Phone number <span className="text-mist">(required)</span></label>
            <input id="order-phone" type="tel" inputMode="tel" autoComplete="tel" className="field" {...field("phone")} />
            {err("phone")}
          </div>
          <div>
            <label htmlFor="order-address" className="mb-1.5 block text-sm text-ivory">Delivery address <span className="text-mist">(required)</span></label>
            <textarea id="order-address" rows={3} autoComplete="street-address" className="field resize-y" {...field("address")} />
            {err("address")}
          </div>
          <div>
            <label htmlFor="order-notes" className="mb-1.5 block text-sm text-ivory">Notes <span className="text-mist">(optional)</span></label>
            <textarea id="order-notes" rows={3} placeholder="Gift message, deadline, colour preferences…" className="field resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col">
          <p className="mb-1.5 text-sm text-ivory">{placed ? "Your order" : "Your order picture (preview)"}</p>
          {!placed && (
            <div className="flex min-h-[16rem] items-center justify-center rounded-sm border border-ivory/15 bg-forest/60 p-3">
              {preview ? (
                <img src={preview.url} alt="Preview of your order picture" className="max-h-[26rem] w-auto rounded-sm" />
              ) : (
                <p className="text-sm text-mist">Preparing your picture…</p>
              )}
            </div>
          )}

          {!placed && (
            <>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={handleOrder} disabled={busy} aria-busy={busy} variant="primary" size="lg">
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  )}
                  {busy ? step || "Preparing your order..." : "Place Order via WhatsApp"}
                </Button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-mist">
                Your order picture shows your name, phone number and address. It is stored under a long private link and is deleted,
                together with your details, if the order isn't approved within 24 hours.
              </p>
            </>
          )}

          {failure && (
            <div role="alert" className="mt-5 rounded-sm border border-gold/40 bg-gold/10 p-4 text-sm leading-relaxed text-ivory">
              <p>{failure.message}</p>
              <p className="mt-2 text-mist">You can try again, or send your order to us as a plain WhatsApp message.</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button onClick={handleOrder} disabled={busy} variant="primary" size="sm">Try again</Button>
                <Button onClick={sendPlainMessage} variant="outline" size="sm">Send on WhatsApp anyway</Button>
              </div>
            </div>
          )}

          {placed && (
            <div role="status" className="rounded-sm border border-gold/40 bg-gold/10 p-5 text-sm leading-relaxed text-ivory">
              <p className="flex items-center gap-2 font-serif text-3xl text-gold">
                <Check className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" /> Order {placed.orderNumber}
              </p>
              <p className="mt-3">
                {placed.opened
                  ? "WhatsApp is opening with your order already typed. Press send so we receive it."
                  : "Your browser blocked WhatsApp from opening. Tap Open WhatsApp below, then press send."}
              </p>
              <p className="mt-3 text-mist">
                {placed.hasPictureLink
                  ? "Your order picture is attached to the message as a link."
                  : "We couldn't attach the order picture, but every detail is in the message itself."}{" "}
                We'll approve your order within 24 hours. After that you can follow it on My Order with the order number and the last 4 digits of your phone.
              </p>
              <p className="mt-3 text-mist">Keep your order number: <span className="font-medium text-ivory">{placed.orderNumber}</span></p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => openChat(placed.message)} variant="primary" size="sm">
                  <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Open WhatsApp
                </Button>
                <Button to={`/my-order?no=${encodeURIComponent(placed.orderNumber)}`} variant="outline" size="sm">Track this order</Button>
                {placed.blob && (
                  <Button onClick={() => downloadBlob(placed.blob, `${placed.orderNumber}.png`)} variant="ghost" size="sm">
                    <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Save picture
                  </Button>
                )}
              </div>
              <div className="mt-5 border-t border-gold/25 pt-4">
                <p className="text-mist">Once you've sent the message, clear your cart to start a fresh order.</p>
                <Button onClick={finish} variant="gold" size="sm" className="mt-3">I've sent it. Clear my cart</Button>
              </div>
            </div>
          )}

          <p className="mt-5 text-sm leading-relaxed text-mist">
            Nothing is ordered, charged or confirmed until we reply to you on WhatsApp. {siteConfig.orderNote}
          </p>
        </div>
      </div>
    </section>
  );
}
