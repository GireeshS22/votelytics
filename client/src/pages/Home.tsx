/**
 * Home page - displays the interactive Tamil Nadu map
 * Optimized with caching and memoization
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { constituenciesAPI, electionsAPI } from '../services/api';
import TNMap from '../components/map/TNMap';
import type { Constituency } from '../types/constituency';
import type { Election, ElectionResult } from '../types/election';

export interface ConstituencyWithWinner extends Constituency {
  winner?: ElectionResult;
}

function Home() {
  const [constituencies, setConstituencies] = useState<ConstituencyWithWinner[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch available elections on mount
  useEffect(() => {
    loadElections();
  }, []);

  // Load data when election is selected
  useEffect(() => {
    if (selectedElectionId !== null) {
      loadData(selectedElectionId);
    }
  }, [selectedElectionId]);

  const loadElections = async () => {
    try {
      const electionsData = await electionsAPI.getAll({ limit: 100 });

      // Sort elections by year descending (newest first)
      const sortedElections = electionsData.sort((a, b) => b.year - a.year);
      setElections(sortedElections);

      // Auto-select the most recent election (2021)
      if (sortedElections.length > 0) {
        setSelectedElectionId(sortedElections[0].id);
      }
    } catch (err) {
      setError('Failed to load elections. Make sure the backend is running.');
      console.error('Error loading elections:', err);
    }
  };

  const loadData = async (electionId: number) => {
    try {
      setLoading(true);

      // Fetch constituencies and winners for selected election in parallel
      const [constituenciesData, winners] = await Promise.all([
        constituenciesAPI.getAll({ limit: 500 }),
        electionsAPI.getResults(electionId, { winner_only: true, limit: 500 })
      ]);

      // Create a map of constituency_id to winner
      const winnerMap = new Map<number, ElectionResult>();
      winners.forEach(winner => {
        winnerMap.set(winner.constituency_id, winner);
      });

      // Merge constituencies with winners
      const merged = constituenciesData.constituencies.map(constituency => ({
        ...constituency,
        winner: winnerMap.get(constituency.id)
      }));

      setConstituencies(merged);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Make sure the backend is running.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Memoize click handler to prevent re-creation on every render
  const handleConstituencyClick = useCallback((constituency: Constituency) => {
    console.log('Constituency clicked:', constituency);
    navigate(`/constituency/${constituency.id}`);
  }, [navigate]);

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
            onClick={loadElections}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get currently selected election
  const selectedElection = elections.find(e => e.id === selectedElectionId);

  return (
    <div className="h-screen flex flex-col relative">
      {/* Year Selection Dropdown - positioned to avoid header overlap */}
      <div className="absolute top-2 right-4 z-[1001]">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <label htmlFor="year-select" className="block text-xs font-semibold text-gray-700 mb-2">
            Election Year
          </label>
          <select
            id="year-select"
            value={selectedElectionId || ''}
            onChange={(e) => setSelectedElectionId(Number(e.target.value))}
            className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {elections.map((election) => (
              <option key={election.id} value={election.id}>
                {election.year} - {election.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1">
        <TNMap
          constituencies={constituencies}
          selectedYear={selectedElection?.year}
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
