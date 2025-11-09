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

/**
 * Event schema for 2026 election prediction
 */
export function generatePredictionEventSchema(
  constituency: {
    name: string;
    district: string | null;
    ac_number: number;
  },
  prediction: {
    predicted_winner_alliance: string;
    predicted_winner_party: string;
    confidence_level: string;
    win_probability: number;
  }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `2026 Tamil Nadu Assembly Election - ${constituency.name}`,
    description: `Election prediction for ${constituency.name} constituency (AC ${constituency.ac_number}). Predicted winner: ${prediction.predicted_winner_alliance} alliance led by ${prediction.predicted_winner_party}. Confidence: ${prediction.confidence_level} (${prediction.win_probability}% probability).`,
    startDate: '2026-04-01', // Expected election date
    endDate: '2026-04-01',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: constituency.name,
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'Tamil Nadu',
        addressLocality: constituency.district || '',
        addressCountry: 'IN',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Election Commission of India',
      url: 'https://eci.gov.in',
    },
    about: {
      '@type': 'Thing',
      name: `${prediction.predicted_winner_alliance} Alliance - ${constituency.name}`,
      description: `Predicted to win ${constituency.name} in 2026 Tamil Nadu assembly election`,
    },
  };
}

/**
 * Dataset schema for 2026 predictions page
 */
export function generatePredictionsDatasetSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: '2026 Tamil Nadu Assembly Election Predictions',
    description: 'Comprehensive data-driven predictions for all 234 constituencies in Tamil Nadu 2026 assembly elections. Includes alliance-wise seat distribution, constituency-level forecasts, winning probabilities, and confidence levels.',
    keywords: [
      '2026 election predictions',
      'Tamil Nadu assembly election',
      'seat forecast 2026',
      'DMK AIADMK predictions',
      'constituency predictions',
      'election forecast',
      'Tamil Nadu 2026',
    ].join(', '),
    creator: {
      '@type': 'Organization',
      name: SEO_CONFIG.organization.name,
      url: SEO_CONFIG.siteUrl,
    },
    spatialCoverage: {
      '@type': 'Place',
      name: 'Tamil Nadu, India',
    },
    temporalCoverage: '2026',
    datePublished: '2025-11-09',
    dateModified: new Date().toISOString().split('T')[0],
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl: `${SEO_CONFIG.siteUrl}/predictions`,
    },
  };
}
