/**
 * Party color mapping for Tamil Nadu elections
 */

export const PARTY_COLORS: Record<string, string> = {
  // Major Parties
  'DMK': '#FF0000',          // Red
  'ADMK': '#008000',         // Green
  'AIADMK': '#008000',       // Green (alternate name)
  'BJP': '#FF9933',          // Saffron/Orange
  'INC': '#00BFFF',          // Sky Blue
  'INCI': '#00BFFF',         // Sky Blue (alternate)

  // Regional Parties
  'PMK': '#FFFF00',          // Yellow
  'VCK': '#0000FF',          // Blue
  'MDMK': '#FF1493',         // Deep Pink
  'DMDK': '#FFD700',         // Gold
  'NTK': '#800080',          // Purple
  'TVK': '#8B4513',          // Saddle Brown (Vijay's party)
  'MNM': '#FF6347',          // Tomato
  'TMC': '#00CED1',          // Dark Turquoise
  'AMMK': '#32CD32',         // Lime Green

  // Left Parties
  'CPI': '#DC143C',          // Crimson
  'CPI(M)': '#FF0000',       // Red
  'CPIM': '#FF0000',         // Red (alternate)

  // Others
  'IND': '#808080',          // Gray
  'NOTA': '#D3D3D3',         // Light Gray

  // Default
  'default': '#808080'       // Gray
};

/**
 * Get color for a party
 */
export function getPartyColor(party: string | null | undefined): string {
  if (!party) return PARTY_COLORS.default;

  // Normalize party name (uppercase, remove spaces)
  const normalized = party.toUpperCase().replace(/\s+/g, '');

  return PARTY_COLORS[normalized] || PARTY_COLORS.default;
}

/**
 * Get party name with proper formatting
 */
export function formatPartyName(party: string | null | undefined): string {
  if (!party) return 'Unknown';

  // Handle common abbreviations
  const partyMap: Record<string, string> = {
    'DMK': 'DMK',
    'ADMK': 'AIADMK',
    'AIADMK': 'AIADMK',
    'BJP': 'BJP',
    'INC': 'INC',
    'PMK': 'PMK',
    'VCK': 'VCK',
    'CPI': 'CPI',
    'CPI(M)': 'CPI(M)',
    'CPIM': 'CPI(M)',
    'IND': 'Independent',
    'NOTA': 'NOTA'
  };

  return partyMap[party.toUpperCase()] || party;
}
