/**
 * VoteResults Page — Public opinion poll results
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { votesAPI, constituenciesAPI } from '../services/api';
import ConstituencySearch from '../components/ConstituencySearch';
import type { Constituency } from '../types/constituency';

const ALLIANCE_COLORS: Record<string, string> = {
  'DMK+': '#FF0000',
  'AIADMK+': '#008000',
  'NTK': '#800080',
  'TVK': '#8B4513',
  'BJP+': '#FF9933',
  'Others': '#6B7280',
};

interface AllianceResult {
  alliance: string;
  votes: number;
  percentage: number;
}

function ResultBar({ alliance, votes, percentage }: AllianceResult) {
  const color = ALLIANCE_COLORS[alliance] || '#6B7280';
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-gray-800">{alliance}</span>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-bold text-gray-900">{percentage}%</span>
          <span className="ml-1 text-gray-400">({votes.toLocaleString()} votes)</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function VoteResults() {
  const location = useLocation();
  const highlightedConstituencyId = location.state?.constituencyId as number | undefined;

  const [stateResults, setStateResults] = useState<{
    total_votes: number;
    results: AllianceResult[];
  } | null>(null);

  const [constituencyResults, setConstituencyResults] = useState<{
    constituency_id: number;
    constituency_name: string;
    total_votes: number;
    results: AllianceResult[];
  } | null>(null);

  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [selectedConstituencyId, setSelectedConstituencyId] = useState<number | ''>(
    highlightedConstituencyId || ''
  );
  const [loading, setLoading] = useState(true);
  const [constLoading, setConstLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      votesAPI.getAllResults(),
      constituenciesAPI.getAll({ limit: 500 }),
    ]).then(([results, constData]) => {
      setStateResults(results);
      const sorted = [...constData.constituencies].sort((a, b) => a.ac_number - b.ac_number);
      setConstituencies(sorted);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedConstituencyId) {
      setConstituencyResults(null);
      return;
    }
    setConstLoading(true);
    votesAPI.getConstituencyResults(selectedConstituencyId as number)
      .then((data) => {
        setConstituencyResults(data);
        setConstLoading(false);
      })
      .catch(() => {
        setConstituencyResults(null);
        setConstLoading(false);
      });
  }, [selectedConstituencyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🗳️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Public Opinion Poll</h1>
          <p className="text-gray-500 text-sm">
            Non-binding visitor poll — {stateResults?.total_votes.toLocaleString() || 0} total votes cast
          </p>
        </div>

        {/* Statewide Results */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span>🏛️</span> Statewide Results
          </h2>
          {stateResults && stateResults.total_votes > 0 ? (
            <>
              {stateResults.results.map((r) => (
                <ResultBar key={r.alliance} {...r} />
              ))}
              <p className="text-xs text-gray-400 mt-4 text-center">
                Total responses: {stateResults.total_votes.toLocaleString()}
              </p>
            </>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No votes yet. Be the first to vote!</p>
          )}
        </div>

        {/* Constituency Results */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📍</span> Constituency Results
          </h2>
          <div className="mb-5">
            <ConstituencySearch
              constituencies={constituencies}
              value={selectedConstituencyId}
              onChange={setSelectedConstituencyId}
              placeholder="Search by name, number or district..."
            />
          </div>

          {constLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!constLoading && constituencyResults && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">{constituencyResults.constituency_name}</h3>
                <span className="text-sm text-gray-400">
                  {constituencyResults.total_votes.toLocaleString()} votes
                </span>
              </div>
              {constituencyResults.total_votes > 0 ? (
                constituencyResults.results.map((r) => (
                  <ResultBar key={r.alliance} {...r} />
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No votes for this constituency yet.</p>
              )}
            </>
          )}

          {!constLoading && !constituencyResults && selectedConstituencyId && (
            <p className="text-gray-500 text-sm text-center py-4">No votes for this constituency yet.</p>
          )}

          {!selectedConstituencyId && !constLoading && (
            <p className="text-gray-400 text-sm text-center py-4">Select a constituency to see its results.</p>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          This is a non-binding public opinion poll for informational purposes only. Results do not represent actual election outcomes.
        </p>
      </div>
    </div>
  );
}

export default VoteResults;
