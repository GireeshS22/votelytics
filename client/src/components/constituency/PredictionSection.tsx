/**
 * PredictionSection Component
 * Displays 2026 election prediction for a constituency
 */
import { getPartyColor } from '../../utils/partyColors';
import type { PredictionDetail } from '../../types/prediction';

interface PredictionSectionProps {
  prediction: PredictionDetail;
}

/**
 * Get color for an alliance
 */
const getAllianceColor = (alliance: string): string => {
  if (alliance === 'Toss-up') return '#9CA3AF'; // Gray for toss-ups
  if (alliance.includes('DMK') && !alliance.includes('AIADMK')) return getPartyColor('DMK');
  if (alliance.includes('AIADMK') || alliance.includes('ADMK')) return getPartyColor('AIADMK');
  if (alliance.includes('NTK')) return getPartyColor('NTK');
  if (alliance.includes('TVK')) return getPartyColor('TVK');
  if (alliance.includes('BJP')) return getPartyColor('BJP');
  if (alliance.includes('PMK')) return getPartyColor('PMK');
  return '#808080'; // Gray for others
};

function PredictionSection({ prediction }: PredictionSectionProps) {
  const allianceColor = getAllianceColor(prediction.predicted_winner_alliance);

  // Parse key_factors if it's a string
  const keyFactors = Array.isArray(prediction.key_factors)
    ? prediction.key_factors
    : typeof prediction.key_factors === 'string'
    ? prediction.key_factors.split('. ').filter(f => f.trim())
    : [];

  // Get top alliances for vote distribution
  const topAlliances = prediction.top_alliances || [];

  return (
    <div className="mb-8">
      <div
        className="rounded-2xl shadow-xl overflow-hidden border-2"
        style={{
          borderColor: allianceColor,
          background: `linear-gradient(135deg, ${allianceColor}08, ${allianceColor}05)`,
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔮</span>
            <h2 className="text-2xl font-bold text-white">2026 Election Prediction</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Winner Highlight Box - Single Line */}
          <div
            className="rounded-xl p-4 mb-6 shadow-md"
            style={{
              backgroundColor: `${allianceColor}15`,
              borderLeft: `4px solid ${allianceColor}`,
            }}
          >
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 justify-between">
              {/* Predicted Winner */}
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: allianceColor }}
                ></div>
                <span className="text-xs text-gray-600 font-medium">🎯 Predicted Winner</span>
                <span className="text-base font-bold text-gray-900">
                  {prediction.predicted_winner_alliance}
                </span>
              </div>

              {/* Vote Share */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">📊 Vote Share</span>
                <span className="text-base font-bold text-gray-900">
                  {prediction.predicted_vote_share.toFixed(1)}%
                </span>
              </div>

              {/* Winning Margin */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">📈 Winning Margin</span>
                <span className="text-base font-bold text-gray-900">
                  {prediction.predicted_margin_pct.toFixed(1)}%
                </span>
              </div>

              {/* Confidence Level */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">🎚️ Confidence Level</span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    prediction.confidence_level === 'Safe'
                      ? 'bg-green-100 text-green-800'
                      : prediction.confidence_level === 'Likely'
                      ? 'bg-blue-100 text-blue-800'
                      : prediction.confidence_level === 'Lean'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {prediction.confidence_level}
                </span>
              </div>
            </div>
          </div>

          {/* Vote Distribution Forecast */}
          {topAlliances.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📊</span>
                Vote Distribution Forecast
              </h3>
              <div className="space-y-3">
                {topAlliances.map((alliance, idx) => {
                  const color = getAllianceColor(alliance.alliance);
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      {/* Alliance Name */}
                      <div className="w-24 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          ></div>
                          <span className="text-sm font-semibold text-gray-700">
                            {alliance.alliance}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex-1 relative">
                        <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className="h-full flex items-center justify-end px-3 text-white text-sm font-semibold transition-all duration-500"
                            style={{
                              width: `${alliance.vote_share}%`,
                              backgroundColor: color,
                              minWidth: alliance.vote_share > 5 ? 'auto' : '60px',
                            }}
                          >
                            {alliance.vote_share.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key Prediction Factors */}
          {keyFactors.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>💡</span>
                Key Prediction Factors
              </h3>
              <ul className="space-y-3">
                {keyFactors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                    <span className="text-gray-700 leading-relaxed">{factor.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer - Generated Date */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              📅 Generated on{' '}
              {new Date(prediction.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PredictionSection;
