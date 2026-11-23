import { siteConfig } from "../config/site";

/** True on phones and tablets, where the WhatsApp app can be opened directly. */
export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1); // iPadOS
}

const appUrl = (text) =>
  `whatsapp://send?phone=${siteConfig.whatsappNumber}${text ? `&text=${encodeURIComponent(text)}` : ""}`;

/**
 * Opens a chat with the studio with `text` already typed in.
 *  - Phones: jumps straight into the WhatsApp app (no wa.me page, no extra "Continue to chat" tap).
 *    If the app isn't installed, it falls back to the normal wa.me page after a moment.
 *  - Computers: opens WhatsApp Web / the desktop app via wa.me in a new tab.
 * Returns false only if a computer browser blocked the new tab.
 */
export function openWhatsApp(text = "") {
  const web = siteConfig.whatsappLink(text);

  if (!isMobileDevice()) {
    const w = window.open(web, "_blank");
    if (!w) return false;
    try {
      w.opener = null;
    } catch {
      /* cross-origin: fine */
    }
    return true;
  }

  let left = false;
  const mark = () => {
    left = true;
  };
  const stop = () => {
    document.removeEventListener("visibilitychange", mark);
    window.removeEventListener("pagehide", mark);
    window.removeEventListener("blur", mark);
  };
  document.addEventListener("visibilitychange", mark);
  window.addEventListener("pagehide", mark);
  window.addEventListener("blur", mark);

  window.location.href = appUrl(text);

  setTimeout(() => {
    stop();
    // Still here and nothing opened: WhatsApp isn't installed, so use the web link instead.
    if (!left && !document.hidden) window.location.href = web;
  }, 2200);
  return true;
}
