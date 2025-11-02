/**
 * API service layer for Votelytics
 * Handles all HTTP requests to the backend with caching support
 */
import axios from 'axios';
import type { Constituency, ConstituencyList } from '../types/constituency';
import type { Election, ElectionResult } from '../types/election';
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from '../utils/cache';

// Base API URL - should match backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Constituencies API
export const constituenciesAPI = {
  /**
   * Get all constituencies with optional filters
   * Cached for 24 hours
   */
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    district?: string;
    region?: string;
  }): Promise<ConstituencyList> => {
    // Check cache first (only for full list without filters)
    if (!params?.district && !params?.region && !params?.skip) {
      const cached = getCached<ConstituencyList>(CACHE_KEYS.CONSTITUENCIES);
      if (cached) {
        console.log('✅ Constituencies loaded from cache');
        return cached;
      }
    }

    // Fetch from API
    console.log('🌐 Fetching constituencies from API...');
    const response = await apiClient.get<ConstituencyList>('/constituencies/', { params });

    // Cache full list only
    if (!params?.district && !params?.region && !params?.skip) {
      setCached(CACHE_KEYS.CONSTITUENCIES, response.data, CACHE_TTL.ONE_DAY);
    }

    return response.data;
  },

  /**
   * Get single constituency by ID
   * Cached for 24 hours
   */
  getById: async (id: number): Promise<Constituency> => {
    const cacheKey = `${CACHE_KEYS.CONSTITUENCY_PREFIX}${id}`;

    // Check cache first
    const cached = getCached<Constituency>(cacheKey);
    if (cached) {
      console.log(`✅ Constituency ${id} loaded from cache`);
      return cached;
    }

    // Fetch from API
    console.log(`🌐 Fetching constituency ${id} from API...`);
    const response = await apiClient.get<Constituency>(`/constituencies/${id}`);

    // Cache result
    setCached(cacheKey, response.data, CACHE_TTL.ONE_DAY);

    return response.data;
  },

  /**
   * Get constituency by code
   */
  getByCode: async (code: string): Promise<Constituency> => {
    const response = await apiClient.get<Constituency>(`/constituencies/code/${code}`);
    return response.data;
  },

  /**
   * Get all constituencies in a district
   */
  getByDistrict: async (district: string): Promise<Constituency[]> => {
    const response = await apiClient.get<Constituency[]>(`/constituencies/district/${district}`);
    return response.data;
  },
};

// Elections API
export const electionsAPI = {
  /**
   * Get all elections
   */
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    year?: number;
    election_type?: string;
  }): Promise<Election[]> => {
    const response = await apiClient.get<Election[]>('/elections/', { params });
    return response.data;
  },

  /**
   * Get single election by ID
   */
  getById: async (id: number): Promise<Election> => {
    const response = await apiClient.get<Election>(`/elections/${id}`);
    return response.data;
  },

  /**
   * Get election by year
   * Helper function to find election ID by year
   */
  getByYear: async (year: number): Promise<Election | null> => {
    const elections = await electionsAPI.getAll({ year });
    return elections.length > 0 ? elections[0] : null;
  },

  /**
   * Get all results for an election
   * Winners cached for 6 hours
   */
  getResults: async (
    electionId: number,
    params?: {
      skip?: number;
      limit?: number;
      party?: string;
      winner_only?: boolean;
    }
  ): Promise<ElectionResult[]> => {
    // Create cache key for winners only
    const cacheKey = params?.winner_only
      ? `votelytics:winners:election:${electionId}`
      : null;

    // Check cache for winners
    if (cacheKey) {
      const cached = getCached<ElectionResult[]>(cacheKey);
      if (cached) {
        console.log(`✅ Election ${electionId} winners loaded from cache`);
        return cached;
      }
    }

    // Fetch from API
    console.log(`🌐 Fetching election ${electionId} results from API...`);
    const response = await apiClient.get<ElectionResult[]>(
      `/elections/${electionId}/results`,
      { params }
    );

    // Cache winners
    if (cacheKey) {
      setCached(cacheKey, response.data, CACHE_TTL.SIX_HOURS);
    }

    return response.data;
  },

  /**
   * Get historical results for a constituency
   * Cached for 6 hours
   */
  getConstituencyHistory: async (constituencyId: number): Promise<ElectionResult[]> => {
    const cacheKey = `${CACHE_KEYS.HISTORY_PREFIX}${constituencyId}`;

    // Check cache first
    const cached = getCached<ElectionResult[]>(cacheKey);
    if (cached) {
      console.log(`✅ History for constituency ${constituencyId} loaded from cache`);
      return cached;
    }

    // Fetch from API
    console.log(`🌐 Fetching history for constituency ${constituencyId} from API...`);
    const response = await apiClient.get<ElectionResult[]>(
      `/elections/constituency/${constituencyId}/history`
    );

    // Cache result
    setCached(cacheKey, response.data, CACHE_TTL.SIX_HOURS);

    return response.data;
  },

  /**
   * Get results by year
   */
  getResultsByYear: async (year: number): Promise<ElectionResult[]> => {
    const response = await apiClient.get<ElectionResult[]>(`/elections/year/${year}/results`);
    return response.data;
  },

  /**
   * Get swing analysis comparing two elections
   */
  getSwingAnalysis: async (fromYear: number, toYear: number): Promise<any> => {
    const response = await apiClient.get(`/elections/swing-analysis/${fromYear}/${toYear}`);
    return response.data;
  },

  /**
   * Get bastion seats analysis - seats retained by same party
   */
  getBastionSeats: async (fromYear: number, toYear: number): Promise<any> => {
    const response = await apiClient.get(`/elections/bastion-seats/${fromYear}/${toYear}`);
    return response.data;
  },

  /**
   * Get bastion seats analysis across all three elections (2011, 2016, 2021)
   * Returns constituencies held by the same party in all 3 elections
   */
  getBastionSeatsThreeElections: async (): Promise<any> => {
    const response = await apiClient.get(`/elections/bastion-seats-three-elections`);
    return response.data;
  },
};

// Party API
export const partyAPI = {
  /**
   * Get all results for a specific party in an election
   * Cached for 6 hours
   */
  getPartyResults: async (electionId: number, partyName: string): Promise<ElectionResult[]> => {
    const cacheKey = `${CACHE_KEYS.PARTY_RESULTS_PREFIX}${partyName}:${electionId}`;

    // Check cache first
    const cached = getCached<ElectionResult[]>(cacheKey);
    if (cached) {
      console.log(`✅ Results for ${partyName} (${electionId}) loaded from cache`);
      return cached;
    }

    // Fetch from API using existing elections endpoint with party filter
    console.log(`🌐 Fetching ${partyName} results for election ${electionId} from API...`);
    const response = await apiClient.get<ElectionResult[]>(
      `/elections/${electionId}/results`,
      { params: { party: partyName, limit: 500 } }
    );

    // Cache result
    setCached(cacheKey, response.data, CACHE_TTL.SIX_HOURS);

    return response.data;
  },

  /**
   * Get party results for both 2021 and 2016 elections
   * Returns combined data for comparison
   */
  getPartyComparison: async (partyName: string): Promise<{
    results2021: ElectionResult[];
    results2016: ElectionResult[];
  }> => {
    // Fetch election IDs dynamically by year
    const [election2021, election2016] = await Promise.all([
      electionsAPI.getByYear(2021),
      electionsAPI.getByYear(2016),
    ]);

    // Fetch results for both elections
    const [results2021, results2016] = await Promise.all([
      election2021 ? partyAPI.getPartyResults(election2021.id, partyName) : Promise.resolve([]),
      election2016 ? partyAPI.getPartyResults(election2016.id, partyName) : Promise.resolve([]),
    ]);

    return {
      results2021,
      results2016,
    };
  },
};

export default apiClient;
