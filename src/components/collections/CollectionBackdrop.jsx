/** Decorative themed background. Each collection's `theme.pattern` picks one. Decorative only (aria-hidden). */
export default function CollectionBackdrop({ pattern, accent, slug }) {
  const pid = `pat-${slug}`;
  const fid = `noise-${slug}`;
  const common = { fill: "none", stroke: accent, strokeWidth: 1, strokeOpacity: 0.4 };

  const defs = {
    botanical: (
      <pattern id={pid} width="120" height="120" patternUnits="userSpaceOnUse">
        <path d="M20 90 C 5 60, 15 30, 45 15 C 60 45, 50 75, 20 90 Z" {...common} />
        <path d="M20 90 L40 30" {...common} />
        <path d="M85 112 C 70 87, 78 62, 100 50 C 112 72, 106 97, 85 112 Z" {...common} />
        <path d="M85 112 L99 62" {...common} />
      </pattern>
    ),
    dots: (
      <pattern id={pid} width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="6" cy="6" r="1.6" fill={accent} fillOpacity="0.45" />
        <circle cx="20" cy="20" r="1.1" fill={accent} fillOpacity="0.3" />
      </pattern>
    ),
    weave: (
      <pattern id={pid} width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M0 6 H24 M0 18 H24" {...common} strokeOpacity="0.32" />
        <path d="M6 0 V24 M18 0 V24" {...common} strokeOpacity="0.2" />
      </pattern>
    ),
    stars: (
      <pattern id={pid} width="90" height="90" patternUnits="userSpaceOnUse">
        <path d="M20 8 L22.5 17.5 L32 20 L22.5 22.5 L20 32 L17.5 22.5 L8 20 L17.5 17.5 Z" fill={accent} fillOpacity="0.4" />
        <path d="M66 58 L67.6 63.4 L73 65 L67.6 66.6 L66 72 L64.4 66.6 L59 65 L64.4 63.4 Z" fill={accent} fillOpacity="0.28" />
      </pattern>
    ),
    "paper-texture": (
      <pattern id={pid} width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 4 H8" {...common} strokeOpacity="0.16" />
      </pattern>
    ),
    "handmade-paper": null,
  };

  const grainy = pattern === "handmade-paper" || pattern === "paper-texture";

  return (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" width="100%" height="100%">
      <defs>
        {defs[pattern]}
        {grainy && (
          <filter id={fid} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.93  0 0 0 0 0.86  0 0 0 1.4 -0.55" />
          </filter>
        )}
      </defs>
      {defs[pattern] && <rect width="100%" height="100%" fill={`url(#${pid})`} />}
      {grainy && <rect width="100%" height="100%" filter={`url(#${fid})`} opacity={pattern === "handmade-paper" ? 0.5 : 0.28} />}
      {pattern === "handmade-paper" && (
        <rect x="1.5%" y="3%" width="97%" height="94%" fill="none" stroke={accent} strokeOpacity="0.45" strokeDasharray="2 7" strokeLinecap="round" />
      )}
    </svg>
  );
}
