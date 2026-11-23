// Browser helpers for the order API (/api/*) and the ImageKit upload.
const RECENT_KEY = "craft-store:orders:v1";

async function post(url, body, { timeout = 20000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON error page (for example when the /api functions are not running) */
    }
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

/** Creates the order on the server. The server re-prices everything from the database. */
export async function createOrder({ items, customer, notes }) {
  const payload = {
    customer,
    notes,
    items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, customisations: i.customisations || {} })),
  };
  const r = await post("/api/order-create", payload);
  if (!r.ok || !r.data?.orderNumber) {
    const err = new Error(r.data?.message || "We couldn't place your order right now.");
    err.status = r.status;
    err.userFacing = Boolean(r.data?.message);
    throw err;
  }
  return r.data;
}

/** Uploads the order picture straight to ImageKit with the one-time signature from the server. */
export async function uploadOrderPicture(blob, upload) {
  const form = new FormData();
  form.append("file", blob, upload.fileName);
  form.append("fileName", upload.fileName);
  form.append("publicKey", upload.publicKey);
  form.append("signature", upload.signature);
  form.append("expire", String(upload.expire));
  form.append("token", upload.token);
  form.append("folder", upload.folder);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(upload.uploadUrl, { method: "POST", body: form, signal: ctrl.signal });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const data = await res.json();
    if (!data?.url || !data?.fileId) throw new Error("Upload returned no URL");
    return { url: data.url, fileId: data.fileId };
  } finally {
    clearTimeout(timer);
  }
}

export async function attachPicture({ orderNumber, attachToken, url, fileId }) {
  const r = await post("/api/order-attach", { orderNumber, attachToken, imageUrl: url, fileId }, { timeout: 8000 });
  return r.ok;
}

/** Returns { order } or { error: "not_found" | "rate_limited" | "server" }. */
export async function trackOrder(orderNumber, phone) {
  try {
    const r = await post("/api/order-track", { orderNumber, phone }, { timeout: 15000 });
    if (r.ok) return { order: r.data };
    if (r.status === 404) return { error: "not_found" };
    if (r.status === 429) return { error: "rate_limited" };
    return { error: "server" };
  } catch {
    return { error: "server" };
  }
}

/** Link to a small page with preview tags so WhatsApp shows the picture. `endpoint` is the ImageKit URL endpoint. */
export function pictureLink(imageUrl, endpoint) {
  const base = String(endpoint || "").replace(/\/+$/, "");
  if (!imageUrl || !base || !imageUrl.startsWith(`${base}/`)) return imageUrl;
  return `${window.location.origin}/api/order-picture?p=${encodeURIComponent(imageUrl.slice(base.length + 1)).replace(/%2F/g, "/")}`;
}

export const trackUrl = (orderNumber) => `${window.location.origin}/my-order?no=${encodeURIComponent(orderNumber)}`;

// Remember order numbers (only the number, never personal details) so My Order can prefill it.
export function rememberOrder(orderNumber) {
  try {
    const list = getRecentOrders().filter((o) => o.no !== orderNumber);
    list.unshift({ no: orderNumber, at: Date.now() });
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
  } catch {
    /* storage unavailable: fine */
  }
}
export function getRecentOrders() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(list) ? list.filter((o) => o && typeof o.no === "string") : [];
  } catch {
    return [];
  }
}
