import { useEffect } from "react";

/**
 * Adds mouse click-and-drag scrolling to a horizontally scrollable element.
 * Touch swipe and trackpad scrolling stay native. Vertical page scroll is never blocked.
 */
export function useDragScroll(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let isDown = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    const onDown = (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    };
    const onMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        el.classList.add("is-dragging");
      }
      if (moved) el.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      if (!isDown) return;
      isDown = false;
      el.classList.remove("is-dragging");
    };
    // After a drag, swallow the click so cards underneath do not open.
    const onClickCapture = (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    const onDragStart = (e) => e.preventDefault();

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("dragstart", onDragStart);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, [ref]);
}
