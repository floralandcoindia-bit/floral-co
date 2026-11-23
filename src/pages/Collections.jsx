import { Link } from "react-router-dom";
import Seo from "../components/common/Seo";
import CollectionSection from "../components/collections/CollectionSection";
import { useProducts } from "../hooks/useProducts";
import CatalogStatus from "../components/common/CatalogStatus";

export default function Collections() {
  const { collections } = useProducts();
  return (
    <div className="pb-16 pt-32">
      <Seo title="Collections" description="Explore handmade collections: bouquets, keepsakes, magazines, seasonal pieces and more." />

      <header className="container-page max-w-4xl">
        <h1 className="text-6xl sm:text-8xl">Collections</h1>
        <p className="mt-4 max-w-xl text-lg text-mist">Each collection has its own mood and its own story. Start anywhere.</p>
        <nav aria-label="Jump to a collection" className="mt-8 flex flex-wrap gap-2">
          {collections.map((c) => (
            <Link
              key={c.slug}
              to={`#${c.slug}`}
              className="rounded-full border border-ivory/20 px-4 py-2 text-sm text-mist transition-colors hover:border-ivory/50 hover:text-ivory"
            >
              {c.title}
            </Link>
          ))}
        </nav>
      </header>

      <div className="container-page"><CatalogStatus /></div>

      {collections.map((c, i) => (
        <CollectionSection key={c.id} collection={c} index={i} />
      ))}
    </div>
  );
}
