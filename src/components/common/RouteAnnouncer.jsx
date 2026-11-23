import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/** Tells screen readers when the page changes (client-side routing is otherwise silent). */
export default function RouteAnnouncer() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    const t = setTimeout(() => setMessage(`${document.title}. Page loaded.`), 450);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
