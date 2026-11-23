import { supabase } from "./supabase";

/** Calls /api/admin with the admin's login token. */
export async function adminCall(action, payload = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You are signed out. Please sign in again.");
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* not JSON */
  }
  if (!res.ok) {
    const msg =
      body?.error === "imagekit_not_configured"
        ? "ImageKit isn't set up yet. Add the IMAGEKIT_* variables in Vercel (see SETUP.md)."
        : body?.message || (res.status === 401 ? "Not allowed. Is this account in the admins table?" : `Request failed (${res.status})`);
    throw new Error(msg);
  }
  return body;
}

/** Shrinks big phone photos before upload (max 1600px, JPEG) so uploads are quick and storage stays small. */
async function shrink(file, maxDim = 1600) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    return blob || file;
  } catch {
    return file;
  }
}

/** Uploads one image to ImageKit using a signature from our server. Returns the public URL. */
export async function uploadImage(file, folder = "products") {
  if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is too large (max 25 MB).`);
  const blob = await shrink(file);
  const baseName = (file.name || "image").replace(/\.[^.]+$/, "");
  const auth = await adminCall("imagekit-auth", { folder, fileName: `${baseName}.${blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() || "jpg")}` });
  const form = new FormData();
  form.append("file", blob, auth.fileName);
  form.append("fileName", auth.fileName);
  form.append("publicKey", auth.publicKey);
  form.append("signature", auth.signature);
  form.append("expire", String(auth.expire));
  form.append("token", auth.token);
  form.append("folder", auth.folder);
  const res = await fetch(auth.uploadUrl, { method: "POST", body: form });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).message || "";
    } catch {
      /* not JSON */
    }
    throw new Error(`Upload failed (${res.status}). ${detail || "Check your ImageKit keys."}`);
  }
  const data = await res.json();
  if (!data?.url) throw new Error("Upload failed: no URL returned.");
  return data.url;
}
