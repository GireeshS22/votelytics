/**
 * Home page - displays the interactive Tamil Nadu map
 */
import { useState, useEffect } from 'react';
import { constituenciesAPI } from '../services/api';
import type { Constituency } from '../types/constituency';

function Home() {
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConstituencies();
  }, []);

  const loadConstituencies = async () => {
    try {
      setLoading(true);
      const data = await constituenciesAPI.getAll({ limit: 500 });
      setConstituencies(data.constituencies);
      setError(null);
    } catch (err) {
      setError('Failed to load constituencies');
      console.error('Error loading constituencies:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading Tamil Nadu constituencies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Tamil Nadu Elections 2026
        </h1>
        <p className="text-gray-600">
          Explore constituencies, historical results, and predictions
        </p>
      </div>

      {/* Temporary: Show constituency list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {constituencies.map((constituency) => (
          <div
            key={constituency.id}
            className="p-4 border rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-gray-800">
              {constituency.name}
            </h3>
            <p className="text-sm text-gray-600">
              {constituency.district} • {constituency.region}
            </p>
            <div className="mt-2 text-sm text-gray-500">
              <div>Population: {constituency.population?.toLocaleString() || 'N/A'}</div>
              <div>Literacy: {constituency.literacy_rate || 'N/A'}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* TODO: Replace with actual Leaflet map */}
      <div className="mt-8 p-8 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg text-center">
        <p className="text-lg text-gray-700">
          🗺️ Interactive Tamil Nadu Map will appear here
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Next: We'll add Leaflet map with clickable constituencies
        </p>
      </div>
    </div>
  );
}

export default Home;
