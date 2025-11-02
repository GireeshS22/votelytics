/**
 * TypeScript interfaces for Constituency data
 */

export interface Constituency {
  id: number;
  ac_number: number;
  name: string;
  code: string;
  district: string | null;
  region: string | null;
  population: number | null;
  urban_population_pct: number | null;
  literacy_rate: number | null;
  extra_data: Record<string, any> | null;
  geojson: GeoJSON.Feature | null;
  created_at: string;
  updated_at: string;
}

export interface ConstituencyList {
  constituencies: Constituency[];
  total: number;
}
