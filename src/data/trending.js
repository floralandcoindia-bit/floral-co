// SAMPLE DATA — add posts manually (no scraping). Replace media with real images/videos.
// type: "image" | "video"   (for video, set `src` to an mp4 path and `poster` to an image)
// productId: optional, links the post to a product in products.js
// instagramUrl: optional link to the original post (leave "" to hide the link)
import { makePlaceholder } from "../utils/placeholder";

const post = (id, caption, category, tone, motif, w, h, extra = {}) => ({
  id,
  type: "image",
  src: makePlaceholder({ label: "Sample post", w, h, tone, motif }),
  poster: null,
  width: w,
  height: h,
  caption,
  category,
  productId: null,
  instagramUrl: "",
  ...extra,
});

export const trendingPosts = [
  post("t-001", "Wrapping up a meadow bouquet for a birthday surprise.", "Bouquets", "forest", "leaf", 800, 1000, { productId: "p-001" }),
  post("t-002", "Little charms, big smiles. A fresh batch of keychains.", "Keychains", "gold", "rings", 800, 800, { productId: "p-004" }),
  post("t-003", "Lettering a name frame for a new baby.", "Personalised Gifts", "ivory", "lines", 800, 1100, { productId: "p-007" }),
  post("t-004", "A peek inside the latest zine.", "Magazines", "sage", "lines", 800, 1000, { productId: "p-009" }),
  post("t-005", "Pressing flowers for the next issue.", "Magazines", "forest", "leaf", 800, 900, { productId: "p-010" }),
  post("t-006", "Little wreaths in the making for the festive season.", "Other Crafts", "sage", "rings", 800, 800, { productId: "p-013" }),
  post("t-007", "Fern posies drying on the studio shelf.", "Bouquets", "gold", "leaf", 800, 1200, { productId: "p-003" }),
  post("t-008", "A quiet corner, a woven hanging.", "Other Crafts", "forest", "lines", 800, 1000, { productId: "p-012" }),
];
