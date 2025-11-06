/**
 * MetaTags Component
 * Manages dynamic SEO meta tags for all pages using React Helmet Async
 */
import { Helmet } from 'react-helmet-async';

export interface MetaTagsProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  keywords?: string;
  noindex?: boolean;
  structuredData?: object;
}

export default function MetaTags({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage,
  keywords,
  noindex = false,
  structuredData,
}: MetaTagsProps) {
  // Full title with site name
  const fullTitle = title.includes('Votelytics') ? title : `${title} | Votelytics`;

  // Canonical URL - use provided or default to current location
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : 'https://votelytics.in');

  // Default OG image
  const defaultOgImage = 'https://votelytics.in/og-default.png';
  const ogImageUrl = ogImage || defaultOgImage;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:site_name" content="Votelytics" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
