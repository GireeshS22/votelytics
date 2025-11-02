/**
 * Party Profile Page - Comprehensive view of party performance across elections
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { partyAPI } from '../services/api';
import { getPartyColor, formatPartyName } from '../utils/partyColors';
import type { ElectionResult } from '../types/election';

function PartyProfile() {
  const { partyName } = useParams<{ partyName: string }>();
  const navigate = useNavigate();
  const [results2021, setResults2021] = useState<ElectionResult[]>([]);
  const [results2016, setResults2016] = useState<ElectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const partyColor = getPartyColor(partyName || '');
  const partyDisplayName = formatPartyName(partyName || '');

  useEffect(() => {
    if (partyName) {
      loadData();
    }
  }, [partyName]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { results2021: r2021, results2016: r2016 } = await partyAPI.getPartyComparison(partyName!);

      setResults2021(r2021.sort((a, b) => (a.rank || 999) - (b.rank || 999)));
      setResults2016(r2016.sort((a, b) => (a.rank || 999) - (b.rank || 999)));
    } catch (err) {
      console.error('Error loading party data:', err);
      setError('Failed to load party data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate 2021 metrics
  const metrics2021 = useMemo(() => {
    const wins = results2021.filter(r => r.is_winner === 1);
    const totalVotes = results2021.reduce((sum, r) => sum + r.total_votes, 0);
    const avgVoteShare = results2021.length > 0
      ? results2021.reduce((sum, r) => sum + (r.vote_share_pct || 0), 0) / results2021.length
      : 0;
    const avgMargin = wins.length > 0
      ? wins.reduce((sum, r) => sum + (r.margin || 0), 0) / wins.length
      : 0;

    return {
      seatsWon: wins.length,
      contested: results2021.length,
      winPercentage: results2021.length > 0 ? (wins.length / results2021.length) * 100 : 0,
      totalVotes,
      avgVoteShare,
      avgMargin,
      wins,
      runnerUps: results2021.filter(r => r.rank === 2),
    };
  }, [results2021]);

  // Calculate 2016 metrics
  const metrics2016 = useMemo(() => {
    const wins = results2016.filter(r => r.is_winner === 1);
    const totalVotes = results2016.reduce((sum, r) => sum + r.total_votes, 0);
    const avgVoteShare = results2016.length > 0
      ? results2016.reduce((sum, r) => sum + (r.vote_share_pct || 0), 0) / results2016.length
      : 0;
    const avgMargin = wins.length > 0
      ? wins.reduce((sum, r) => sum + (r.margin || 0), 0) / wins.length
      : 0;

    return {
      seatsWon: wins.length,
      contested: results2016.length,
      winPercentage: results2016.length > 0 ? (wins.length / results2016.length) * 100 : 0,
      totalVotes,
      avgVoteShare,
      avgMargin,
      wins,
      runnerUps: results2016.filter(r => r.rank === 2),
    };
  }, [results2016]);

  // Calculate changes
  const changes = useMemo(() => ({
    seats: metrics2021.seatsWon - metrics2016.seatsWon,
    voteShare: metrics2021.avgVoteShare - metrics2016.avgVoteShare,
    votes: metrics2021.totalVotes - metrics2016.totalVotes,
    winPercentage: metrics2021.winPercentage - metrics2016.winPercentage,
  }), [metrics2021, metrics2016]);

  // Top constituencies
  const topConstituencies = useMemo(() => {
    return [...results2021]
      .sort((a, b) => (b.vote_share_pct || 0) - (a.vote_share_pct || 0))
      .slice(0, 5);
  }, [results2021]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Loading party data...</div>
        </div>
      </div>
    );
  }

  if (error || results2021.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-semibold text-red-600 mb-2">Error</div>
          <div className="text-gray-600 mb-4">
            {error || `No data found for party "${partyDisplayName}"`}
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Party Header */}
        <div
          className="rounded-2xl shadow-2xl p-8 mb-8 text-white overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${partyColor} 0%, ${partyColor}dd 100%)` }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
          </div>

          <div className="relative z-10">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-white/80 transition-all mb-6 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20"
            >
              <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Map</span>
            </button>

            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold mb-3">
              Political Party
            </div>
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">{partyDisplayName}</h1>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wide">2021 Seats Won</div>
                <div className="text-3xl font-bold">{metrics2021.seatsWon}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wide">Vote Share</div>
                <div className="text-3xl font-bold">{metrics2021.avgVoteShare.toFixed(1)}%</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wide">Total Votes</div>
                <div className="text-2xl font-bold">{(metrics2021.totalVotes / 1000000).toFixed(2)}M</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wide">Win Rate</div>
                <div className="text-3xl font-bold">{metrics2021.winPercentage.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Comparison</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 2021 */}
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="text-blue-600 font-bold text-lg mb-4">2021 Election</div>
              <div className="space-y-3">
                <div><span className="text-gray-600">Seats Won:</span> <span className="font-bold text-2xl">{metrics2021.seatsWon}</span></div>
                <div><span className="text-gray-600">Contested:</span> <span className="font-semibold">{metrics2021.contested}</span></div>
                <div><span className="text-gray-600">Vote Share:</span> <span className="font-semibold">{metrics2021.avgVoteShare.toFixed(2)}%</span></div>
                <div><span className="text-gray-600">Win Rate:</span> <span className="font-semibold">{metrics2021.winPercentage.toFixed(1)}%</span></div>
              </div>
            </div>

            {/* Change */}
            <div className="flex flex-col justify-center items-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
              <div className="text-purple-600 font-bold text-lg mb-4">Change</div>
              <div className="space-y-3 text-center">
                <div className={`text-2xl font-bold ${changes.seats >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {changes.seats >= 0 ? '+' : ''}{changes.seats} seats {changes.seats >= 0 ? '↑' : '↓'}
                </div>
                <div className={`text-lg ${changes.voteShare >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {changes.voteShare >= 0 ? '+' : ''}{changes.voteShare.toFixed(2)}% vote share
                </div>
                <div className={`text-sm ${changes.votes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {changes.votes >= 0 ? '+' : ''}{(changes.votes / 1000).toFixed(0)}K votes
                </div>
              </div>
            </div>

            {/* 2016 */}
            <div className="bg-green-50 rounded-xl p-6">
              <div className="text-green-600 font-bold text-lg mb-4">2016 Election</div>
              <div className="space-y-3">
                <div><span className="text-gray-600">Seats Won:</span> <span className="font-bold text-2xl">{metrics2016.seatsWon}</span></div>
                <div><span className="text-gray-600">Contested:</span> <span className="font-semibold">{metrics2016.contested}</span></div>
                <div><span className="text-gray-600">Vote Share:</span> <span className="font-semibold">{metrics2016.avgVoteShare.toFixed(2)}%</span></div>
                <div><span className="text-gray-600">Win Rate:</span> <span className="font-semibold">{metrics2016.winPercentage.toFixed(1)}%</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Constituencies */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top 5 Constituencies by Vote Share (2021)</h2>
          <div className="space-y-4">
            {topConstituencies.map((result, index) => (
              <div
                key={result.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/constituency/${result.constituency_id}`)}
              >
                <div className="text-3xl font-bold text-gray-400">#{index + 1}</div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{result.ac_name}</div>
                  <div className="text-sm text-gray-600">AC {result.ac_number}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: partyColor }}>
                    {result.vote_share_pct?.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.total_votes.toLocaleString()} votes
                  </div>
                  {result.is_winner === 1 && (
                    <div className="text-xs text-green-600 font-semibold">🏆 Won</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Won Constituencies 2021 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Won Constituencies 2021 ({metrics2021.wins.length} seats)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics2021.wins.map((result) => (
              <div
                key={result.id}
                className="p-4 border-2 rounded-lg hover:shadow-lg transition-all cursor-pointer"
                style={{ borderColor: partyColor }}
                onClick={() => navigate(`/constituency/${result.constituency_id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-bold text-lg">{result.ac_name}</div>
                  <div className="text-2xl">🏆</div>
                </div>
                <div className="text-sm text-gray-600 mb-2">AC {result.ac_number}</div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Vote Share</span>
                    <span className="font-bold" style={{ color: partyColor }}>
                      {result.vote_share_pct?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${result.vote_share_pct}%`,
                        backgroundColor: partyColor
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-green-600 font-semibold">
                  Won by +{result.margin?.toLocaleString()} votes
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Runner-up Constituencies */}
        {metrics2021.runnerUps.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Runner-up Constituencies 2021 ({metrics2021.runnerUps.length} seats)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics2021.runnerUps.map((result) => (
                <div
                  key={result.id}
                  className="p-4 border-2 border-yellow-400 rounded-lg hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/constituency/${result.constituency_id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-bold text-lg">{result.ac_name}</div>
                    <div className="text-2xl">🥈</div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">AC {result.ac_number}</div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Vote Share</span>
                      <span className="font-bold" style={{ color: partyColor }}>
                        {result.vote_share_pct?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${result.vote_share_pct}%`,
                          backgroundColor: partyColor
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.total_votes.toLocaleString()} votes
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PartyProfile;
