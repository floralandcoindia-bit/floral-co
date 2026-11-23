import { siteConfig } from "../config/site";

const formatter = new Intl.NumberFormat(siteConfig.currency.locale, {
  style: "currency",
  currency: siteConfig.currency.code,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(amount) {
  return formatter.format(Number(amount) || 0);
}
