// SAMPLE DATA — edit freely. A product belongs to a collection via product.collection (the slug).
// `theme` drives the unique header/background for each collection on the Collections page (Stage 4).
export const collections = [
  {
    id: "c-001",
    slug: "bouquet-collection",
    title: "The Bouquet Collection",
    description: "Flowers that last. Hand-made blooms in soft, botanical palettes.",
    theme: { pattern: "botanical", from: "#1B2B23", to: "#496B52", accent: "#82977A" },
  },
  {
    id: "c-002",
    slug: "little-things-big-smiles",
    title: "Little Things, Big Smiles",
    description: "Small handmade pieces that make an ordinary day feel a little brighter.",
    theme: { pattern: "dots", from: "#223329", to: "#82977A", accent: "#F3EDE0" },
  },
  {
    id: "c-003",
    slug: "personalised-keepsakes",
    title: "Personalised Keepsakes",
    description: "Made with a name, a date or a word that matters to someone.",
    theme: { pattern: "handmade-paper", from: "#2A281D", to: "#B5A477", accent: "#F3EDE0" },
  },
  {
    id: "c-004",
    slug: "magazine-collection",
    title: "The Magazine Collection",
    description: "Hand-stitched issues of pressed botanicals, notes and illustrations.",
    theme: { pattern: "paper-texture", from: "#101A16", to: "#B5BDAF", accent: "#F3EDE0" },
  },
  {
    id: "c-005",
    slug: "handmade-favourites",
    title: "Handmade Favourites",
    description: "The pieces people come back for, again and again.",
    theme: { pattern: "weave", from: "#1B2B23", to: "#82977A", accent: "#B5A477" },
  },
  {
    id: "c-006",
    slug: "seasonal-creations",
    title: "Seasonal Creations",
    description: "Small-batch pieces made for the festivals and seasons of the year.",
    theme: { pattern: "stars", from: "#101A16", to: "#496B52", accent: "#B5A477" },
  },
];

export const getCollectionBySlug = (slug) => collections.find((c) => c.slug === slug);
