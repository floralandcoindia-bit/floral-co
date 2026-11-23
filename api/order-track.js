import { db } from "../server/supabase.js";
import { allow, clientIp, readBody, requireMethod, send, str } from "../server/http.js";

const NOT_FOUND = { error: "not_found" };

// Customer order tracking. Needs the order number AND the last 4 digits of the phone used on the order.
// Wrong number, wrong digits and deleted orders all give the same "not found" answer, so nothing can be probed.
export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  try {
    const body = readBody(req);
    const orderNumber = str(body.orderNumber, 40).toUpperCase().replace(/\s+/g, "");
    const digits = str(body.phone, 30).replace(/\D/g, "");
    if (!/^FC-\d{4}-\d{4}$/.test(orderNumber) || digits.length < 4) return send(res, 404, NOT_FOUND);

    if (!(await allow(`track-ip:${clientIp(req)}`, 30, 600))) return send(res, 429, { error: "rate_limited" });
    if (!(await allow(`track-order:${orderNumber}`, 15, 3600))) return send(res, 429, { error: "rate_limited" });

    const { data: order, error } = await db()
      .from("orders")
      .select("order_number,status,dismiss_reason,items,subtotal,admin_note,status_history,expires_at,created_at,phone_last4")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (error) throw error;
    if (!order || order.phone_last4 !== digits.slice(-4)) return send(res, 404, NOT_FOUND);

    const dismissed = order.status === "dismissed";
    send(res, 200, {
      orderNumber: order.order_number,
      status: order.status,
      dismissReason: dismissed ? order.dismiss_reason : null,
      items: dismissed ? [] : order.items,
      subtotal: dismissed ? null : order.subtotal,
      adminNote: order.admin_note,
      history: order.status_history,
      expiresAt: order.status === "waiting" ? order.expires_at : null,
      createdAt: order.created_at,
    });
  } catch (err) {
    console.error("order-track failed:", err);
    send(res, 500, { error: "server" });
  }
}
