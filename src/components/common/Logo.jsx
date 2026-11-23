import { Link } from "react-router-dom";
import { siteConfig } from "../../config/site";

export function LogoMark({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M16 27C8 23 8.5 12 16 7c7.5 5 8 16 0 20Z" strokeLinejoin="round" />
      <path d="M16 27V13" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ className = "", textClassName = "text-xl" }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center justify-center gap-2 text-ivory ${className}`}
      aria-label={`${siteConfig.brandName} — home`}
    >
      <LogoMark className="h-6 w-6 shrink-0 text-gold" />
      {/* small top padding optically centres the serif text against the icon */}
      <span className={`block whitespace-nowrap pt-[0.14em] font-serif font-medium leading-none tracking-tight ${textClassName}`}>
        {siteConfig.brandName}
      </span>
    </Link>
  );
}
