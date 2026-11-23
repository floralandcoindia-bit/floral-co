import { siteConfig } from "../config/site";
import { formatPrice } from "./currency";

/*
 * Order summary PNG, drawn with the Canvas API from the real order data.
 * Canvas draws text as pixels (never as HTML), so customer-provided text can't inject markup;
 * it is also stripped of control characters and fully wrapped (nothing is cut off with "…").
 * No third-party library or network request is needed (only the product thumbnails are loaded).
 */

const W = 1080; // logical width in px; the bitmap is rendered at up to 2x for sharpness
const PAD = 64;
const INK = "#101A16";
const EVERGREEN = "#1B2B23";
const BOTANICAL = "#496B52";
const SAGE = "#82977A";
const MIST = "#B5BDAF";
const GOLD = "#B5A477";
const IVORY = "#F3EDE0";
const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif';
const SANS = '"Hanken Grotesk", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const IMAGE_TIMEOUT_MS = 2500; // a slow thumbnail must never stall checkout

const clean = (v) =>
  String(v ?? "")
    .replace(/[\u0000-\u001F\u007F\u2028\u2029]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

/** Changes whenever anything shown on the picture changes (used to know if a prepared picture is still current). */
export function orderSignature({ items = [], customer = {}, notes = "", subtotal = 0, orderNumber = "" }) {
  return JSON.stringify([
    items.map((i) => [i.lineId, i.quantity, i.unitPrice, i.product?.name, i.customisations]),
    customer.name,
    customer.phone,
    customer.address,
    notes,
    subtotal,
    orderNumber,
  ]);
}

let fontsReady;
function ensureFonts() {
  if (!fontsReady) {
    fontsReady = (async () => {
      try {
        if (!document.fonts?.load) return;
        const loads = [
          `500 40px "Cormorant Garamond"`,
          `italic 400 30px "Cormorant Garamond"`,
          `400 28px "Hanken Grotesk"`,
          `600 28px "Hanken Grotesk"`,
        ].map((f) => document.fonts.load(f));
        await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 1500))]);
      } catch {
        /* fall back to the system fonts in the stacks above */
      }
    })();
  }
  return fontsReady;
}

const loadImage = (src) =>
  new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    const timer = setTimeout(() => resolve(null), IMAGE_TIMEOUT_MS);
    img.crossOrigin = "anonymous";
    img.onload = () => {
      clearTimeout(timer);
      resolve(img.width && img.height ? img : null);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws an image into a rounded box using "cover" cropping (or a plain tile if there is no image). */
function drawCover(ctx, img, x, y, w, h, r) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  if (img) {
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = EVERGREEN;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  ctx.save();
  roundRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
  ctx.strokeStyle = "rgba(243,237,224,0.16)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

/** Wraps text to maxWidth using the context's current font. Breaks very long unbroken words too. */
function wrapText(ctx, text, maxWidth) {
  const out = [];
  let line = "";
  for (const word of clean(text).split(" ")) {
    if (!word) continue;
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) out.push(line);
    line = "";
    if (ctx.measureText(word).width <= maxWidth) {
      line = word;
      continue;
    }
    for (const ch of Array.from(word)) {
      const t = line + ch;
      if (line && ctx.measureText(t).width > maxWidth) {
        out.push(line);
        line = ch;
      } else line = t;
    }
  }
  if (line) out.push(line);
  return out.length ? out : [""];
}

function drawSprig(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = "rgba(130,151,122,0.5)";
  ctx.fillStyle = "rgba(73,107,82,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-22, -90, 30, -190);
  ctx.stroke();
  [
    [-8, -38, -0.9],
    [2, -68, 0.75],
    [-4, -104, -0.8],
    [16, -134, 0.7],
    [26, -166, -0.65],
  ].forEach(([lx, ly, a]) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(20, 0, 24, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

/**
 * One layout routine used twice: first with draw=false to measure the height, then with draw=true.
 * Returns the y position where the content ends.
 */
function paint(ctx, d, draw) {
  const T = (str, x, y, font, color, align = "left") => {
    if (!draw) return;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(str, x, y);
  };
  const wrap = (str, font, maxW) => {
    ctx.font = font;
    return wrapText(ctx, str, maxW);
  };
  const rule = (y, color = "rgba(243,237,224,0.14)", width = 2) => {
    if (!draw) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
  };

  // ---- Header / branding
  let y = 104;
  T(`${d.orderNumber ? `ORDER ${d.orderNumber}` : "ORDER SUMMARY"}  ·  ${d.date}`, PAD, y, `600 22px ${SANS}`, GOLD);
  y += 88;
  T(siteConfig.brandName, PAD, y, `500 84px ${SERIF}`, IVORY);
  y += 48;
  T(siteConfig.tagline, PAD, y, `italic 400 30px ${SERIF}`, SAGE);
  y += 46;
  rule(y, "rgba(181,164,119,0.55)", 2);
  y += 58;

  // ---- Customer details
  const labelW = 200;
  const valueW = W - PAD * 2 - labelW;
  [
    ["NAME", d.name],
    ["PHONE", d.phone],
    ["DELIVER TO", d.address],
  ].forEach(([label, value]) => {
    if (!value) return;
    const ls = wrap(value, `400 30px ${SANS}`, valueW);
    T(label, PAD, y, `600 20px ${SANS}`, SAGE);
    ls.forEach((l, i) => T(l, PAD + labelW, y + i * 42, `400 30px ${SANS}`, IVORY));
    y += (ls.length - 1) * 42 + 56;
  });
  y -= 8;
  rule(y);
  y += 62;

  // ---- Items
  T("YOUR ORDER", PAD, y, `600 20px ${SANS}`, SAGE);
  y += 36;

  const THUMB_W = 150;
  const THUMB_H = 188;
  const textX = PAD + THUMB_W + 34;
  const PRICE_W = 200;
  const textW = W - PAD - textX - PRICE_W - 12;

  d.items.forEach((item, i) => {
    const top = y;
    const nameLines = wrap(item.name, `500 38px ${SERIF}`, textW);
    const metaBase = top + 32 + (nameLines.length - 1) * 44 + 46;
    const custLines = item.custom.flatMap((c) => wrap(c, `400 25px ${SANS}`, textW));
    const lastBase = custLines.length ? metaBase + 18 + custLines.length * 34 - 4 : metaBase;
    const bottom = Math.max(top + THUMB_H, lastBase + 12);

    if (draw) {
      drawCover(ctx, d.images[i], PAD, top, THUMB_W, THUMB_H, 14);
      nameLines.forEach((l, n) => T(l, textX, top + 32 + n * 44, `500 38px ${SERIF}`, IVORY));
      T(`Qty ${item.quantity} × ${item.unit}`, textX, metaBase, `400 26px ${SANS}`, MIST);
      custLines.forEach((l, n) => T(l, textX, metaBase + 18 + 30 + n * 34 - 4, `400 25px ${SANS}`, SAGE));
      T(item.total, W - PAD, top + 32, `600 34px ${SANS}`, IVORY, "right");
    }
    y = bottom + 24;
    if (i < d.items.length - 1) {
      rule(y, "rgba(243,237,224,0.08)", 1.5);
      y += 28;
    }
  });

  // ---- Totals
  y += 6;
  rule(y, "rgba(181,164,119,0.55)", 2);
  y += 66;
  T("Subtotal", PAD, y, `400 30px ${SANS}`, MIST);
  T(d.subtotal, W - PAD, y + 6, `500 58px ${SERIF}`, GOLD, "right");
  y += 62;
  T("Shipping", PAD, y, `400 30px ${SANS}`, MIST);
  T("To be confirmed", W - PAD, y, `600 30px ${SANS}`, IVORY, "right");
  y += 24;

  // ---- Notes
  if (d.notes) {
    y += 28;
    rule(y);
    y += 56;
    T("NOTES", PAD, y, `600 20px ${SANS}`, SAGE);
    const ls = wrap(d.notes, `400 28px ${SANS}`, W - PAD * 2);
    ls.forEach((l, n) => T(l, PAD, y + 44 + n * 40, `400 28px ${SANS}`, IVORY));
    y += 44 + (ls.length - 1) * 40;
  }

  // ---- Footer
  y += 44;
  rule(y);
  y += 54;
  const foot = wrap(
    `Not confirmed until ${siteConfig.brandName} approves it. Payment happens after confirmation.${d.orderNumber ? " Track it any time on My Order." : ""}`,
    `400 22px ${SANS}`,
    W - PAD * 2
  );
  foot.forEach((l, n) => T(l, W / 2, y + n * 32, `400 22px ${SANS}`, "rgba(181,189,175,0.7)", "center"));
  y += (foot.length - 1) * 32;
  return y + 64;
}

function renderBlob(d) {
  const measure = document.createElement("canvas").getContext("2d");
  measure.textBaseline = "alphabetic";
  const H = Math.ceil(paint(measure, d, false));

  // Sharp output, but keep the bitmap inside what phones can safely allocate for very long orders
  const scale = Math.max(1, Math.min(2, Math.sqrt(40e6 / (W * H)), 15000 / H));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";

  // background
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "rgba(73,107,82,0.32)");
  g.addColorStop(0.55, "rgba(27,43,35,0.15)");
  g.addColorStop(1, "rgba(16,26,22,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  drawSprig(ctx, W - 120, 236, 1);
  ctx.strokeStyle = "rgba(181,164,119,0.28)";
  ctx.lineWidth = 2;
  roundRectPath(ctx, 20, 20, W - 40, H - 40, 18);
  ctx.stroke();

  paint(ctx, d, true);

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png");
    } catch (err) {
      reject(err); // e.g. a tainted canvas
    }
  });
}

/** Renders the order as a PNG (returns a Blob). Throws if the order is empty. */
export async function buildOrderImage({ items = [], customer = {}, notes = "", subtotal = 0, orderNumber = "" }) {
  if (!items.length) throw new Error("The cart is empty");
  await ensureFonts();
  const images = await Promise.all(items.map((i) => loadImage(i.product?.images?.[0])));

  const data = {
    orderNumber: clean(orderNumber),
    date: new Date().toLocaleDateString(siteConfig.currency.locale, { day: "numeric", month: "short", year: "numeric" }),
    name: clean(customer.name),
    phone: clean(customer.phone),
    address: clean(customer.address),
    notes: clean(notes),
    subtotal: formatPrice(subtotal),
    items: items.map((i) => ({
      name: clean(i.product?.name),
      quantity: i.quantity,
      unit: formatPrice(i.unitPrice),
      total: formatPrice(i.lineTotal),
      custom: Object.entries(i.customisations || {}).map(([k, v]) => `${clean(k)}: ${clean(v)}`),
    })),
    images,
  };

  try {
    return await renderBlob(data);
  } catch {
    // If an image made the canvas unreadable, still deliver the receipt without thumbnails
    return renderBlob({ ...data, images: data.images.map(() => null) });
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
