import { db, requireAdmin } from "../server/supabase.js";
import { readBody, requireMethod, send, str } from "../server/http.js";
import { deleteFile, imagekitConfigured, uploadAuth } from "../server/imagekit.js";

// One endpoint for the few admin actions that need secrets (the rest go straight to Supabase under row-level security).
export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  try {
    const admin = await requireAdmin(req);
    if (!admin) return send(res, 401, { error: "unauthorised" });

    const body = readBody(req);
    switch (body.action) {
      case "imagekit-auth": {
        if (!imagekitConfigured()) return send(res, 503, { error: "imagekit_not_configured" });
        const folder = body.folder === "collections" ? "/floral-co/collections" : "/floral-co/products";
        const name = str(body.fileName, 120).replace(/[^\w.\-]+/g, "-") || "image.jpg";
        return send(res, 200, uploadAuth({ folder, fileName: name }));
      }

      case "delete-order": {
        const id = str(body.id, 60);
        const { data: order, error } = await db().from("orders").select("id,image_file_id").eq("id", id).maybeSingle();
        if (error) throw error;
        if (!order) return send(res, 404, { error: "not_found" });
        // Delete the picture first. If ImageKit fails we keep the row so nothing is orphaned.
        if (order.image_file_id) {
          const ok = await deleteFile(order.image_file_id).catch(() => false);
          if (!ok) return send(res, 502, { error: "imagekit_failed", message: "The order picture could not be deleted from ImageKit, so the order was kept. Try again." });
        }
        const { error: delErr } = await db().from("orders").delete().eq("id", id);
        if (delErr) throw delErr;
        return send(res, 200, { ok: true });
      }

      default:
        return send(res, 400, { error: "unknown_action" });
    }
  } catch (err) {
    console.error("admin failed:", err);
    send(res, 500, { error: "server" });
  }
}
