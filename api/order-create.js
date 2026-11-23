import { randomBytes, randomInt } from "node:crypto";
import { db } from "../server/supabase.js";
import { allow, clientIp, readBody, requireMethod, send, str } from "../server/http.js";
import { imagekitConfigured, uploadAuth } from "../server/imagekit.js";

const MAX_ITEMS = 30;
const MAX_QTY = 20;

// Order numbers look like FC-2611-4827 (year+month in India time, then 4 random digits).
function makeOrderNumber() {
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
  const yy = String(ist.getUTCFullYear()).slice(2);
  const mm = String(ist.getUTCMonth() + 1).padStart(2, "0");
  return `FC-${yy}${mm}-${String(randomInt(0, 10000)).padStart(4, "0")}`;
}

/** Every product takes one optional free-text note for customisation. Returns clean {Note} or {}. */
function cleanCustomisations(_product, given) {
  const input = given && typeof given === "object" ? given : {};
  const note = str(input.Note, 300);
  return { value: note ? { Note: note } : {} };
}

export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  try {
    const body = readBody(req);
    if (body.website) return send(res, 200, { ok: true }); // honeypot field: real customers never fill it

    const ip = clientIp(req);
    if (!(await allow(`order-ip:${ip}`, 6, 3600))) {
      return send(res, 429, { error: "rate_limited", message: "Too many orders from this device. Please try again in a little while." });
    }

    const customer = {
      name: str(body.customer?.name, 80),
      phone: str(body.customer?.phone, 30),
      address: str(body.customer?.address, 500),
    };
    const notes = str(body.notes, 600);
    const digits = customer.phone.replace(/\D/g, "");
    if (!customer.name) return send(res, 400, { error: "invalid", message: "Please add your name." });
    if (digits.length < 7 || digits.length > 15) return send(res, 400, { error: "invalid", message: "Please enter a valid phone number." });
    if (customer.address.length < 5) return send(res, 400, { error: "invalid", message: "Please add your delivery address." });

    if (!(await allow(`order-phone:${digits}`, 4, 86400))) {
      return send(res, 429, { error: "rate_limited", message: "This phone number has placed several orders today. Please message us on WhatsApp." });
    }

    const lines = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS + 1) : [];
    if (!lines.length) return send(res, 400, { error: "invalid", message: "Your cart is empty." });
    if (lines.length > MAX_ITEMS) return send(res, 400, { error: "invalid", message: "That is a lot of items. Please split it into two orders." });

    const ids = [...new Set(lines.map((l) => String(l?.productId || "")))];
    const { data: products, error: pErr } = await db().from("products").select("*").in("id", ids);
    if (pErr) throw pErr;
    const byId = new Map((products || []).map((p) => [p.id, p]));

    // Prices come from the database, never from the browser.
    const items = [];
    for (const line of lines) {
      const product = byId.get(String(line?.productId || ""));
      if (!product) return send(res, 400, { error: "invalid", message: "An item in your cart is no longer sold. Please refresh the page." });
      if (!product.is_available) return send(res, 400, { error: "invalid", message: `"${product.name}" is sold out right now. Please remove it from your cart.` });
      const quantity = Math.floor(Number(line.quantity));
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QTY) return send(res, 400, { error: "invalid", message: "Invalid quantity." });
      const custom = cleanCustomisations(product, line.customisations);
      if (custom.error) return send(res, 400, { error: "invalid", message: custom.error });
      const unitPrice = Number(product.price);
      const firstImage = (product.images || []).find((u) => /^https?:\/\//.test(u)) || "";
      items.push({
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice,
        lineTotal: Math.round(unitPrice * quantity * 100) / 100,
        customisations: custom.value,
        image: firstImage,
      });
    }
    const subtotal = Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;

    // Insert, retrying on the rare order-number clash.
    const attachToken = randomBytes(18).toString("hex");
    let order = null;
    for (let attempt = 0; attempt < 8 && !order; attempt++) {
      const { data, error } = await db()
        .from("orders")
        .insert({
          order_number: makeOrderNumber(),
          customer_name: customer.name,
          phone: customer.phone,
          phone_last4: digits.slice(-4),
          address: customer.address,
          notes: notes || null,
          items,
          subtotal,
          attach_token: attachToken,
        })
        .select("order_number, expires_at")
        .single();
      if (!error) order = data;
      else if (error.code !== "23505") throw error;
    }
    if (!order) return send(res, 503, { error: "busy", message: "We couldn't create your order number. Please try again." });

    const upload = imagekitConfigured()
      ? uploadAuth({ folder: "/floral-co/orders", fileName: `${order.order_number}.png` })
      : null;

    send(res, 200, {
      ok: true,
      orderNumber: order.order_number,
      expiresAt: order.expires_at,
      attachToken,
      subtotal,
      items,
      upload,
    });
  } catch (err) {
    console.error("order-create failed:", err);
    send(res, 500, { error: "server", message: "Something went wrong on our side. Please try again." });
  }
}
