import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { scrollToElement } from "../../utils/scroll";

/** Scrolls to #anchors after navigation (waits for the page transition when the route changed). */
export default function ScrollToHash() {
  const { pathname, hash, key } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const pathChanged = previousPath.current !== pathname;
    previousPath.current = pathname;
    if (!hash) return undefined;

    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    let timer;
    const attempt = () => {
      const el = document.getElementById(id);
      if (el) {
        scrollToElement(el);
        return;
      }
      tries += 1;
      if (tries < 20) timer = setTimeout(attempt, 100);
    };
    timer = setTimeout(attempt, pathChanged ? 250 : 0);
    return () => clearTimeout(timer);
  }, [pathname, hash, key]);

  return null;
}
