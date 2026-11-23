// SAMPLE COPY — rewrite this with your real story. I have deliberately kept it free of specific facts
// (names, years, places, timelines) so nothing untrue is published. Edit freely.
export const aboutContent = {
  intro:
    "Everything we make begins as a small idea: a flower on a walk, a name on a card, a corner of a room that needs something soft. We turn those ideas into things you can hold, give and keep.",

  // Sections alternate image/text. The first section has the id "story" (menu: Our Story).
  sections: [
    {
      id: "story",
      title: "Where it begins",
      paragraphs: [
        "It starts with noticing. The colours of a garden, the texture of handmade paper, the way a tiny detail can change how a gift feels.",
        "We collect these moments and let them shape what ends up on the workbench.",
      ],
      image: { tone: "forest", motif: "leaf", label: "Sample image · Inspiration" },
    },
    {
      id: "handmade",
      title: "Why we make by hand",
      paragraphs: [
        "Handmade things carry the pace of the person who made them. Nothing is rushed, and no two pieces are exactly alike.",
        "That small imperfection is the point. It is how you know a person was here.",
      ],
      image: { tone: "gold", motif: "lines", label: "Sample image · Handmade" },
    },
    {
      id: "personal",
      title: "Made for one person",
      paragraphs: [
        "Many of our pieces can be personalised: a name, an initial, a colour, a few words. Tell us who it's for and we'll shape it around them.",
        "A gift feels different when it was made with one person in mind.",
      ],
      image: { tone: "sage", motif: "rings", label: "Sample image · Personalised" },
    },
    {
      id: "care",
      title: "Care in every order",
      paragraphs: [
        "Each order is handled one at a time, from the first message to the last ribbon.",
        "We confirm every detail with you before we begin, so what arrives is what you imagined.",
      ],
      image: { tone: "ivory", motif: "leaf", label: "Sample image · Packing" },
    },
  ],

  process: [
    { title: "Imagine", text: "An idea, a sketch, a colour palette." },
    { title: "Gather", text: "Papers, fabrics, florals and finishing touches." },
    { title: "Make", text: "Shaped, stitched and assembled by hand." },
    { title: "Wrap", text: "Packed with care, ready to be given." },
  ],

  // Keep these consistent with how the site actually works (WhatsApp-based ordering).
  faqs: [
    {
      q: "How do I place an order?",
      a: "Add your favourites to the cart, then use the order page to create your message. Tap Send on WhatsApp and the message opens in a chat with us.",
    },
    {
      q: "Do I pay on the website?",
      a: "No. There is no online payment. We confirm availability and the final price with you on WhatsApp first, and payment is arranged afterwards.",
    },
    {
      q: "Can I customise a piece?",
      a: "Yes. Products that can be personalised show options such as a name or colour when you open them. You can also tell us more in your WhatsApp chat or in the order notes.",
    },
    {
      q: "How is shipping decided?",
      a: "Shipping is confirmed together with your final price when we reply to your order on WhatsApp.",
    },
    {
      q: "What if something I want is sold out?",
      a: "Message us on WhatsApp. We can tell you whether it will be made again or suggest something similar.",
    },
  ],
};
