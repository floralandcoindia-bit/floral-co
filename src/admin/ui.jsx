import { useEffect } from "react";
import { X } from "lucide-react";

export const label = "mb-1.5 block text-sm text-ivory";
export const card = "rounded-sm border border-ivory/15 bg-evergreen/60";

export function Field({ id, label: text, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className={label}>{text}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-ivory">
      <span className="relative inline-flex">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-ivory/20 transition-colors peer-checked:bg-botanical peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-ivory transition-transform peer-checked:translate-x-5" />
      </span>
      {children}
    </label>
  );
}

/** Full-height side sheet used for the product and collection forms. */
export function Sheet({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-ivory/15 bg-forest">
        <div className="flex items-center justify-between border-b border-ivory/15 px-5 py-4">
          <h2 className="text-3xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-mist hover:bg-ivory/10 hover:text-ivory">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ivory/15 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-ivory/25 text-mist",
    gold: "border-gold/60 text-gold",
    green: "border-sage/60 text-sage",
    red: "border-red-400/60 text-red-300",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
}

export const errMsg = (e) => (e?.message ? e.message : "Something went wrong.");
