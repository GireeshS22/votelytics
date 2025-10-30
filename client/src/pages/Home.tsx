/**
 * Home page - displays the interactive Tamil Nadu map
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { constituenciesAPI } from '../services/api';
import TNMap from '../components/map/TNMap';
import type { Constituency } from '../types/constituency';

function Home() {
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      setError('Failed to load constituencies. Make sure the backend is running.');
      console.error('Error loading constituencies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConstituencyClick = (constituency: Constituency) => {
    console.log('Constituency clicked:', constituency);
    // navigate(`/constituency/${constituency.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading Votelytics...</div>
          <div className="text-gray-600">Fetching Tamil Nadu constituencies</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-xl font-semibold text-red-600 mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={loadConstituencies}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Map Container */}
      <div className="flex-1">
        <TNMap
          constituencies={constituencies}
          onConstituencyClick={handleConstituencyClick}
        />
      </div>

      {/* Bottom Stats Bar */}
      <div className="bg-white border-t shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {constituencies.length}
              </div>
              <div className="text-sm text-gray-600">Constituencies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">234</div>
              <div className="text-sm text-gray-600">Total Seats</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">2026</div>
              <div className="text-sm text-gray-600">Next Election</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">6.3 Cr</div>
              <div className="text-sm text-gray-600">Voters</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
