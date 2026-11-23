import { siteConfig } from "../config/site";
import { formatPrice } from "./currency";

/**
 * Builds the formatted order message the customer sends on WhatsApp.
 * `items` are the enriched cart items from useCart().
 */
export function buildOrderMessage({ items, customer = {}, notes = "", subtotal }) {
  const lines = [];
  lines.push(`Hi ${siteConfig.brandName}! I'd like to place an order.`);
  lines.push("");

  const details = [
    customer.name && `Name: ${customer.name}`,
    customer.phone && `Phone: ${customer.phone}`,
    customer.address && `Delivery address: ${customer.address}`,
  ].filter(Boolean);
  if (details.length) {
    lines.push(...details, "");
  }

  lines.push("My order:");
  items.forEach((item, i) => {
    const { product, quantity, unitPrice, lineTotal, customisations } = item;
    lines.push(
      `${i + 1}. ${product.name} × ${quantity} — ${formatPrice(unitPrice)} each = ${formatPrice(lineTotal)}`
    );
    const entries = Object.entries(customisations || {});
    if (entries.length) {
      lines.push(`• ${entries.map(([k, v]) => `${k}: ${v}`).join("; ")}`);
    }
  });

  lines.push("", `Subtotal: ${formatPrice(subtotal)} (shipping to be confirmed)`);

  if (notes && notes.trim()) {
    lines.push("", `Notes: ${notes.trim()}`);
  }

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
