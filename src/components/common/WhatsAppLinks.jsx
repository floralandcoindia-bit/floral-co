import { useEffect } from "react";
import { isMobileDevice, openWhatsApp } from "../../utils/whatsapp";

/**
 * On phones, every wa.me link on the site (menu, footer, buttons…) opens the WhatsApp app directly
 * instead of stopping on the WhatsApp web page first. Computers keep the normal link.
 */
export default function WhatsAppLinks() {
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest('a[href^="https://wa.me/"]') : null;
      if (!a || !isMobileDevice()) return;
      e.preventDefault();
      let text = "";
      try {
        text = new URL(a.href).searchParams.get("text") || "";
      } catch {
        /* no message */
      }
      openWhatsApp(text);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
