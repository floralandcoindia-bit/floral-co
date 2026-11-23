import { siteConfig } from "../config/site";
import { formatPrice } from "./currency";

// Collapses control characters / stray whitespace so one field can't break the message layout.
const tidy = (v) => String(v ?? "").replace(/[\u0000-\u0009\u000B-\u001F\u007F]+/g, " ").replace(/[ \t]{2,}/g, " ").trim();

/**
 * Builds the formatted order message the customer sends on WhatsApp.
 * Everything comes from the real cart (`items` from useCart()) and the checkout form.
 */
export function buildOrderMessage({ items = [], customer = {}, notes = "", subtotal = 0, orderNumber = "", imageUrl = "", trackUrl = "" }) {
  const lines = [];
  lines.push(`Hi ${siteConfig.brandName}! I'd like to place an order.`);
  if (orderNumber) lines.push(`Order number: ${orderNumber}`);
  lines.push("");

  const name = tidy(customer.name);
  const phone = tidy(customer.phone);
  const address = tidy(String(customer.address ?? "").replace(/\s*\n+\s*/g, ", "));
  const details = [
    name && `Name: ${name}`,
    phone && `Phone: ${phone}`,
    address && `Delivery address: ${address}`,
  ].filter(Boolean);
  if (details.length) lines.push(...details, "");

  lines.push("My order:", "");
  items.forEach((item, i) => {
    const { product, quantity, unitPrice, lineTotal, customisations } = item;
    const each = quantity > 1 ? ` (${formatPrice(unitPrice)} each)` : "";
    lines.push(`${i + 1}. ${product.name} × ${quantity} — ${formatPrice(lineTotal)}${each}`);
    const entries = Object.entries(customisations || {});
    if (entries.length) {
      lines.push(`   Customisation: ${entries.map(([k, v]) => `${k}: ${v}`).join("; ")}`);
    }
  });

  lines.push("", `Subtotal: ${formatPrice(subtotal)} (shipping to be confirmed)`);

  const note = tidy(notes);
  if (note) lines.push("", `Notes: ${note}`);

  if (imageUrl) lines.push("", `Order picture: ${imageUrl}`);
  if (trackUrl) lines.push("", `Track my order: ${trackUrl}`);

  lines.push(
    "",
    "Please confirm availability, final price and shipping. I understand payment happens after confirmation."
  );
  return lines.join("\n");
}

export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
