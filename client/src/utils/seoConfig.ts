/**
 * SEO Configuration
 * Centralized SEO settings, keywords, and default values
 */

// Get site URL from environment variable (supports both .com and .in domains)
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://votelytics.com';

export const SEO_CONFIG = {
  siteName: 'Votelytics',
  siteUrl: SITE_URL,
  defaultTitle: 'Votelytics | Tamil Nadu Election Data & Analysis Platform',
  defaultDescription: 'Explore comprehensive Tamil Nadu assembly election results (2011, 2016, 2021) on an interactive map. View 234 constituencies, analyze electoral trends, and compare party performance.',
  defaultKeywords: 'Tamil Nadu election, TN assembly election, election results, constituency map, electoral analysis, India elections, Tamil Nadu MLA',
  twitterHandle: '@votelytics',

  // Social media images (to be added later)
  defaultOgImage: '/og-default.png',

  // Organization info for structured data
  organization: {
    name: 'Votelytics',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Tamil Nadu Election Data Visualization and Analysis Platform',
  },
};

/**
 * Page-specific SEO templates
 */
export const PAGE_SEO = {
  home: {
    title: 'Interactive Tamil Nadu Election Map & Results 2011-2021',
    description: 'Explore Tamil Nadu assembly election results on an interactive map. View all 234 constituencies, analyze party performance, and track electoral trends from 2011 to 2021.',
    keywords: 'Tamil Nadu election map, TN assembly map, interactive election map, constituency map India, election results 2021, Tamil Nadu voting data',
  },

  analysis: {
    title: 'Tamil Nadu Bastion Seats Analysis | Electoral Strongholds',
    description: 'Discover party strongholds in Tamil Nadu. Analyze bastion seats held consistently from 2011-2021, identify electoral trends, and explore party dominance across constituencies.',
    keywords: 'Tamil Nadu bastion seats, party strongholds, electoral analysis, consistent constituencies, party dominance, Tamil Nadu political trends',
  },

  swingAnalysis: {
    title: 'Election Swing Analysis | Tamil Nadu Constituency Flips',
    description: 'Track electoral swings in Tamil Nadu. See which constituencies flipped between parties, analyze seat gains and losses, and understand changing voting patterns from 2011 to 2021.',
    keywords: 'election swing analysis, constituency flips, seat gains, electoral swing Tamil Nadu, party seat changes, voting pattern analysis',
  },

  about: {
    title: 'About Votelytics | Tamil Nadu Election Data Platform',
    description: 'Learn about Votelytics, a comprehensive platform for visualizing and analyzing Tamil Nadu assembly election data. Explore features, data sources, and our mission.',
    keywords: 'Votelytics about, election data platform, Tamil Nadu election visualization, election analysis tool',
  },

  terms: {
    title: 'Terms and Conditions | Votelytics',
    description: 'Terms of use, data accuracy disclaimer, and legal information for Votelytics - Tamil Nadu election data platform.',
    keywords: 'Votelytics terms, data disclaimer, terms of use',
  },
};

/**
 * Generate constituency-specific SEO data
 */
export function getConstituencySEO(constituencyName: string, district: string | null, acNumber: number) {
  const districtText = district ? ` (${district} District)` : '';

  return {
    title: `${constituencyName} Election Results 2021 | MLA, Vote Count & Analysis`,
    description: `Complete election results for ${constituencyName} constituency${districtText}. View 2021, 2016, and 2011 results, winning candidates, vote counts, margins, and historical electoral trends. AC ${acNumber}.`,
    keywords: `${constituencyName} election results, ${constituencyName} MLA, ${constituencyName} assembly constituency, ${district ? district + ' constituency,' : ''} Tamil Nadu AC ${acNumber}, vote count ${constituencyName}, winning candidate ${constituencyName}`,
  };
}

/**
 * Generate party-specific SEO data
 */
export function getPartySEO(partyName: string, fullPartyName?: string) {
  const displayName = fullPartyName || partyName;

  return {
    title: `${displayName} Tamil Nadu Performance | Election Results & Analysis`,
    description: `Comprehensive ${displayName} (${partyName}) performance in Tamil Nadu assembly elections. View seats won, vote share, constituency list, electoral trends, and historical performance from 2011-2021.`,
    keywords: `${partyName} Tamil Nadu, ${displayName} election performance, ${partyName} seats won, ${partyName} vote share, ${partyName} constituencies Tamil Nadu, ${partyName} electoral analysis`,
  };
}

/**
 * Party name mappings for better SEO
 */
export const PARTY_FULL_NAMES: Record<string, string> = {
  'DMK': 'Dravida Munnetra Kazhagam',
  'ADMK': 'All India Anna Dravida Munnetra Kazhagam',
  'BJP': 'Bharatiya Janata Party',
  'INC': 'Indian National Congress',
  'PMK': 'Pattali Makkal Katchi',
  'MDMK': 'Marumalarchi Dravida Munnetra Kazhagam',
  'CPI': 'Communist Party of India',
  'CPM': 'Communist Party of India (Marxist)',
  'DMDK': 'Desiya Murpokku Dravida Kazhagam',
  'VCK': 'Viduthalai Chiruthaigal Katchi',
  'IUML': 'Indian Union Muslim League',
  'PT': 'Puthiya Tamilagam',
  'TMC': 'Tamil Maanila Congress',
  'AMMK': 'Amma Makkal Munnetra Kazhagam',
  'NTK': 'Naam Tamilar Katchi',
  'IND': 'Independent',
};
