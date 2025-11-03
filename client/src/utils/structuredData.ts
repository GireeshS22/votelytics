/**
 * Structured Data (JSON-LD) Generators
 * Creates schema.org markup for better SEO
 */

import { SEO_CONFIG } from './seoConfig';

/**
 * Website schema for homepage
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    description: SEO_CONFIG.organization.description,
    publisher: {
      '@type': 'Organization',
      name: SEO_CONFIG.organization.name,
      logo: {
        '@type': 'ImageObject',
        url: SEO_CONFIG.organization.logo,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SEO_CONFIG.siteUrl}/constituency/{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONFIG.organization.name,
    url: SEO_CONFIG.organization.url,
    logo: SEO_CONFIG.organization.logo,
    description: SEO_CONFIG.organization.description,
    sameAs: [
      // Add social media links here when available
    ],
  };
}

/**
 * Place schema for constituencies
 */
export function generateConstituencySchema(constituency: {
  name: string;
  district: string | null;
  ac_number: number;
  population?: number | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${constituency.name} Assembly Constituency`,
    description: `${constituency.name} is Assembly Constituency ${constituency.ac_number} in Tamil Nadu${constituency.district ? `, located in ${constituency.district} district` : ''}.`,
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
      ...(constituency.district && { addressLocality: constituency.district }),
    },
    containedInPlace: {
      '@type': 'AdministrativeArea',
      name: 'Tamil Nadu',
      '@id': 'https://en.wikipedia.org/wiki/Tamil_Nadu',
    },
  };
}

/**
 * Government organization schema for political parties
 */
export function generatePartySchema(partyName: string, fullName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: fullName,
    alternateName: partyName,
    description: `${fullName} (${partyName}) performance in Tamil Nadu assembly elections`,
    areaServed: {
      '@type': 'State',
      name: 'Tamil Nadu',
    },
  };
}

/**
 * Breadcrumb schema
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Dataset schema for election data pages
 */
export function generateDatasetSchema(name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    creator: {
      '@type': 'Organization',
      name: SEO_CONFIG.organization.name,
      url: SEO_CONFIG.siteUrl,
    },
    keywords: 'Tamil Nadu, elections, assembly, constituencies, voting data',
    spatialCoverage: {
      '@type': 'Place',
      name: 'Tamil Nadu, India',
    },
    temporalCoverage: '2011/2021',
  };
}
