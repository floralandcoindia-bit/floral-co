import { useCatalog } from "../../context/CatalogContext";
import Button from "./Button";

/** Shown instead of page content while the catalog loads, or if it could not be loaded at all. Returns null when ready. */
export default function CatalogStatus({ className = "mt-10" }) {
  const { loading, error, reload } = useCatalog();
  if (loading) {
    return (
      <p role="status" className={`${className} text-mist`}>
        Opening the studio…
      </p>
    );
  }
  if (error) {
    return (
      <div role="alert" className={`${className} rounded-sm border border-dashed border-ivory/20 px-6 py-14 text-center`}>
        <h2 className="text-3xl">We couldn't load the shop.</h2>
        <p className="mx-auto mt-3 max-w-md text-mist">Please check your connection and try again.</p>
        <Button onClick={reload} variant="outline" className="mt-6">Try again</Button>
      </div>
    );
  }
  return null;
}
