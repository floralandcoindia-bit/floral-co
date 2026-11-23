import { createHmac, randomUUID } from "node:crypto";

export const imagekitConfigured = () =>
  Boolean(process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_URL_ENDPOINT);

export const urlEndpoint = () => String(process.env.IMAGEKIT_URL_ENDPOINT || "").replace(/\/+$/, "");

/** One-time signed upload parameters. The private key never leaves the server; the browser only gets the signature. */
export function uploadAuth({ folder, fileName }) {
  const token = randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 30 * 60; // ImageKit requires < 1 hour
  const signature = createHmac("sha1", process.env.IMAGEKIT_PRIVATE_KEY).update(token + expire).digest("hex");
  return {
    uploadUrl: "https://upload.imagekit.io/api/v1/files/upload",
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: urlEndpoint(),
    token,
    expire,
    signature,
    folder,
    fileName,
  };
}

/** Deletes a file from ImageKit. A file that is already gone counts as success. */
export async function deleteFile(fileId) {
  if (!fileId || !process.env.IMAGEKIT_PRIVATE_KEY) return false;
  const res = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { Authorization: `Basic ${Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString("base64")}` },
  });
  return res.ok || res.status === 404;
}
