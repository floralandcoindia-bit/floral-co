import { db } from "../server/supabase.js";
import { send } from "../server/http.js";
import { deleteFile } from "../server/imagekit.js";

// Daily (Vercel cron) and optionally hourly (Supabase pg_net, see supabase/03_...sql):
//  1. makes sure expired orders are dismissed and erased (backup for the pg_cron job),
//  2. deletes the ImageKit pictures of erased orders,
//  3. touches the database, which also keeps a free Supabase project from pausing.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return send(res, 401, { error: "unauthorised" });
  try {
    const { data: erased, error: eErr } = await db().rpc("expire_orders");
    if (eErr) throw eErr;

    const { data: rows, error } = await db()
      .from("orders")
      .select("id,image_file_id")
      .eq("pii_erased", true)
      .not("image_file_id", "is", null)
      .limit(100);
    if (error) throw error;

    let deleted = 0;
    for (const row of rows || []) {
      const ok = await deleteFile(row.image_file_id).catch(() => false);
      if (!ok) continue;
      await db().from("orders").update({ image_file_id: null, image_url: null }).eq("id", row.id);
      deleted++;
    }
    send(res, 200, { ok: true, erased, picturesDeleted: deleted });
  } catch (err) {
    console.error("cron-cleanup failed:", err);
    send(res, 500, { error: "server" });
  }
}
