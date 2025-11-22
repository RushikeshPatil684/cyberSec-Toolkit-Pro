import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for dynamic meta tags
 */
export default function SEO({
  title = 'CyberSec Toolkit Pro',
  description = 'Professional cybersecurity toolkit with IP lookup, WHOIS, DNS resolution, port scanning, hash generation, CVE search, and more.',
  image = '/favicon.svg',
  url = '',
  type = 'website',
  structuredData = null,
}) {
  const fullTitle = title.includes('CyberSec Toolkit Pro') ? title : `${title} | CyberSec Toolkit Pro`;
  const fullUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

