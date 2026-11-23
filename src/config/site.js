// Central brand configuration. Edit these values to rebrand the site.
const WHATSAPP_NUMBER = "916289947905"; // country code + number, digits only (India +91)
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const siteConfig = {
  brandName: "Floral & Co",
  tagline: "Little Things. Beautifully Made.",
  description:
    "Thoughtfully handcrafted creations, made to turn everyday moments into something special.",

  whatsappNumber: WHATSAPP_NUMBER,
  whatsappDisplay: "+91 62899 47905",
  whatsappUrl: WHATSAPP_URL,
  // Opens a WhatsApp chat with the studio and the message already typed in
  whatsappLink: (text = "") => `${WHATSAPP_URL}${text ? `?text=${encodeURIComponent(text)}` : ""}`,
  email: "hello@example.com", // TODO: replace
  phone: "", // optional; leave empty to hide

  currency: { code: "INR", symbol: "₹", locale: "en-IN" },

  shippingText:
    "Shipping is confirmed along with your final price when we reply to your order on WhatsApp.",
  orderNote:
    "We confirm availability and final pricing on WhatsApp. Payment is arranged afterwards. Nothing is charged or confirmed until then.",

  // Lenis smooth scrolling. Set to false to use native scrolling only.
  smoothScroll: true,

  // Floating bottom tab bar
  navLinks: [
    { label: "Home", to: "/", icon: "home" },
    { label: "Shop", to: "/shop", icon: "shop" },
    { label: "Trending", to: "/trending", icon: "trending" },
    { label: "Collections", to: "/collections", icon: "collections" },
    { label: "Track My Order", to: "/my-order", icon: "orders" },
    { label: "My Cart", to: "/cart", icon: "cart", isCart: true },
  ],

  // Full-screen menu overlay
  menuLinks: [
    { label: "Track My Order", to: "/my-order" },
    { label: "About Us", to: "/about" },
    { label: "How It Works", to: "/#how-it-works" },
    { label: "Contact Us", to: "/#contact" }, // footer lives on the home page
    { label: "WhatsApp", href: WHATSAPP_URL, external: true },
    { label: "FAQs", to: "/#faqs" },
  ],
};
