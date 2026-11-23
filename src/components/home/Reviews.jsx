import { Quote, Star } from "lucide-react";
import Reveal from "../common/Reveal";
import Button from "../common/Button";
import { testimonials } from "../../data/testimonials";
import { useCatalog } from "../../context/CatalogContext";
import { siteConfig } from "../../config/site";

function ReviewCard({ t, hidden = false }) {
  const { getProductById } = useCatalog();
  const product = t.productId ? getProductById(t.productId) : null;
  return (
    <figure
      aria-hidden={hidden || undefined}
      className="mr-5 flex w-[78vw] shrink-0 flex-col justify-between rounded-sm border border-ivory/15 bg-evergreen/50 p-7 sm:mr-8 sm:w-[420px]"
    >
      <div>
        <div className="mb-4 flex gap-1 text-gold" role="img" aria-label={`${t.rating || 5} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, n) => (
            <Star key={n} className="h-4 w-4" fill={n < (t.rating || 5) ? "currentColor" : "none"} strokeWidth={1.5} aria-hidden="true" />
          ))}
        </div>
        <blockquote className="font-serif text-xl leading-snug text-ivory sm:text-2xl">{t.quote}</blockquote>
      </div>
      <figcaption className="mt-6 text-sm text-mist">
        <span className="text-ivory">{t.name}</span>
        {t.location && <span>, {t.location}</span>}
        {product && <span className="mt-1 block">About: {product.name}</span>}
      </figcaption>
    </figure>
  );
}

export default function Reviews() {
  const hasReviews = testimonials.length > 0;
  // Slow, steady speed regardless of how many reviews there are
  const duration = Math.max(40, testimonials.length * 9);

  return (
    <section aria-labelledby="reviews-title" className="pb-8 pt-12 sm:pt-20">
      <div className="container-page">
        <Reveal>
          <h2 id="reviews-title" className="text-5xl sm:text-7xl">Customer Reviews</h2>
          <p className="mt-4 max-w-md text-mist">What people say about the pieces they received.</p>
        </Reveal>

        {!hasReviews && (
          <Reveal className="mt-12 rounded-sm border border-dashed border-ivory/20 px-6 py-16 text-center sm:py-20">
            <Quote className="mx-auto h-7 w-7 text-gold" strokeWidth={1.25} aria-hidden="true" />
            <h3 className="mt-6 text-3xl sm:text-4xl">Kind words will gather here.</h3>
            <p className="mx-auto mt-3 max-w-md text-mist">No reviews have been added yet. When customers share their experience, it will appear in this space.</p>
            <Button href={siteConfig.whatsappUrl} variant="outline" className="mt-8">Say hello on WhatsApp</Button>
          </Reveal>
        )}
      </div>

      {hasReviews && (
        // Endless marquee moving left → right. The list is repeated twice so the loop has no gap or jump.
        <div
          role="region"
          aria-label="Customer reviews"
          className="marquee-mask group mt-12 overflow-hidden"
        >
          <div className="marquee-track flex w-max pb-4" style={{ animationDuration: `${duration}s` }}>
            {testimonials.map((t) => <ReviewCard key={t.id} t={t} />)}
            {testimonials.map((t) => <ReviewCard key={`${t.id}-copy`} t={t} hidden />)}
          </div>
        </div>
      )}
    </section>
  );
}
