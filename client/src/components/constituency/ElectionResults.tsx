/**
 * ElectionResults Component - Displays all candidates for one election year
 */
import type { ElectionResult } from '../../types/election';
import CandidateCard from './CandidateCard';

interface ElectionResultsProps {
  year: number;
  results: ElectionResult[];
  title: string;
}

function ElectionResults({ year, results, title }: ElectionResultsProps) {
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-gray-400">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-4 opacity-30">🗳️</div>
          <p className="text-gray-600">No election data available for {year}.</p>
        </div>
      </div>
    );
  }

  // Separate winner from other candidates
  const winner = results.find(r => r.is_winner === 1 || r.rank === 1);
  const otherCandidates = results
    .filter(r => r.id !== winner?.id)
    .sort((a, b) => (a.rank || 999) - (b.rank || 999));

  // Calculate total votes cast
  const totalVotes = results.reduce((sum, r) => sum + r.total_votes, 0);
  const totalCandidates = results.length;
  const turnoutPct = results[0]?.total_electors
    ? ((totalVotes / results[0].total_electors) * 100).toFixed(2)
    : null;

  // Year-specific gradient colors
  const gradientClasses = year === 2021
    ? 'from-blue-500 to-indigo-600'
    : 'from-green-500 to-teal-600';

  const bgGradient = year === 2021
    ? 'from-blue-50 to-indigo-50'
    : 'from-green-50 to-teal-50';

  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-2xl shadow-xl p-6 border-t-4 ${year === 2021 ? 'border-blue-600' : 'border-green-600'}`}>
      {/* Section Header with Year Badge */}
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${gradientClasses} text-white px-4 py-2 rounded-full mb-4 shadow-lg`}>
          <span className="text-xl font-bold">{year}</span>
          <span className="text-sm font-medium">Election</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center shadow-sm">
            <div className="text-xs text-gray-600 font-medium mb-1">Candidates</div>
            <div className="text-2xl font-bold text-gray-900">{totalCandidates}</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center shadow-sm">
            <div className="text-xs text-gray-600 font-medium mb-1">Total Votes</div>
            <div className="text-xl font-bold text-gray-900">{(totalVotes / 1000).toFixed(1)}K</div>
          </div>
          {turnoutPct && (
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center shadow-sm">
              <div className="text-xs text-gray-600 font-medium mb-1">Turnout</div>
              <div className="text-2xl font-bold text-gray-900">{turnoutPct}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Winner Section */}
      {winner && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>🏆</span>
              <span>Winner</span>
            </h3>
            <div className="h-1 flex-1 bg-gradient-to-l from-yellow-400 to-orange-500 rounded-full"></div>
          </div>
          <CandidateCard result={winner} isWinner={true} />
        </div>
      )}

      {/* Other Candidates Section */}
      {otherCandidates.length > 0 && (
        <div>
          <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-white px-3 py-1 rounded-full shadow-sm">
              Other Candidates ({otherCandidates.length})
            </span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {otherCandidates.map((result) => (
              <CandidateCard key={result.id} result={result} isWinner={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ElectionResults;
