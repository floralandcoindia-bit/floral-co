import { db } from "../server/supabase.js";
import { allow, clientIp, readBody, requireMethod, send, str } from "../server/http.js";
import { urlEndpoint } from "../server/imagekit.js";

// Saves the uploaded order picture on the order. Needs the secret token that only the browser which placed the order has.
export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  try {
    if (!(await allow(`attach-ip:${clientIp(req)}`, 20, 3600))) return send(res, 429, { error: "rate_limited" });

    const body = readBody(req);
    const orderNumber = str(body.orderNumber, 40);
    const attachToken = str(body.attachToken, 80);
    const imageUrl = str(body.imageUrl, 600);
    const fileId = str(body.fileId, 80);

    const endpoint = urlEndpoint();
    if (!orderNumber || !attachToken || !fileId || !endpoint || !imageUrl.startsWith(`${endpoint}/`)) {
      return send(res, 400, { error: "invalid" });
    }

    const { data, error } = await db()
      .from("orders")
      .update({ image_url: imageUrl, image_file_id: fileId })
      .eq("order_number", orderNumber)
      .eq("attach_token", attachToken)
      .is("image_url", null)
      .neq("status", "dismissed")
      .select("id");
    if (error) throw error;
    if (!data?.length) return send(res, 404, { error: "not_found" });
    send(res, 200, { ok: true });
  } catch (err) {
    console.error("order-attach failed:", err);
    send(res, 500, { error: "server" });
  }
}
