// Generates clearly-labelled SVG placeholder images (as data URIs).
// Replace these with real files in /public/assets/... when you have photos.
const PALETTES = {
  forest: ["#1B2B23", "#496B52"],
  sage: ["#223329", "#82977A"],
  gold: ["#2A281D", "#B5A477"],
  ivory: ["#33443A", "#F3EDE0"],
  night: ["#101A16", "#496B52"],
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function makePlaceholder({
  label = "Sample image",
  w = 800,
  h = 1000,
  tone = "forest",
  motif = "leaf",
  variant = 0,
} = {}) {
  const [a, b] = PALETTES[tone] || PALETTES.forest;
  const cx = w / 2;
  const cy = h * 0.46;
  const s = Math.min(w, h);
  const stroke = `fill="none" stroke="#F3EDE0" stroke-opacity="0.38" stroke-width="${Math.max(1.5, s / 400)}"`;
  const rot = variant * 14 - 14;

  const motifs = {
    leaf: `<path d="M${cx} ${cy + s * 0.3} C ${cx - s * 0.32} ${cy + s * 0.12}, ${cx - s * 0.28} ${cy - s * 0.2}, ${cx} ${cy - s * 0.3} C ${cx + s * 0.28} ${cy - s * 0.2}, ${cx + s * 0.32} ${cy + s * 0.12}, ${cx} ${cy + s * 0.3} Z" ${stroke}/><path d="M${cx} ${cy + s * 0.3} L${cx} ${cy - s * 0.18}" ${stroke}/>`,
    rings: [0.12, 0.2, 0.28, 0.36]
      .map((r) => `<circle cx="${cx}" cy="${cy}" r="${s * r}" ${stroke}/>`)
      .join(""),
    lines: Array.from({ length: 7 })
      .map((_, i) => `<path d="M${w * 0.18} ${cy - s * 0.24 + i * s * 0.08} H${w * 0.82}" ${stroke}/>`)
      .join(""),
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}" stop-opacity="0.55"/></linearGradient></defs><rect width="${w}" height="${h}" fill="${a}"/><rect width="${w}" height="${h}" fill="url(#g)"/><g transform="rotate(${rot} ${cx} ${cy})">${motifs[motif] || motifs.leaf}</g><text x="${w / 2}" y="${h - s * 0.07}" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.max(14, s / 32)}" fill="#F3EDE0" fill-opacity="0.55">${esc(label)}</text></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
