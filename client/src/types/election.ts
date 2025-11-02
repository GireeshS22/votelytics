/**
 * TypeScript interfaces for Election data
 */

export interface Election {
  id: number;
  year: number;
  name: string;
  election_type: string;
  state: string;
  election_date: string;
  total_seats: number | null;
  total_voters: number | null;
  voter_turnout_pct: number | null;
  created_at: string;
  updated_at: string;
}

export interface ElectionResult {
  id: number;
  election_id: number;
  constituency_id: number;
  candidate_id: number | null;

  // Denormalized election data
  year: number;

  // Denormalized constituency data
  ac_number: number;
  ac_name: string;
  total_electors: number | null;

  // Candidate details
  candidate_name: string;
  sex: string | null;
  age: number | null;
  category: string | null;

  // Party details
  party: string;
  symbol: string | null;
  alliance: string | null;

  // Vote counts
  general_votes: number;
  postal_votes: number;
  total_votes: number;
  vote_share_pct: number | null;

  // Result metadata
  rank: number | null;
  is_winner: number;
  margin: number | null;
  margin_pct: number | null;

  extra_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
