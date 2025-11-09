/**
 * SEO Configuration
 * Centralized SEO settings, keywords, and default values
 */

// Get site URL from environment variable
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://votelytics.in';

export const SEO_CONFIG = {
  siteName: 'Votelytics',
  siteUrl: SITE_URL,
  defaultTitle: 'Votelytics | Tamil Nadu Election Data & 2026 Predictions',
  defaultDescription: 'Explore comprehensive Tamil Nadu assembly election results (2011, 2016, 2021) and data-driven 2026 predictions. Interactive map with 234 constituencies, electoral trends, and AI-powered forecasts.',
  defaultKeywords: 'Tamil Nadu election, 2026 election predictions, TN assembly election, election results, constituency map, electoral analysis, 2026 forecast, India elections, Tamil Nadu MLA',
  twitterHandle: '@votelytics',

  // Social media images (to be added later)
  defaultOgImage: '/og-default.png',

  // Organization info for structured data
  organization: {
    name: 'Votelytics',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Tamil Nadu Election Data Visualization, Analysis, and 2026 Predictions Platform',
  },
};

/**
 * Page-specific SEO templates
 */
export const PAGE_SEO = {
  home: {
    title: 'Tamil Nadu Election Map & 2026 Predictions | Votelytics',
    description: 'Interactive Tamil Nadu election map with 2026 predictions. Explore 234 constituencies, historical results (2011-2021), and data-driven 2026 assembly election forecasts with alliance-wise seat distribution.',
    keywords: 'Tamil Nadu election map, 2026 election predictions, TN assembly map, interactive election map, 2026 forecast Tamil Nadu, constituency predictions, election results 2021, Tamil Nadu voting data, 2026 assembly election',
  },

  predictions: {
    title: '2026 Tamil Nadu Assembly Election Predictions | Seat Forecast',
    description: 'Comprehensive 2026 Tamil Nadu assembly election predictions. View seat distribution, alliance-wise forecasts, constituency-level predictions, and winning probabilities for all 234 constituencies. DMK vs AIADMK seat count predictions.',
    keywords: '2026 tamil nadu election predictions, who will win 2026 tamil nadu elections, dmk aiadmk 2026 predictions, seat predictions 2026, tamil nadu assembly election forecast, 2026 election results prediction, alliance seat distribution 2026, constituency wise predictions, tamil nadu 2026 forecast, bjp tamil nadu 2026, ntk predictions 2026',
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
 * Generate constituency-specific SEO data with optional 2026 prediction
 */
export function getConstituencySEO(
  constituencyName: string,
  district: string | null,
  acNumber: number,
  hasPrediction: boolean = false,
  predictedWinner?: string
) {
  const districtText = district ? ` (${district} District)` : '';

  // Base title and description
  const baseTitle = `${constituencyName} Election Results | AC ${acNumber}`;
  const title = hasPrediction
    ? `${constituencyName} 2026 Prediction & Results | ${predictedWinner} Alliance Forecast`
    : `${baseTitle} | MLA, Vote Count & Analysis`;

  const baseDescription = `Complete election results for ${constituencyName} constituency${districtText}. View 2021, 2016, and 2011 results, winning candidates, vote counts, margins, and historical electoral trends.`;
  const description = hasPrediction
    ? `${constituencyName} 2026 election prediction: ${predictedWinner} alliance likely to win. ${baseDescription} Plus data-driven 2026 forecast with confidence levels.`
    : baseDescription;

  // Base keywords
  const baseKeywords = [
    `${constituencyName} election results`,
    `${constituencyName} MLA`,
    `${constituencyName} assembly constituency`,
    district ? `${district} constituency` : '',
    `Tamil Nadu AC ${acNumber}`,
    `vote count ${constituencyName}`,
    `winning candidate ${constituencyName}`,
  ].filter(Boolean);

  // Add prediction keywords if available
  const predictionKeywords = hasPrediction
    ? [
        `${constituencyName} 2026 prediction`,
        `${constituencyName} 2026 election forecast`,
        `who will win ${constituencyName} 2026`,
        `${constituencyName} 2026 winner`,
        `${predictedWinner} ${constituencyName}`,
        `${constituencyName} assembly election 2026`,
        `${constituencyName} 2026 forecast`,
      ]
    : [];

  const keywords = [...predictionKeywords, ...baseKeywords].join(', ');

  return { title, description, keywords };
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
