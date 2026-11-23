import Seo from "./Seo";

/** Temporary page body used until the page is built in a later stage. */
export default function StagePlaceholder({ title, stage, children }) {
  return (
    <div className="container-page pb-24 pt-36">
      <Seo title={title} />
      <h1 className="text-5xl sm:text-6xl">{title}</h1>
      <p className="mt-6 max-w-xl text-mist">This page is built in Stage {stage}. The shared layout, cart and quick view already work.</p>
      {children}
    </div>
  );
}
