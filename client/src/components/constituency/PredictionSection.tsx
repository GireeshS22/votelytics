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
import type { PredictionDetail, Candidate2026 } from '../../types/prediction';

interface PredictionSectionProps {
  prediction: PredictionDetail;
  previousPrediction?: PredictionDetail | null;
  v1Prediction?: PredictionDetail | null;
  v2Prediction?: PredictionDetail | null;
  candidates?: Candidate2026[];
}

/**
 * Get color for an alliance
 */
const getAllianceColor = (alliance: string): string => {
  if (!alliance) return '#9CA3AF';
  if (alliance === 'Toss-up') return '#9CA3AF'; // Gray for toss-ups
  if (alliance.includes('DMK') && !alliance.includes('AIADMK')) return getPartyColor('DMK');
  if (alliance.includes('AIADMK') || alliance.includes('ADMK')) return getPartyColor('AIADMK');
  if (alliance.includes('NTK')) return getPartyColor('NTK');
  if (alliance.includes('TVK')) return getPartyColor('TVK');
  if (alliance.includes('BJP')) return getPartyColor('BJP');
  if (alliance.includes('PMK')) return getPartyColor('PMK');
  return '#808080'; // Gray for others
};

// Alliance display config (keys match the candidates API alliance field)
const ALLIANCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SPA:  { label: 'DMK+',  color: '#C41E3A', bg: '#FEE2E2' },
  NDA:  { label: 'AIADMK+', color: '#FF6B00', bg: '#FFF3E0' },
  TVK:  { label: 'TVK (Vijay)',  color: '#7C3AED', bg: '#EDE9FE' },
  NTK:  { label: 'NTK (Seeman)', color: '#065F46', bg: '#D1FAE5' },
};

const TAG_LABELS: Record<string, string> = {
  safe_seat:           'Safe Seat',
  marginal:            'Marginal',
  toss_up:             'Toss-up',
  urban:               'Urban',
  rural:               'Rural',
  semi_urban:          'Semi-Urban',
  incumbent_advantage: 'Incumbent Advantage',
  anti_incumbency:     'Anti-Incumbency',
  star_candidate:      'Star Candidate',
  weak_candidate:      'Weak Candidate',
  caste_factor:        'Caste Factor',
  minority_factor:     'Minority Factor',
  youth_vote:          'Youth Vote',
  split_vote:          'Split Vote',
  tvk_factor:          'TVK Factor',
  nda_consolidation:   'NDA Consolidation',
};

const TAG_COLORS: Record<string, string> = {
  safe_seat:           'bg-green-100 text-green-800',
  marginal:            'bg-yellow-100 text-yellow-800',
  toss_up:             'bg-gray-100 text-gray-700',
  urban:               'bg-blue-100 text-blue-800',
  rural:               'bg-lime-100 text-lime-800',
  semi_urban:          'bg-cyan-100 text-cyan-800',
  incumbent_advantage: 'bg-emerald-100 text-emerald-800',
  anti_incumbency:     'bg-red-100 text-red-800',
  star_candidate:      'bg-purple-100 text-purple-800',
  weak_candidate:      'bg-orange-100 text-orange-800',
  caste_factor:        'bg-pink-100 text-pink-800',
  minority_factor:     'bg-teal-100 text-teal-800',
  youth_vote:          'bg-indigo-100 text-indigo-800',
  split_vote:          'bg-amber-100 text-amber-800',
  tvk_factor:          'bg-violet-100 text-violet-800',
  nda_consolidation:   'bg-orange-100 text-orange-800',
};

// Normalize V4 alliance names (SPA→DMK+, NDA→AIADMK+) to keep display consistent
const normalizeAllianceName = (a: string): string => {
  if (a === 'SPA') return 'DMK+';
  if (a === 'NDA') return 'AIADMK+';
  return a;
};

function PredictionSection({ prediction, previousPrediction, v1Prediction, v2Prediction, candidates = [] }: PredictionSectionProps) {
  const displayAlliance = normalizeAllianceName(prediction.predicted_winner_alliance);
  const allianceColor = getAllianceColor(displayAlliance);

  // Handle key_factors - array (old data) or long string (V4)
  const keyFactors: string[] = Array.isArray(prediction.key_factors)
    ? prediction.key_factors
    : typeof prediction.key_factors === 'string' && prediction.key_factors
    ? prediction.key_factors.split('\n').map((f: string) => f.trim()).filter((f: string) => f)
    : [];
  // If still a single unsplit block (no \n), keep as one item
  const isLongParagraph = keyFactors.length === 1 && keyFactors[0].length > 200;

  // Get top alliances for vote distribution
  const topAlliances = prediction.top_alliances || [];
  const visualizationTags = prediction.visualization_tags || [];
  const candidateFactor = prediction.candidate_factor;

  // Build candidates map from API or fallback to top_alliances candidate field
  const candidateMap: Record<string, { name: string; party: string }> = {};
  candidates.forEach(c => { candidateMap[c.alliance] = { name: c.name, party: c.party }; });
  // Supplement from top_alliances if candidates API returned empty
  if (Object.keys(candidateMap).length === 0) {
    topAlliances.forEach(a => {
      if (a.candidate) candidateMap[a.alliance] = { name: a.candidate, party: a.party || a.lead_party || '' };
    });
  }

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
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: allianceColor }}
                ></div>
                <span className="text-xs text-gray-600 font-medium">🎯 Predicted Winner</span>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-gray-900">
                    {displayAlliance}
                  </span>
                  {prediction.predicted_winner_name && (
                    <span className="text-sm text-gray-600 font-medium">
                      {prediction.predicted_winner_name}
                    </span>
                  )}
                </div>
                {candidateFactor && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    candidateFactor === 'positive' ? 'bg-green-100 text-green-700' :
                    candidateFactor === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {candidateFactor === 'positive' ? '✓' : candidateFactor === 'negative' ? '✗' : '~'}
                    {candidateFactor === 'positive' ? 'Strong Candidate' :
                     candidateFactor === 'negative' ? 'Weak Candidate' : 'Neutral Candidate'}
                  </span>
                )}
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

          {/* Visualization Tags */}
          {visualizationTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {visualizationTags.map((tag) => (
                <span
                  key={tag}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-700'}`}
                >
                  {TAG_LABELS[tag] || tag}
                </span>
              ))}
            </div>
          )}

          {/* 2026 Candidates Card */}
          {Object.keys(candidateMap).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🗳️</span>
                2026 Candidates
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['SPA', 'NDA', 'TVK', 'NTK'] as const).map((alliance) => {
                  const cfg = ALLIANCE_CONFIG[alliance];
                  const cand = candidateMap[alliance];
                  const isWinner = prediction.predicted_winner_alliance === alliance;
                  const voteShare = topAlliances.find((a) => a.alliance === alliance)?.vote_share;
                  return (
                    <div
                      key={alliance}
                      className={`rounded-xl p-3 border-2 transition-all ${isWinner ? 'shadow-md' : 'border-gray-100'}`}
                      style={{
                        backgroundColor: cfg?.bg || '#F9FAFB',
                        borderColor: isWinner ? cfg?.color || '#6B7280' : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: cfg?.color || '#6B7280' }}
                        >
                          {cfg?.label || alliance}
                        </span>
                        {isWinner && <span className="text-xs">🏆</span>}
                      </div>
                      {cand ? (
                        <>
                          <p className="text-sm font-semibold text-gray-900 mt-1 leading-tight">{cand.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{cand.party}</p>
                          {voteShare !== undefined && (
                            <p className="text-xs font-semibold mt-1" style={{ color: cfg?.color || '#6B7280' }}>
                              {voteShare.toFixed(1)}%
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 mt-1">TBD</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vote Share Trend Chart */}
          {topAlliances.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📈</span>
                Vote Share Trend
              </h3>
              {(() => {
                // Normalize V4 alliance names (SPA→DMK+, NDA→AIADMK+) to keep display consistent
                const normalizeAlliance = (a: string) => {
                  if (!a) return a;
                  if (a === 'SPA' || a === 'DMK Alliance') return 'DMK+';
                  if (a === 'NDA' || a === 'AIADMK Alliance' || a === 'NDA Alliance') return 'AIADMK+';
                  return a;
                };

                // Build chart data from all 4 versions
                const allAlliances = new Set<string>();
                topAlliances.forEach((a) => a.alliance && allAlliances.add(normalizeAlliance(a.alliance)));
                previousPrediction?.top_alliances?.forEach((a) => a.alliance && allAlliances.add(normalizeAlliance(a.alliance)));
                v2Prediction?.top_alliances?.forEach((a) => a.alliance && allAlliances.add(normalizeAlliance(a.alliance)));
                v1Prediction?.top_alliances?.forEach((a) => a.alliance && allAlliances.add(normalizeAlliance(a.alliance)));

                const chartData: Array<{ version: string; [key: string]: number | string }> = [];

                // V1 — November 2025
                if (v1Prediction?.top_alliances?.length) {
                  const pt: { version: string; [key: string]: number | string } = { version: 'V1 — Nov 2025' };
                  v1Prediction.top_alliances.forEach((a) => { if (a.alliance) pt[normalizeAlliance(a.alliance)] = a.vote_share; });
                  chartData.push(pt);
                }

                // V2 — January 2026
                if (v2Prediction?.top_alliances?.length) {
                  const pt: { version: string; [key: string]: number | string } = { version: 'V2 — Jan 2026' };
                  v2Prediction.top_alliances.forEach((a) => { if (a.alliance) pt[normalizeAlliance(a.alliance)] = a.vote_share; });
                  chartData.push(pt);
                }

                // V3 — March 2026 (previousPrediction when V4 is latest)
                if (previousPrediction?.top_alliances?.length) {
                  const pt: { version: string; [key: string]: number | string } = { version: 'V3 — Mar 2026' };
                  previousPrediction.top_alliances.forEach((a) => { if (a.alliance) pt[normalizeAlliance(a.alliance)] = a.vote_share; });
                  chartData.push(pt);
                }

                // V4 — April 2026 (current)
                const pt: { version: string; [key: string]: number | string } = { version: 'V4 — Apr 2026' };
                topAlliances.forEach((a) => { if (a.alliance) pt[normalizeAlliance(a.alliance)] = a.vote_share; });
                chartData.push(pt);

                // Get alliance list sorted by current vote share (using normalized names)
                const allianceList = Array.from(allAlliances).sort((a, b) => {
                  const aShare = topAlliances.find((x) => normalizeAlliance(x.alliance) === a)?.vote_share || 0;
                  const bShare = topAlliances.find((x) => normalizeAlliance(x.alliance) === b)?.vote_share || 0;
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
                          formatter={(value: number, name: string) => {
                            const cand = candidateMap[name];
                            return [
                              `${value.toFixed(1)}%${cand ? ` — ${cand.name}` : ''}`,
                              name,
                            ];
                          }}
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

                    {/* Trend Summary below chart — V1 vs V4 */}
                    {v1Prediction && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-4 justify-center">
                          {allianceList.map((alliance) => {
                            const current = topAlliances.find((a) => normalizeAlliance(a.alliance) === alliance)?.vote_share;
                            const prev = v1Prediction.top_alliances?.find((a) => normalizeAlliance(a.alliance) === alliance)?.vote_share;
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
              {isLongParagraph ? (
                <p className="text-gray-700 leading-relaxed text-sm">{keyFactors[0]}</p>
              ) : (
                <ul className="space-y-3">
                  {keyFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                      <span className="text-gray-700 leading-relaxed text-sm">{factor}</span>
                    </li>
                  ))}
                </ul>
              )}
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
