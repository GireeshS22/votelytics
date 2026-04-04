/**
 * PredictionArticle — Deep-dive analysis of the V4 prediction results
 * Route: /predictions/analysis
 */
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter,
} from 'recharts';
import { Link } from 'react-router-dom';
import { predictionsAPI } from '../services/api';

/* ── Alliance colour map ── */
const COLORS: Record<string, string> = {
  'DMK+': '#E11D48',
  'AIADMK+': '#16A34A',
  'TVK': '#8B4513',
  'NTK': '#7C3AED',
  'Others': '#6B7280',
};

const allianceColor = (a: string) => COLORS[a] || COLORS.Others;

/* ── Normalize SPA/NDA everywhere ── */
const norm = (a: string): string => {
  if (a === 'SPA' || a === 'DMK Alliance') return 'DMK+';
  if (a === 'NDA' || a === 'AIADMK Alliance' || a === 'NDA Alliance') return 'AIADMK+';
  return a;
};

/** Normalise all alliance keys inside an object */
function normKeys<T>(obj: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[norm(k)] = v;
  }
  return out;
}

/* ── Shared section wrapper ── */
function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
      {children}
    </h2>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-1 w-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full" />
      <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full" />
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-700 leading-relaxed text-base mb-6 max-w-3xl">{children}</p>;
}

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-medium">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────── Main Component ─────────────────────────── */

export default function PredictionArticle() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await predictionsAPI.getArticleData();
        setData(d);
      } catch (e: any) {
        setError(e?.message || 'Failed to load article data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <div className="text-xl font-semibold text-gray-700">Loading analysis...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-xl font-semibold text-red-600 mb-2">Error</div>
          <div className="text-gray-600">{error || 'No data'}</div>
        </div>
      </div>
    );
  }

  /* ── Normalise raw data ── */
  const seatCounts = normKeys(data.seat_counts) as Record<string, { safe: number; likely: number; lean: number; tossup: number; total: number }>;
  const avgVoteShares = normKeys(data.avg_vote_shares) as Record<string, number>;
  const partyAverages = data.party_averages as Record<string, { avg_vote_share: number; alliance: string; seats_contested: number }>;
  const districtBreakdown = data.district_breakdown as Record<string, Record<string, number>>;
  const marginBuckets = data.margin_buckets as Record<string, number>;
  const tossupSeats = (data.tossup_seats as any[]).map(s => ({ ...s, alliance: norm(s.alliance) }));
  const tvkTop10 = (data.tvk_top_10 as any[]).map(s => ({ ...s, alliance: norm(s.alliance) }));
  const bjpSeats = (data.bjp_seats as any[]).map(s => ({ ...s, alliance: norm(s.alliance) }));
  const bjpVsInc = data.bjp_vs_inc as any[];
  const bjpVsDmk = data.bjp_vs_dmk as any[];
  const dmkVsAdmk = (data.dmk_vs_admk as any[]).map(s => ({ ...s, winner: norm(s.winner) }));

  const dmkSeats = seatCounts['DMK+']?.total || 0;
  const admkSeats = seatCounts['AIADMK+']?.total || 0;
  const tvkTotal = seatCounts['TVK']?.total || 0;
  const ntkTotal = seatCounts['NTK']?.total || 0;

  /* ── Chart data builders ── */

  // Stacked bar for seat counts by confidence
  const seatStackData = Object.entries(seatCounts)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([alliance, counts]) => ({
      alliance,
      Safe: counts.safe,
      Likely: counts.likely,
      Lean: counts.lean,
      'Toss-up': counts.tossup,
      total: counts.total,
    }));

  // Donut chart for vote shares
  const voteDonut = Object.entries(avgVoteShares)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([alliance, share]) => ({ name: norm(alliance), value: share }));

  // Party breakdown table rows
  const partyRows = Object.entries(partyAverages)
    .sort((a, b) => b[1].avg_vote_share - a[1].avg_vote_share)
    .map(([party, info]) => ({ party, ...info, alliance: norm(info.alliance) }));

  // District table
  const allAlliances = Object.keys(seatCounts).sort((a, b) => (seatCounts[b]?.total || 0) - (seatCounts[a]?.total || 0));
  const districtRows = Object.entries(districtBreakdown)
    .map(([district, counts]) => {
      const normCounts = normKeys(counts);
      return { district, ...normCounts, total: Object.values(normCounts).reduce((s, v) => s + v, 0) };
    })
    .sort((a, b) => b.total - a.total);

  // Margin distribution
  const marginData = Object.entries(marginBuckets).map(([bucket, count]) => ({ bucket, count }));

  // Toss-up scatter — win_probability is stored as decimal (0–1), convert to %
  const tossupScatter = tossupSeats.map(s => ({
    name: s.name,
    margin: Math.abs(s.predicted_margin_pct),
    probability: s.win_probability <= 1 ? s.win_probability * 100 : s.win_probability,
    alliance: s.alliance,
  }));

  // TVK bar chart
  const tvkBarData = tvkTop10.map(s => ({
    name: s.name.length > 18 ? s.name.substring(0, 18) + '...' : s.name,
    fullName: s.name,
    voteShare: s.tvk_vote_share,
    winner: s.alliance,
  }));

  // BJP bar chart
  const bjpBarData = bjpSeats.map(s => {
    const nda = s.top_alliances?.find((a: any) => norm(a.alliance || a.party) === 'AIADMK+' || a.alliance === 'NDA');
    const spa = s.top_alliances?.find((a: any) => norm(a.alliance || a.party) === 'DMK+' || a.alliance === 'SPA');
    return {
      name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
      fullName: s.name,
      'AIADMK+': nda?.vote_share || 0,
      'DMK+': spa?.vote_share || 0,
      winner: s.alliance,
    };
  });

  // DMK vs ADMK margin histogram
  const marginHistData = dmkVsAdmk.map(s => ({
    name: s.name.length > 12 ? s.name.substring(0, 12) + '..' : s.name,
    fullName: s.name,
    diff: s.diff,
    fill: s.diff > 0 ? COLORS['DMK+'] : COLORS['AIADMK+'],
  }));
  // Take top 30 by absolute diff for readability
  const topMarginHist = [...marginHistData].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 30);

  // TVK spoiler seats: TVK vote share > |DMK+ - AIADMK+| margin, TVK is not the winner
  const tvkSpoilerSeats = (data.all_predictions as any[])
    .map(s => {
      const ta = s.top_alliances || [];
      const getSh = (key: string) =>
        ta.find((a: any) => {
          const n = norm(a.alliance || a.party || '');
          return n === key;
        })?.vote_share || 0;
      const dmkSh = getSh('DMK+');
      const admkSh = getSh('AIADMK+');
      const tvkSh = getSh('TVK');
      const drawnMargin = Math.abs(dmkSh - admkSh);
      const spoilerEffect = tvkSh - drawnMargin; // positive = TVK votes exceed the margin
      const winner = norm(s.alliance);
      return {
        ac_number: s.ac_number,
        name: s.name,
        district: s.district,
        winner,
        dmkSh,
        admkSh,
        tvkSh,
        drawnMargin,
        spoilerEffect,
        // Which party TVK hurts most: TVK voters ideologically closer to DMK+
        likelyHurts: dmkSh > admkSh ? 'DMK+' : 'AIADMK+',
      };
    })
    .filter(s => s.tvkSh > 0 && s.spoilerEffect > 0 && s.winner !== 'TVK')
    .sort((a, b) => b.spoilerEffect - a.spoilerEffect)
    .slice(0, 10);

  /* ── Table of Contents ── */
  const toc = [
    { id: 'verdict', label: 'Overall Verdict' },
    { id: 'vote-share', label: 'Alliance Vote Share' },
    { id: 'party-breakdown', label: 'Party-wise Performance' },
    { id: 'regional', label: 'Regional Breakdown' },
    { id: 'battlegrounds', label: 'Top Battlegrounds' },
    { id: 'tvk', label: 'TVK\'s Best Chances' },
    { id: 'bjp', label: 'BJP Performance' },
    { id: 'head-to-head', label: 'DMK+ vs AIADMK+' },
    { id: 'tvk-spoiler', label: 'TVK Spoiler Effect' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
          <div className="text-sm font-medium text-blue-200 mb-3 uppercase tracking-wide">
            V{data.version} Prediction Analysis
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Tamil Nadu 2026 Election Prediction
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-6">
            A data-driven deep dive into {data.total_seats} constituency predictions — who's leading,
            where the battles are tightest, and what the numbers really say.
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-blue-200">DMK+</span>
              <span className="ml-2 text-xl font-bold">{dmkSeats}</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-blue-200">AIADMK+</span>
              <span className="ml-2 text-xl font-bold">{admkSeats}</span>
            </div>
            {tvkTotal > 0 && (
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                <span className="text-blue-200">TVK</span>
                <span className="ml-2 text-xl font-bold">{tvkTotal}</span>
              </div>
            )}
            {ntkTotal > 0 && (
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                <span className="text-blue-200">NTK</span>
                <span className="ml-2 text-xl font-bold">{ntkTotal}</span>
              </div>
            )}
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-blue-200">Toss-ups</span>
              <span className="ml-2 text-xl font-bold">{tossupSeats.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table of Contents (sticky on desktop) ── */}
      <div className="sticky top-[64px] z-40 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 max-w-5xl overflow-x-auto">
          <nav className="flex gap-1 py-2 text-sm">
            {toc.map(t => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="px-3 py-1.5 rounded-full whitespace-nowrap text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">

        {/* ──────────── 1. OVERALL VERDICT ──────────── */}
        <Section id="verdict">
          <SectionTitle>The Big Picture</SectionTitle>
          <Divider />
          <Prose>
            Our V{data.version} model predicts <strong>DMK+ to win {dmkSeats} seats</strong> vs <strong>AIADMK+'s {admkSeats}</strong> out
            of {data.total_seats} constituencies. {tossupSeats.length > 0 && <>A significant <strong>{tossupSeats.length} seats remain
            toss-ups</strong> — these razor-thin margins could swing the final tally either way on election day.</>}
            {tvkTotal > 0 && <> Thalapathy Vijay's TVK is projected to pick up <strong>{tvkTotal} seat{tvkTotal !== 1 ? 's' : ''}</strong>,
            making its debut a notable one.</>}
          </Prose>

          {/* Stacked bar chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seats by Confidence Level</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={seatStackData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="alliance" width={80} tick={{ fontSize: 13 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="Safe" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Likely" stackId="a" fill="#65A30D" />
                <Bar dataKey="Lean" stackId="a" fill="#F59E0B" />
                <Bar dataKey="Toss-up" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Margin distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Victory Margin Distribution</h3>
            <Prose>
              How close are these races? The distribution below shows the spread of predicted victory margins across all {data.total_seats} seats.
              Tight margins (&lt;5%) dominate, signaling a highly competitive election.
            </Prose>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={marginData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} name="Constituencies" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ──────────── 2. ALLIANCE VOTE SHARE ──────────── */}
        <Section id="vote-share">
          <SectionTitle>Alliance-wise Vote Share</SectionTitle>
          <Divider />
          <Prose>
            Beyond seat counts, vote share tells the real story of each alliance's statewide support.
            Even a small swing in vote share can flip dozens of seats in Tamil Nadu's multi-cornered contests.
          </Prose>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Donut chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Average Vote Share</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={voteDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }: any) => `${name} ${(value as number).toFixed(1)}%`}
                  >
                    {voteDonut.map((entry) => (
                      <Cell key={entry.name} fill={allianceColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Summary cards */}
            <div className="space-y-4">
              {Object.entries(avgVoteShares)
                .sort((a, b) => b[1] - a[1])
                .map(([alliance, share]) => {
                  const a = norm(alliance);
                  return (
                    <div key={a} className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
                      <div
                        className="w-3 h-12 rounded-full"
                        style={{ backgroundColor: allianceColor(a) }}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{a}</div>
                        <div className="text-sm text-gray-500">{seatCounts[a]?.total || 0} seats predicted</div>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: allianceColor(a) }}>
                        {share.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Section>

        {/* ──────────── 3. PARTY BREAKDOWN ──────────── */}
        <Section id="party-breakdown">
          <SectionTitle>Party-wise Performance</SectionTitle>
          <Divider />
          <Prose>
            Tamil Nadu's alliances are made up of many parties, each with its own voter base. Here's how
            the individual parties within each alliance stack up by average predicted vote share.
          </Prose>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Party</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Alliance</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Avg Vote Share</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Seats Contested</th>
                  </tr>
                </thead>
                <tbody>
                  {partyRows.map(row => (
                    <tr key={row.party} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.party}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: allianceColor(row.alliance) }}
                        >
                          {row.alliance}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{row.avg_vote_share.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right text-gray-500">{row.seats_contested}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ──────────── 4. REGIONAL BREAKDOWN ──────────── */}
        <Section id="regional">
          <SectionTitle>Regional Breakdown by District</SectionTitle>
          <Divider />
          <Prose>
            Elections in Tamil Nadu play out differently across its diverse regions. The western
            districts, delta belt, and southern coast each have distinct political dynamics — here's
            the district-level seat split.
          </Prose>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">District</th>
                    {allAlliances.map(a => (
                      <th key={a} className="text-center px-3 py-3 font-semibold" style={{ color: allianceColor(a) }}>
                        {a}
                      </th>
                    ))}
                    <th className="text-center px-3 py-3 font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {districtRows.map(row => (
                    <tr key={row.district} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{row.district}</td>
                      {allAlliances.map(a => {
                        const v = (row as any)[a] || 0;
                        return (
                          <td key={a} className="text-center px-3 py-2.5">
                            {v > 0 ? (
                              <span className="inline-block min-w-[24px] px-1.5 py-0.5 rounded-md text-xs font-bold text-white"
                                style={{ backgroundColor: allianceColor(a) }}>
                                {v}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center px-3 py-2.5 font-semibold text-gray-700">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ──────────── 5. TOP BATTLEGROUNDS ──────────── */}
        <Section id="battlegrounds">
          <SectionTitle>Top Battlegrounds — {tossupSeats.length} Toss-up Seats</SectionTitle>
          <Divider />
          <Prose>
            These are the seats where no alliance has a clear edge. With win probabilities hovering near 50%
            and margins under 2.5%, these constituencies will be decided by ground-level turnout, last-mile
            campaigning, and perhaps a bit of luck.
          </Prose>

          {tossupScatter.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Toss-up Scatter: Margin vs Probability</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="margin" name="Margin %" unit="%" tick={{ fontSize: 12 }} />
                  <YAxis type="number" dataKey="probability" name="Win Prob %" unit="%" domain={[30, 60]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border shadow-lg rounded-lg px-4 py-3 text-sm">
                          <p className="font-semibold">{d.name}</p>
                          <p>Margin: {d.margin.toFixed(1)}%</p>
                          <p>Win Prob: {d.probability.toFixed(1)}%</p>
                          <p style={{ color: allianceColor(d.alliance) }}>{d.alliance}</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={tossupScatter} fill="#EF4444">
                    {tossupScatter.map((entry, i) => (
                      <Cell key={i} fill={allianceColor(entry.alliance)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Toss-up table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Constituency</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">District</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Leading</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Win Prob</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {tossupSeats
                    .sort((a, b) => Math.abs(a.predicted_margin_pct) - Math.abs(b.predicted_margin_pct))
                    .map((s) => (
                    <tr key={s.ac_number} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400">{s.ac_number}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{s.district}</td>
                      <td className="text-center px-4 py-2.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: allianceColor(s.alliance) }}>
                          {s.alliance}
                        </span>
                      </td>
                      <td className="text-right px-4 py-2.5 font-medium">
                        {s.win_probability != null
                          ? (s.win_probability <= 1 ? s.win_probability * 100 : s.win_probability).toFixed(1)
                          : '-'}%
                      </td>
                      <td className="text-right px-4 py-2.5 font-medium text-red-600">{Math.abs(s.predicted_margin_pct).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ──────────── 6. TVK TOP 10 ──────────── */}
        <Section id="tvk">
          <SectionTitle>TVK's Best 10 Chances</SectionTitle>
          <Divider />
          <Prose>
            Thalapathy Vijay's Tamizhaga Vetri Kazhagam (TVK) is making its electoral debut in 2026.
            While the party is predicted to win {tvkTotal} seat{tvkTotal !== 1 ? 's' : ''}, these are the 10 constituencies
            where TVK is polling its highest vote share — a sign of where the star power translates
            most into voter support.
          </Prose>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={tvkBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border shadow-lg rounded-lg px-4 py-3 text-sm">
                        <p className="font-semibold">{d.fullName}</p>
                        <p>TVK Vote Share: <strong>{d.voteShare.toFixed(1)}%</strong></p>
                        <p style={{ color: allianceColor(d.winner) }}>Predicted Winner: {d.winner}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="voteShare" fill={COLORS.TVK} radius={[0, 6, 6, 0]} name="TVK Vote Share %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Constituency</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">District</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">TVK Share</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Predicted Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {tvkTop10.map((s, i) => (
                    <tr key={s.ac_number} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{s.district}</td>
                      <td className="text-right px-4 py-2.5 font-bold" style={{ color: COLORS.TVK }}>
                        {s.tvk_vote_share.toFixed(1)}%
                      </td>
                      <td className="text-center px-4 py-2.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: allianceColor(s.alliance) }}>
                          {s.alliance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ──────────── 7. BJP PERFORMANCE ──────────── */}
        <Section id="bjp">
          <SectionTitle>BJP's {bjpSeats.length}-Seat Performance</SectionTitle>
          <Divider />
          <Prose>
            The BJP is contesting {bjpSeats.length} seats as part of the AIADMK+ alliance. In a state
            historically dominated by Dravidian parties, every seat the BJP contests is closely watched.
            Here's how the saffron party fares against its direct opponents.
          </Prose>

          {bjpBarData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">BJP Seats: AIADMK+ vs DMK+ Vote Share</h3>
              <ResponsiveContainer width="100%" height={Math.max(300, bjpBarData.length * 28)}>
                <BarChart data={bjpBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit="%" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border shadow-lg rounded-lg px-4 py-3 text-sm">
                          <p className="font-semibold">{d.fullName}</p>
                          <p style={{ color: COLORS['AIADMK+'] }}>AIADMK+ (BJP): {d['AIADMK+'].toFixed(1)}%</p>
                          <p style={{ color: COLORS['DMK+'] }}>DMK+: {d['DMK+'].toFixed(1)}%</p>
                          <p className="mt-1" style={{ color: allianceColor(d.winner) }}>Winner: {d.winner}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="AIADMK+" fill={COLORS['AIADMK+']} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="DMK+" fill={COLORS['DMK+']} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* BJP vs INC subsection */}
          {bjpVsInc.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-3">BJP vs INC — Direct Face-offs</h3>
              <Prose>
                In {bjpVsInc.length} constituency{bjpVsInc.length !== 1 ? 'ies' : ''}, BJP and INC
                go head-to-head as the alliance candidates. These are the seats where the national
                rivalry plays out on Tamil Nadu soil.
              </Prose>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-orange-50 border-b border-orange-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Constituency</th>
                        <th className="text-left px-4 py-3 font-semibold text-orange-700">BJP Candidate</th>
                        <th className="text-right px-4 py-3 font-semibold text-orange-700">BJP %</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-600">INC Candidate</th>
                        <th className="text-right px-4 py-3 font-semibold text-blue-600">INC %</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Winner</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bjpVsInc.map(r => (
                        <tr key={r.ac_number} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{r.name}</td>
                          <td className="px-4 py-2.5 text-gray-700">{r.bjp_candidate || '-'}</td>
                          <td className="text-right px-4 py-2.5 font-bold text-orange-600">{r.bjp_share?.toFixed(1) || '-'}%</td>
                          <td className="px-4 py-2.5 text-gray-700">{r.inc_candidate || '-'}</td>
                          <td className="text-right px-4 py-2.5 font-bold text-blue-600">{r.inc_share?.toFixed(1) || '-'}%</td>
                          <td className="text-center px-4 py-2.5">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: allianceColor(norm(r.winner)) }}>
                              {norm(r.winner)}
                            </span>
                          </td>
                          <td className="text-right px-4 py-2.5 font-medium">{Math.abs(r.margin).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BJP vs DMK subsection */}
          {bjpVsDmk.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">BJP vs DMK+ — All BJP Seats</h3>
              <Prose>
                Across all {bjpVsDmk.length} BJP-contested seats, here's the face-off against the DMK+ alliance candidate.
              </Prose>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-orange-50 border-b border-orange-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Constituency</th>
                        <th className="text-left px-4 py-3 font-semibold text-orange-700">BJP</th>
                        <th className="text-right px-4 py-3 font-semibold text-orange-700">BJP %</th>
                        <th className="text-left px-4 py-3 font-semibold" style={{ color: COLORS['DMK+'] }}>DMK+ ({'>'}party)</th>
                        <th className="text-right px-4 py-3 font-semibold" style={{ color: COLORS['DMK+'] }}>DMK+ %</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Winner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bjpVsDmk.map(r => (
                        <tr key={r.ac_number} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{r.name}</td>
                          <td className="px-4 py-2.5 text-gray-700">{r.bjp_candidate || '-'}</td>
                          <td className="text-right px-4 py-2.5 font-bold text-orange-600">{r.bjp_share?.toFixed(1) || '-'}%</td>
                          <td className="px-4 py-2.5 text-gray-700">{r.dmk_candidate || '-'} <span className="text-xs text-gray-400">({r.spa_party})</span></td>
                          <td className="text-right px-4 py-2.5 font-bold" style={{ color: COLORS['DMK+'] }}>{r.dmk_share?.toFixed(1) || '-'}%</td>
                          <td className="text-center px-4 py-2.5">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: allianceColor(norm(r.winner)) }}>
                              {norm(r.winner)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* ──────────── 8. DMK+ vs AIADMK+ HEAD-TO-HEAD ──────────── */}
        <Section id="head-to-head">
          <SectionTitle>DMK+ vs AIADMK+ — Head to Head</SectionTitle>
          <Divider />
          <Prose>
            The grand Dravidian rivalry remains the backbone of Tamil Nadu politics. This chart shows the
            vote share differential (DMK+ minus AIADMK+) for the top 30 most decisive seats — red bars
            lean DMK+, green bars lean AIADMK+.
          </Prose>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 30 Seats by Margin Differential</h3>
            <ResponsiveContainer width="100%" height={600}>
              <BarChart data={topMarginHist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border shadow-lg rounded-lg px-4 py-3 text-sm">
                        <p className="font-semibold">{d.fullName}</p>
                        <p>DMK+ - AIADMK+: <strong>{d.diff > 0 ? '+' : ''}{d.diff.toFixed(1)}%</strong></p>
                        <p style={{ color: d.diff > 0 ? COLORS['DMK+'] : COLORS['AIADMK+'] }}>
                          {d.diff > 0 ? 'DMK+ leads' : 'AIADMK+ leads'}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="diff" name="DMK+ - AIADMK+">
                  {topMarginHist.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS['DMK+'] }} />
                <span>DMK+ leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS['AIADMK+'] }} />
                <span>AIADMK+ leads</span>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'DMK+ Safe', value: seatCounts['DMK+']?.safe || 0, color: COLORS['DMK+'] },
              { label: 'AIADMK+ Safe', value: seatCounts['AIADMK+']?.safe || 0, color: COLORS['AIADMK+'] },
              { label: 'DMK+ Likely', value: seatCounts['DMK+']?.likely || 0, color: COLORS['DMK+'] },
              { label: 'AIADMK+ Likely', value: seatCounts['AIADMK+']?.likely || 0, color: COLORS['AIADMK+'] },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ──────────── 9. TVK SPOILER EFFECT ──────────── */}
        <Section id="tvk-spoiler">
          <SectionTitle>TVK's Spoiler Effect — Top 10</SectionTitle>
          <Divider />
          <Prose>
            TVK's entry into the 2026 race isn't just about the seats it wins — it's about the
            votes it pulls away from established parties. In these constituencies, TVK's predicted
            vote share <em>exceeds</em> the margin between DMK+ and AIADMK+. If TVK weren't in the
            race, the result could easily have flipped. These are the seats where Vijay's party
            plays kingmaker — whether it intends to or not.
          </Prose>

          {tvkSpoilerSeats.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center text-yellow-700">
              No significant spoiler seats found in this prediction set.
            </div>
          ) : (
            <>
              {/* Spoiler bar chart */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  TVK Share vs DMK+/AIADMK+ Margin
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  TVK vote share (brown) alongside the gap between the top two alliances (gray). When brown exceeds gray, TVK is the spoiler.
                </p>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={tvkSpoilerSeats.map(s => ({
                      name: s.name.length > 16 ? s.name.substring(0, 16) + '…' : s.name,
                      fullName: s.name,
                      'TVK Share': s.tvkSh,
                      'Top-2 Margin': s.drawnMargin,
                      winner: s.winner,
                      likelyHurts: s.likelyHurts,
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" unit="%" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border shadow-lg rounded-lg px-4 py-3 text-sm">
                            <p className="font-semibold mb-1">{d.fullName}</p>
                            <p style={{ color: COLORS.TVK }}>TVK Share: <strong>{d['TVK Share'].toFixed(1)}%</strong></p>
                            <p className="text-gray-600">Winning Margin: <strong>{d['Top-2 Margin'].toFixed(1)}%</strong></p>
                            <p className="mt-1" style={{ color: allianceColor(d.winner) }}>Winner: {d.winner}</p>
                            <p className="text-gray-500 text-xs mt-1">Likely hurts: {d.likelyHurts}</p>
                          </div>
                        );
                      }}
                    />
                    <Legend />
                    <Bar dataKey="TVK Share" fill={COLORS.TVK} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Top-2 Margin" fill="#D1D5DB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Spoiler table */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-amber-50 border-b border-amber-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Constituency</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">District</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">DMK+</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">AIADMK+</th>
                        <th className="text-right px-4 py-3 font-semibold" style={{ color: COLORS.TVK }}>TVK</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Margin</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Winner</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-500">Hurts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tvkSpoilerSeats.map(s => (
                        <tr key={s.ac_number} className="border-b border-gray-100 hover:bg-amber-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                          <td className="px-4 py-2.5 text-gray-500">{s.district}</td>
                          <td className="text-right px-4 py-2.5 font-semibold" style={{ color: COLORS['DMK+'] }}>
                            {s.dmkSh.toFixed(1)}%
                          </td>
                          <td className="text-right px-4 py-2.5 font-semibold" style={{ color: COLORS['AIADMK+'] }}>
                            {s.admkSh.toFixed(1)}%
                          </td>
                          <td className="text-right px-4 py-2.5 font-bold" style={{ color: COLORS.TVK }}>
                            {s.tvkSh.toFixed(1)}%
                          </td>
                          <td className="text-right px-4 py-2.5 text-gray-600">
                            {s.drawnMargin.toFixed(1)}%
                          </td>
                          <td className="text-center px-4 py-2.5">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: allianceColor(s.winner) }}>
                              {s.winner}
                            </span>
                          </td>
                          <td className="text-center px-4 py-2.5">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ color: allianceColor(s.likelyHurts), backgroundColor: `${allianceColor(s.likelyHurts)}20` }}>
                              {s.likelyHurts}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-400">
                  * "Hurts" indicates the leading alliance — TVK likely draws more from the same voter pool as the alliance with the higher share.
                </div>
              </div>
            </>
          )}
        </Section>

        {/* ── Footer CTA ── */}
        <div className="text-center py-12 border-t border-gray-200 mt-8">
          <p className="text-gray-500 text-sm mb-4">
            This analysis is based on V{data.version} predictions generated using AI models.
            Actual results may vary significantly.
          </p>
          <Link
            to="/predictions"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View All Constituency Predictions
          </Link>
        </div>
      </div>
    </div>
  );
}
