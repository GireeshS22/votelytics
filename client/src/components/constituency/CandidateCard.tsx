/**
 * CandidateCard Component - Displays individual candidate election result
 */
import { useNavigate } from 'react-router-dom';
import type { ElectionResult } from '../../types/election';
import { getPartyColor, formatPartyName } from '../../utils/partyColors';

interface CandidateCardProps {
  result: ElectionResult;
  isWinner?: boolean;
}

function CandidateCard({ result, isWinner = false }: CandidateCardProps) {
  const partyColor = getPartyColor(result.party);
  const navigate = useNavigate();

  // Rank badge styling
  const getRankBadge = () => {
    if (isWinner) {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          <span>🏆</span>
          <span>Winner</span>
        </div>
      );
    }

    if (result.rank === 2) {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">
          <span>🥈</span>
          <span>#2</span>
        </div>
      );
    }

    if (result.rank === 3) {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-orange-300 to-orange-400 text-orange-900 px-3 py-1 rounded-full text-sm font-bold">
          <span>🥉</span>
          <span>#3</span>
        </div>
      );
    }

    return (
      <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
        #{result.rank}
      </div>
    );
  };

  return (
    <div
      className={`
        bg-white rounded-xl shadow-md p-5 border-l-4 transition-all duration-300
        hover:shadow-2xl hover:-translate-y-1 cursor-pointer
        ${isWinner ? 'ring-2 ring-yellow-400 shadow-xl scale-105' : ''}
      `}
      style={{ borderLeftColor: partyColor }}
    >
      {/* Header with Rank Badge */}
      <div className="flex items-center justify-between mb-4">
        {getRankBadge()}
        {result.age && (
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
            {result.sex === 'M' ? '👨' : result.sex === 'F' ? '👩' : ''} {result.age} yrs
          </span>
        )}
      </div>

      {/* Candidate Name */}
      <h3 className={`font-bold mb-2 text-gray-900 ${isWinner ? 'text-xl' : 'text-lg'}`}>
        {result.candidate_name}
      </h3>

      {/* Party Badge */}
      <div
        className="flex items-center gap-2 mb-4 cursor-pointer hover:bg-gray-50 -mx-1 px-1 py-1 rounded transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/party/${result.party}`);
        }}
      >
        <div
          className="w-4 h-4 rounded border-2 border-white shadow-sm"
          style={{ backgroundColor: partyColor }}
        ></div>
        <span className="text-sm font-semibold text-gray-800 hover:underline">
          {formatPartyName(result.party)}
        </span>
        {result.alliance && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {result.alliance}
          </span>
        )}
      </div>

      {/* Vote Share Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-600">Vote Share</span>
          <span className="text-sm font-bold" style={{ color: partyColor }}>
            {result.vote_share_pct?.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full transition-all duration-500 shadow-sm"
            style={{
              width: `${Math.min(result.vote_share_pct || 0, 100)}%`,
              backgroundColor: partyColor
            }}
          ></div>
        </div>
      </div>

      {/* Vote Count */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗳️</span>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Votes</div>
            <div className="text-lg font-bold text-gray-900">
              {result.total_votes.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* General & Postal Votes Breakdown */}
      {(result.general_votes > 0 || result.postal_votes > 0) && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="text-xs text-blue-600 font-medium">General</div>
            <div className="text-sm font-bold text-blue-900">
              {result.general_votes.toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <div className="text-xs text-purple-600 font-medium">Postal</div>
            <div className="text-sm font-bold text-purple-900">
              {result.postal_votes.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Winner Margin */}
      {isWinner && result.margin && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mt-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📈</span>
            <span className="text-sm font-semibold text-green-800">
              Victory Margin
            </span>
          </div>
          <div className="text-xl font-bold text-green-900">
            +{result.margin.toLocaleString()} votes
          </div>
          {result.margin_pct && (
            <div className="text-xs text-green-700 mt-1">
              {result.margin_pct.toFixed(2)}% ahead of runner-up
            </div>
          )}
        </div>
      )}

      {/* Category Badge */}
      {result.category && result.category !== 'GEN' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="inline-block text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
            Category: {result.category}
          </span>
        </div>
      )}
    </div>
  );
}

export default CandidateCard;
