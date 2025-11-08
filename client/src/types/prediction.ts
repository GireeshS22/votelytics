/**
 * TypeScript types for election predictions
 */

export interface Prediction {
  id: number;
  constituency_id: number;
  constituency_name: string;
  ac_number: number;
  district: string;
  region: string;
  predicted_winner_alliance: string;
  predicted_winner_party: string;
  confidence_level: 'Safe' | 'Likely' | 'Lean' | 'Toss-up';
  win_probability: number;
  predicted_vote_share: number;
  predicted_margin_pct: number;
  key_factors: string[];
  created_at: string;
}

export interface PredictionDetail extends Prediction {
  constituency: {
    name: string;
    ac_number: number;
    district: string;
    region: string;
    population: number | null;
    urban_pct: number | null;
    literacy_rate: number | null;
  };
  top_alliances: AllianceVoteShare[];
  swing_from_last_election: number;
}

export interface AllianceVoteShare {
  alliance: string;
  lead_party: string;
  vote_share: number;
}

export interface AllianceDistribution {
  total: number;
  safe: number;
  likely: number;
  lean: number;
}

export interface PredictionsSummary {
  total_seats: number;
  majority_mark: number;
  predictions_complete: number;
  predictions_pending: number;
  generated_date: string;
  seat_distribution: {
    [alliance: string]: AllianceDistribution;
  };
  toss_up: number;
  winner: string;
  winning_margin: number;
}

export interface RegionalData {
  total: number;
  [alliance: string]: number;
}

export interface RegionalSummary {
  regions: {
    [region: string]: RegionalData;
  };
}

export interface ComparisonData {
  [year: string]: number;
  swing: number;
}

export interface PredictionComparison {
  from_year: number;
  to_year: number;
  comparison: {
    [alliance: string]: ComparisonData;
  };
}

export interface PredictionFilters {
  year?: number;
  alliance?: string;
  confidence_level?: string;
  region?: string;
  district?: string;
  limit?: number;
  offset?: number;
}

export interface PredictionsListResponse {
  total: number;
  predictions: Prediction[];
}
