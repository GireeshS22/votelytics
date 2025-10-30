/**
 * API service layer for Votelytics
 * Handles all HTTP requests to the backend
 */
import axios from 'axios';
import type { Constituency, ConstituencyList } from '../types/constituency';
import type { Election, ElectionResult } from '../types/election';

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
   */
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    district?: string;
    region?: string;
  }): Promise<ConstituencyList> => {
    const response = await apiClient.get<ConstituencyList>('/constituencies/', { params });
    return response.data;
  },

  /**
   * Get single constituency by ID
   */
  getById: async (id: number): Promise<Constituency> => {
    const response = await apiClient.get<Constituency>(`/constituencies/${id}`);
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
   * Get all results for an election
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
    const response = await apiClient.get<ElectionResult[]>(
      `/elections/${electionId}/results`,
      { params }
    );
    return response.data;
  },

  /**
   * Get historical results for a constituency
   */
  getConstituencyHistory: async (constituencyId: number): Promise<ElectionResult[]> => {
    const response = await apiClient.get<ElectionResult[]>(
      `/elections/constituency/${constituencyId}/history`
    );
    return response.data;
  },

  /**
   * Get results by year
   */
  getResultsByYear: async (year: number): Promise<ElectionResult[]> => {
    const response = await apiClient.get<ElectionResult[]>(`/elections/year/${year}/results`);
    return response.data;
  },
};

export default apiClient;
