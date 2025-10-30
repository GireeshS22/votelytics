/**
 * TypeScript interfaces for Constituency data
 */

export interface Constituency {
  id: number;
  name: string;
  code: string;
  district: string;
  region: string | null;
  population: number | null;
  urban_population_pct: number | null;
  literacy_rate: number | null;
  extra_data: Record<string, any> | null;
  geojson: GeoJSON.Feature | null;
}

export interface ConstituencyList {
  constituencies: Constituency[];
  total: number;
}
