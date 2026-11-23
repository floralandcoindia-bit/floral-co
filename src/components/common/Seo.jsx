import { Helmet } from "react-helmet-async";
import { siteConfig } from "../../config/site";

export default function Seo({ title, description = siteConfig.description }) {
  const full = title ? `${title} · ${siteConfig.brandName}` : `${siteConfig.brandName} — ${siteConfig.tagline}`;
  return (
    <Helmet>
      <title>{full}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
    </Helmet>
  );
}
