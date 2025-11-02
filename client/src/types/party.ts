/**
 * Party-related TypeScript type definitions
 */
import type { ElectionResult } from './election';
import type { Constituency } from './constituency';

/**
 * Party Performance Data
 */
export interface PartyPerformance {
  party: string;
  year: number;
  seatsWon: number;
  seatsContested: number;
  totalVotes: number;
  averageVoteShare: number;
  winPercentage: number;
  averageMargin: number;
  results: ElectionResult[];
}

/**
 * Party Comparison between two elections
 */
export interface PartyComparison {
  party: string;
  performance2021: PartyPerformance;
  performance2016: PartyPerformance;
  changes: {
    seatsChange: number;
    voteShareChange: number;
    totalVotesChange: number;
    winPercentageChange: number;
  };
}

/**
 * Constituency Performance by Party
 */
export interface ConstituencyPerformance {
  constituency: Constituency;
  result: ElectionResult;
  year: number;
  isWin: boolean;
  rank: number;
}

/**
 * Party Insights (auto-calculated highlights)
 */
export interface PartyInsights {
  strongestConstituency: {
    name: string;
    voteShare: number;
  };
  biggestImprovement: {
    name: string;
    improvement: number;
  };
  mostDecisiveWin: {
    name: string;
    margin: number;
  };
  narrowestVictory: {
    name: string;
    margin: number;
  };
  narrowestLoss: {
    name: string;
    margin: number;
  };
}

/**
 * Regional Performance Breakdown
 */
export interface RegionalPerformance {
  region: string;
  contested: number;
  won: number;
  winPercentage: number;
  averageVoteShare: number;
}

/**
 * District Performance Breakdown
 */
export interface DistrictPerformance {
  district: string;
  contested: number;
  won: number;
  winPercentage: number;
  averageVoteShare: number;
}

/**
 * Vote Distribution
 */
export interface VoteDistribution {
  generalVotes: number;
  postalVotes: number;
  totalVotes: number;
  generalPercentage: number;
  postalPercentage: number;
}
