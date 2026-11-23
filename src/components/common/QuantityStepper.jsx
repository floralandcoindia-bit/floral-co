import { Minus, Plus } from "lucide-react";
import { MAX_QUANTITY } from "../../context/CartContext";

export default function QuantityStepper({ value, onChange, label = "Quantity" }) {
  return (
    <div className="inline-flex items-center rounded-full border border-ivory/20" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-ivory/10 disabled:opacity-40"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITY}
        aria-label={`Increase ${label.toLowerCase()}`}
        className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-ivory/10 disabled:opacity-40"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
