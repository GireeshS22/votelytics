/**
 * ConstituencyInfographic — dedicated 1080x1080 page for screenshot
 * Accessed via /infographic/:slug (no header/footer)
 * Designed to be screenshotted by Playwright at exactly 1080x1080
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { constituenciesAPI, predictionsAPI } from '../services/api';
import type { PredictionDetail, Candidate2026 } from '../types/prediction';
import type { Constituency } from '../types/constituency';

const ALLIANCE_COLORS: Record<string, { primary: string; light: string; text: string }> = {
  SPA:    { primary: '#C41E3A', light: '#FEE2E2', text: '#7F1D1D' },
  NDA:    { primary: '#D97706', light: '#FEF3C7', text: '#78350F' },
  TVK:    { primary: '#7C3AED', light: '#EDE9FE', text: '#4C1D95' },
  NTK:    { primary: '#059669', light: '#D1FAE5', text: '#064E3B' },
  'Toss-up': { primary: '#6B7280', light: '#F3F4F6', text: '#1F2937' },
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

function ConfidenceBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Safe:    'bg-green-500 text-white',
    Likely:  'bg-blue-500 text-white',
    Lean:    'bg-yellow-500 text-white',
    'Toss-up': 'bg-gray-500 text-white',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-bold tracking-wide ${map[level] || 'bg-gray-500 text-white'}`}>
      {level.toUpperCase()}
    </span>
  );
}

function VoteBar({ alliance, voteShare, candidate, party, maxShare }: {
  alliance: string; voteShare: number; candidate?: string; party?: string; maxShare: number;
}) {
  const cfg = ALLIANCE_COLORS[alliance] || ALLIANCE_COLORS['Toss-up'];
  const pct = Math.round((voteShare / maxShare) * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white"
            style={{ backgroundColor: cfg.primary }}
          >
            {alliance}
          </span>
          <span className="text-sm font-semibold text-gray-800">{candidate || party || ''}</span>
        </div>
        <span className="text-base font-bold text-gray-900">{voteShare.toFixed(1)}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: cfg.primary }}
        />
      </div>
    </div>
  );
}

export default function ConstituencyInfographic() {
  const { slug } = useParams<{ slug: string }>();
  const [constituency, setConstituency] = useState<Constituency | null>(null);
  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
  const [candidates, setCandidates] = useState<Candidate2026[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const c = await constituenciesAPI.getBySlug(slug);
        setConstituency(c);
        const [predData, cands] = await Promise.all([
          predictionsAPI.getByConstituency(c.id, 2026, false),
          constituenciesAPI.getCandidates(c.id),
        ]);
        setPrediction(predData.prediction);
        setCandidates(cands);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading || !constituency || !prediction) {
    return (
      <div
        id="infographic"
        data-status="loading"
        className="flex items-center justify-center bg-gray-900 text-white"
        style={{ width: 1080, height: 1080 }}
      >
        <div className="text-2xl font-bold">{loading ? 'Loading...' : 'No data found'}</div>
      </div>
    );
  }

  const winnerAlliance = prediction.predicted_winner_alliance;
  const cfg = ALLIANCE_COLORS[winnerAlliance] || ALLIANCE_COLORS['Toss-up'];
  const topAlliances = prediction.top_alliances || [];
  const maxShare = Math.max(...topAlliances.map(a => a.vote_share), 1);
  const tags = (prediction.visualization_tags || []).slice(0, 5);

  // Build candidate map
  const candMap: Record<string, string> = {};
  candidates.forEach(c => { candMap[c.alliance] = c.name; });
  topAlliances.forEach(a => { if (a.candidate && !candMap[a.alliance]) candMap[a.alliance] = a.candidate; });

  return (
    <div
      id="infographic"
      data-status="ready"
      style={{ width: 1080, height: 1080, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
      className="relative overflow-hidden flex flex-col"
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 40%, #0F172A 100%)',
        }}
      />

      {/* Accent glow behind winner color */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: cfg.primary }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: cfg.primary }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-12">

        {/* Top bar — branding + AC number */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
              style={{ backgroundColor: cfg.primary }}
            >V</div>
            <span className="text-white font-bold text-xl tracking-wide">VOTELYTICS</span>
          </div>
          <div className="text-right">
            <span className="text-gray-400 text-sm">2026 Tamil Nadu Election</span>
            <div className="text-white font-bold text-lg">AC #{constituency.ac_number}</div>
          </div>
        </div>

        {/* Constituency name */}
        <div className="mb-8">
          <h1 className="text-white font-black leading-none mb-2"
            style={{ fontSize: constituency.name.length > 20 ? 52 : 64 }}>
            {constituency.name}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xl">{constituency.district} District</span>
            {constituency.region && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 text-xl">{constituency.region} Tamil Nadu</span>
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-8" style={{ background: `linear-gradient(90deg, ${cfg.primary}, transparent)` }} />

        {/* Winner section */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{
            background: `linear-gradient(135deg, ${cfg.primary}25, ${cfg.primary}10)`,
            border: `1px solid ${cfg.primary}40`,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-widest">Predicted Winner</div>
              <div className="text-white font-black mb-1" style={{ fontSize: 40 }}>
                {winnerAlliance}
              </div>
              {prediction.predicted_winner_name && (
                <div className="font-semibold mb-3" style={{ color: cfg.primary, fontSize: 22 }}>
                  {prediction.predicted_winner_name}
                </div>
              )}
              <div className="flex items-center gap-3">
                <ConfidenceBadge level={prediction.confidence_level} />
                <span className="text-gray-300 text-sm">
                  {prediction.predicted_vote_share.toFixed(1)}% vote share
                </span>
                <span className="text-gray-300 text-sm">
                  +{prediction.predicted_margin_pct.toFixed(1)}% margin
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm mb-1">Win Probability</div>
              <div className="font-black text-white" style={{ fontSize: 52, color: cfg.primary }}>
                {Math.round((prediction.win_probability || 0) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Vote share bars */}
        <div className="mb-8 flex-1">
          <div className="text-gray-400 text-sm font-medium mb-4 uppercase tracking-widest">Alliance Vote Share</div>
          {topAlliances.slice(0, 4).map((a) => (
            <VoteBar
              key={a.alliance}
              alliance={a.alliance}
              voteShare={a.vote_share}
              candidate={candMap[a.alliance]}
              party={a.party || a.lead_party}
              maxShare={maxShare}
            />
          ))}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${cfg.primary}25`, color: cfg.primary, border: `1px solid ${cfg.primary}40` }}
              >
                {TAG_LABELS[tag] || tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <span className="text-gray-500 text-sm">votelytics.in/constituency/{slug}</span>
          <span className="text-gray-500 text-sm">AI-powered prediction • April 2026</span>
        </div>
      </div>
    </div>
  );
}
