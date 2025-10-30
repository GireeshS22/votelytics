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
}

export interface ElectionResult {
  id: number;
  election_id: number;
  constituency_id: number;
  candidate_id: number | null;
  candidate_name: string;
  party: string;
  votes_received: number;
  vote_share_pct: number | null;
  total_votes_polled: number | null;
  total_valid_votes: number | null;
  is_winner: number;
  margin: number | null;
  margin_pct: number | null;
  alliance: string | null;
  extra_data: Record<string, any> | null;
}
