import { urlEndpoint } from "../server/imagekit.js";

// A tiny public page whose only job is to carry Open Graph tags, so WhatsApp shows the order picture as a link preview.
// WhatsApp builds previews from og:image on an HTML page; it generally ignores a bare .png link.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export default function handler(req, res) {
  const endpoint = urlEndpoint();
  const path = String(req.query?.p || "");
  // Only allow files inside our own ImageKit account (no open redirects / arbitrary images).
  if (!endpoint || !/^[\w\-./]{1,200}$/.test(path) || path.includes("..")) {
    res.setHeader("Content-Type", "text/plain");
    res.status(400).send("Bad link");
    return;
  }
  const full = `${endpoint}/${path.replace(/^\/+/, "")}`;
  const preview = `${full}?tr=w-800,q-75`; // small file so WhatsApp's crawler always loads it
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
  const self = `https://${host}${req.url}`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.setHeader("X-Robots-Tag", "noindex");
  res.status(200).send(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Floral &amp; Co order picture</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Floral &amp; Co">
<meta property="og:title" content="Floral &amp; Co order picture">
<meta property="og:description" content="Tap to view the order details.">
<meta property="og:url" content="${esc(self)}">
<meta property="og:image" content="${esc(preview)}">
<meta property="og:image:secure_url" content="${esc(preview)}">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(preview)}">
<style>body{margin:0;background:#101a16;display:flex;justify-content:center;padding:16px}img{max-width:100%;height:auto;border-radius:4px}</style>
</head><body><img src="${esc(full)}" alt="Order picture"></body></html>`);
}
