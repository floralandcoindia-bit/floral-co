# Floral & Co — handmade crafts storefront

A dark, botanical, editorial storefront for a handmade crafts brand.
React 19, Vite, Tailwind CSS 3, Motion, React Router, Lenis, Lucide, React Hot Toast, React Helmet Async.
Orders are placed through WhatsApp: there is no payment gateway, and an order is never shown as paid or confirmed.

> **New: database, admin panel and order tracking.** Products, collections and orders now live in Supabase, photos in
> ImageKit, and `/admin` manages them. **Start with [SETUP.md](./SETUP.md).** Without any setup the site still runs on the
> sample data in `src/data`.
>
> Layout: `src/admin` (admin panel) · `api` and `server` (Vercel functions) · `supabase` (SQL) · `src/lib` (browser helpers) ·
> `src/pages/MyOrder.jsx` (customer tracking).

## Run

Requires Node 20 or newer.

```bash
npm install
npm run dev        # development server
npm run build      # production build into /dist
npm run preview    # serve the production build locally
```

## First run checklist

1. `npm install` completes without peer-dependency errors (React 19 is used throughout).
2. `npm run dev` opens with no red error overlay and no console errors.
3. Home loads, the bottom tab bar floats, and the menu button (top right) opens the full-screen menu.
4. Open a product, choose customisation options, add it to the cart. The cart badge updates and survives a reload.
5. Cart: change quantities, fill in the checkout details, then try **Place Order via WhatsApp** (on a phone over https: the share sheet opens with the order picture and message; elsewhere: the picture is saved and WhatsApp opens with the message).
6. Turn on "Reduce motion" in your OS settings and reload: motion should calm down (see Accessibility).
7. `npm run build` succeeds.

If something fails, send me the exact error text and file name.

## What to edit

| What | Where |
|---|---|
| Brand name, tagline, Instagram URL and handle, email, phone, shipping and order notes, menu links, smooth scroll on/off | `src/config/site.js` |
| Products and collections | the **/admin** panel (`src/data/*.js` is only the offline sample/seed data) |
| Trending page | Admin → Products → switch on "Trending" for a product |
| Customer reviews (empty until you add real ones) | `src/data/testimonials.js` |
| About page copy and FAQs (**sample copy**) | `src/data/about.js` |
| Colours and fonts | `src/styles/variables.css` and `tailwind.config.js` |
| Logo | `src/components/common/Logo.jsx` and `public/assets/branding/favicon.svg` |

### Product fields
`id, slug, name, description, price, category, collection, images[], featured, trending, isAvailable, createdAt, customisationOptions[]`
plus optional `keywords[]` for search. `category` must match an id in `categories`; `collection` must match a collection `slug`.
`featured: true` puts a product in Best Sellers. `trending` is available for your own use.

Customisation options are `{ id, label, type: "select" | "text", required, choices?, placeholder?, maxLength? }`.

## Assets you still need to supply

Everything below currently uses a generated, clearly labelled placeholder or is missing. Nothing breaks without them.

| Asset | Where | Notes |
|---|---|---|
| Hero video | `public/assets/videos/hero.mp4` | Muted loop, 1920x1080, H.264, ideally under 6 MB. Without it the hero shows a dark botanical fallback. |
| Hero poster image | `public/assets/images/hero-poster.jpg` | Shown while the video loads. |
| Product photos | `public/assets/products/` | About 3 per product, portrait 4:5 (for example 1200x1500). Reference them in `products.js`. |
| About page images | `public/assets/images/` | The About page currently generates labelled placeholders from `about.js`. Swap the `<LazyImage src=...>` in `src/pages/About.jsx` for real photos. |
| Real About story and FAQs | `src/data/about.js` | Current text is sample copy with no real facts. |
| Real customer reviews | `src/data/testimonials.js` | Shape: `{ id, name, location, quote, productId? }`. The site never invents reviews. |
| Instagram URL, handle, email, phone | `src/config/site.js` | The current values are placeholders. A console warning appears in dev until you replace the Instagram URL. |
| Logo and favicon | `public/assets/branding/` | The current logo is a text wordmark plus a small leaf mark. |
| Social share image (optional) | `index.html` | Add an `og:image` meta tag if you want link previews. |
| Real prices, availability, policies | `products.js`, `site.js`, `about.js` | Shipping and returns wording is deliberately minimal. Add your real policies. |

## Deploying

This is a single-page app, so the host must serve `index.html` for every path.
`public/_redirects` (Netlify, Cloudflare Pages) and `vercel.json` (Vercel) are included for that.

## How ordering works

Cart → checkout form (name, phone, delivery address required; notes optional) → **Place Order via WhatsApp**.
The site draws an order summary PNG from the real cart and saves it to the customer's device, then opens the studio's
WhatsApp chat directly (`wa.me`) with the formatted order message typed in. WhatsApp links cannot attach files, so the
customer attaches the saved picture with the paperclip before sending (on desktop the picture is also copied for Ctrl+V).
No backend or paid service is used. Shipping and final price are confirmed in the chat.
Message format: `src/utils/whatsappOrder.js`. Picture: `src/utils/orderImage.js`. Flow: `src/components/cart/OrderForm.jsx`.

## Accessibility and motion

- Semantic landmarks, a skip link, a page-change announcer for screen readers, and visible gold focus outlines.
- Dialogs (quick view, trending post, menu) support Escape, trap focus, lock scrolling and restore focus.
  The page behind the menu is marked `inert` while it is open.
- Buttons and controls have text or `aria-label`s; gallery scrollers are keyboard-focusable.
- Reduced motion: Motion's `MotionConfig reducedMotion="user"` disables transform and layout animations; Lenis smooth
  scrolling is switched off; the hero video does not autoplay; scroll-word reveal, scroll-drawn lines and SVG line
  drawing are shown in their finished state. Opacity fades remain.
- Animations use transform and opacity (the SVG line drawing and the FAQ panel use `pathLength` and `grid-template-rows`).
- Images are lazy-loaded inside fixed-ratio boxes to avoid layout shift.

## Known limitations

- Untested in a real browser by the author. Visual details (spacing, pattern intensity, animation timing) will want tuning.
- There are no individual product pages; products open in a quick-view dialog.
- Cart customisations are stored as the labels and values chosen at the time; if you rename an option label later,
  old carts keep the old label.
- Cart contents only include products that still exist and are available in `products.js`.
- The Instagram order flow relies on the customer pasting the message; there is no automation.

## Folder structure

```
public/assets/{videos,images,products,branding}   public/_redirects   vercel.json
src/
  components/{common,home,shop,trending,collections,cart}
  pages/  context/  hooks/  data/  config/site.js  utils/  styles/
  App.jsx  main.jsx
```
Additions beyond the original brief: `context/QuickViewContext.jsx`, `hooks/{useDragScroll,useDialog,useScrollLock}.js`,
`utils/{placeholder,scroll}.js`, `data/about.js`.
