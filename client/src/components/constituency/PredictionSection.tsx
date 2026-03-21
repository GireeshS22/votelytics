/**
 * PredictionSection Component
 * Displays 2026 election prediction for a constituency
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getPartyColor } from '../../utils/partyColors';
import type { PredictionDetail } from '../../types/prediction';

interface PredictionSectionProps {
  prediction: PredictionDetail;
  previousPrediction?: PredictionDetail | null;
  v1Prediction?: PredictionDetail | null;
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

function PredictionSection({ prediction, previousPrediction, v1Prediction }: PredictionSectionProps) {
  const allianceColor = getAllianceColor(prediction.predicted_winner_alliance);

  // Handle key_factors - can be string (old data) or array (new data)
  const keyFactors = Array.isArray(prediction.key_factors)
    ? prediction.key_factors
    : typeof prediction.key_factors === 'string' && prediction.key_factors
    ? prediction.key_factors.split('.').map((f: string) => f.trim()).filter((f: string) => f)
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

          {/* Vote Share Trend Chart */}
          {topAlliances.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📈</span>
                Vote Share Trend
              </h3>
              {(() => {
                // Build chart data from all 3 versions
                const allAlliances = new Set<string>();
                topAlliances.forEach((a) => allAlliances.add(a.alliance));
                previousPrediction?.top_alliances?.forEach((a) => allAlliances.add(a.alliance));
                v1Prediction?.top_alliances?.forEach((a) => allAlliances.add(a.alliance));

                const chartData: Array<{ version: string; [key: string]: number | string }> = [];

                // V1 — November 2025
                if (v1Prediction?.top_alliances) {
                  const pt: { version: string; [key: string]: number | string } = { version: 'V1 — Nov 2025' };
                  v1Prediction.top_alliances.forEach((a) => { pt[a.alliance] = a.vote_share; });
                  chartData.push(pt);
                }

                // V2 — January 2026
                if (previousPrediction?.top_alliances) {
                  const pt: { version: string; [key: string]: number | string } = { version: 'V2 — Jan 2026' };
                  previousPrediction.top_alliances.forEach((a) => { pt[a.alliance] = a.vote_share; });
                  chartData.push(pt);
                }

                // V3 — March 2026 (current)
                const pt: { version: string; [key: string]: number | string } = { version: 'V3 — Mar 2026' };
                topAlliances.forEach((a) => { pt[a.alliance] = a.vote_share; });
                chartData.push(pt);

                // Get alliance list sorted by current vote share
                const allianceList = Array.from(allAlliances).sort((a, b) => {
                  const aShare = topAlliances.find((x) => x.alliance === a)?.vote_share || 0;
                  const bShare = topAlliances.find((x) => x.alliance === b)?.vote_share || 0;
                  return bShare - aShare;
                });

                return (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="version"
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                          axisLine={{ stroke: '#E5E7EB' }}
                        />
                        <YAxis
                          domain={[0, 50]}
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                          axisLine={{ stroke: '#E5E7EB' }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                        />
                        <Legend />
                        {allianceList.map((alliance) => (
                          <Line
                            key={alliance}
                            type="monotone"
                            dataKey={alliance}
                            stroke={getAllianceColor(alliance)}
                            strokeWidth={3}
                            dot={{ r: 6, fill: getAllianceColor(alliance) }}
                            activeDot={{ r: 8 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>

                    {/* Trend Summary below chart — V1 vs V3 */}
                    {v1Prediction && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-4 justify-center">
                          {allianceList.map((alliance) => {
                            const current = topAlliances.find((a) => a.alliance === alliance)?.vote_share;
                            const prev = v1Prediction.top_alliances?.find((a) => a.alliance === alliance)?.vote_share;
                            if (current === undefined || prev === undefined) return null;
                            const change = current - prev;
                            if (Math.abs(change) < 0.1) return null;

                            return (
                              <div key={alliance} className="flex items-center gap-2 text-sm">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: getAllianceColor(alliance) }}
                                ></div>
                                <span className="font-medium text-gray-700">{alliance}</span>
                                <span
                                  className={`font-semibold ${
                                    change > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
