import { useEffect } from "react";
import { useScrollLock } from "./useScrollLock";

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,video[controls],[tabindex]:not([tabindex="-1"])';

/** Shared modal behaviour: scroll lock, Escape to close, focus trap, focus restore. */
export function useDialog({ onClose, panelRef, initialFocusRef }) {
  useScrollLock(true);
  useEffect(() => {
    const previous = document.activeElement;
    initialFocusRef?.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous && previous.focus) previous.focus();
    };
  }, [onClose, panelRef, initialFocusRef]);
}
