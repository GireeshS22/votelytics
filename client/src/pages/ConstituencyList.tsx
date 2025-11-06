/**
 * Constituency List page - Shows all constituencies with winners by year
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { constituenciesAPI, electionsAPI } from '../services/api';
import { getPartyColor, formatPartyName } from '../utils/partyColors';
import MetaTags from '../components/SEO/MetaTags';
import { SEO_CONFIG } from '../utils/seoConfig';

interface ConstituencyWinner {
  ac_number: number;
  constituency_id: number;
  constituency_name: string;
  ac_slug: string | null;
  district: string | null;
  winner_2021: {
    party: string;
    candidate: string;
    margin: number;
    vote_share: number;
  } | null;
  winner_2016: {
    party: string;
    candidate: string;
    margin: number;
    vote_share: number;
  } | null;
  winner_2011: {
    party: string;
    candidate: string;
    margin: number;
    vote_share: number;
  } | null;
  trend: 'bastion' | 'flipped' | 'partial';
  bastion_party?: string;
}

function ConstituencyList() {
  const [data, setData] = useState<ConstituencyWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'ac_number' | 'name'>('ac_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [constituenciesData, election2021, election2016, election2011] = await Promise.all([
        constituenciesAPI.getAll({ limit: 500 }),
        electionsAPI.getByYear(2021),
        electionsAPI.getByYear(2016),
        electionsAPI.getByYear(2011),
      ]);

      // Fetch winners for each election
      const [winners2021, winners2016, winners2011] = await Promise.all([
        election2021 ? electionsAPI.getResults(election2021.id, { winner_only: true, limit: 500 }) : Promise.resolve([]),
        election2016 ? electionsAPI.getResults(election2016.id, { winner_only: true, limit: 500 }) : Promise.resolve([]),
        election2011 ? electionsAPI.getResults(election2011.id, { winner_only: true, limit: 500 }) : Promise.resolve([]),
      ]);

      // Create lookup maps
      const winners2021Map = new Map(winners2021.map(w => [w.constituency_id, w]));
      const winners2016Map = new Map(winners2016.map(w => [w.constituency_id, w]));
      const winners2011Map = new Map(winners2011.map(w => [w.constituency_id, w]));

      // Merge data
      const mergedData: ConstituencyWinner[] = constituenciesData.constituencies.map(constituency => {
        const w2021 = winners2021Map.get(constituency.id);
        const w2016 = winners2016Map.get(constituency.id);
        const w2011 = winners2011Map.get(constituency.id);

        // Determine trend
        let trend: 'bastion' | 'flipped' | 'partial' = 'partial';
        let bastion_party: string | undefined;

        if (w2021 && w2016 && w2011) {
          if (w2021.party === w2016.party && w2016.party === w2011.party) {
            trend = 'bastion';
            bastion_party = w2021.party;
          } else {
            trend = 'flipped';
          }
        }

        return {
          ac_number: constituency.ac_number,
          constituency_id: constituency.id,
          constituency_name: constituency.name,
          ac_slug: constituency.slug,
          district: constituency.district,
          winner_2021: w2021 ? {
            party: w2021.party,
            candidate: w2021.candidate_name,
            margin: w2021.margin || 0,
            vote_share: w2021.vote_share_pct || 0,
          } : null,
          winner_2016: w2016 ? {
            party: w2016.party,
            candidate: w2016.candidate_name,
            margin: w2016.margin || 0,
            vote_share: w2016.vote_share_pct || 0,
          } : null,
          winner_2011: w2011 ? {
            party: w2011.party,
            candidate: w2011.candidate_name,
            margin: w2011.margin || 0,
            vote_share: w2011.vote_share_pct || 0,
          } : null,
          trend,
          bastion_party,
        };
      });

      setData(mergedData);
      setError(null);
    } catch (err) {
      setError('Failed to load constituency data. Please make sure the backend is running.');
      console.error('Error loading constituency data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique districts for filter
  const districts = useMemo(() => {
    const uniqueDistricts = new Set(data.map(d => d.district).filter((d): d is string => Boolean(d)));
    return Array.from(uniqueDistricts).sort();
  }, [data]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.constituency_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply district filter
    if (districtFilter !== 'all') {
      filtered = filtered.filter(item => item.district === districtFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'ac_number') {
        comparison = a.ac_number - b.ac_number;
      } else {
        comparison = a.constituency_name.localeCompare(b.constituency_name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchTerm, districtFilter, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const bastions = data.filter(d => d.trend === 'bastion').length;
    const flipped = data.filter(d => d.trend === 'flipped').length;

    return {
      total: data.length,
      bastions,
      flipped,
    };
  }, [data]);

  const handleSort = (column: 'ac_number' | 'name') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading Constituencies...</div>
          <div className="text-gray-600">Fetching election data</div>
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
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <MetaTags
        title="All Constituencies - Tamil Nadu Elections | Votelytics"
        description="Complete list of all Tamil Nadu assembly constituencies with winning parties and candidates from 2011, 2016, and 2021 elections"
        keywords="Tamil Nadu constituencies, assembly seats, election winners, constituency list, electoral data"
        canonical={`${SEO_CONFIG.siteUrl}/constituency`}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              All Tamil Nadu Constituencies
            </h1>
            <p className="text-gray-600">
              Winning Party & Candidate across Elections (2011 → 2016 → 2021)
            </p>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Total Constituencies</div>
            </div>
            <div
              onClick={() => navigate('/analysis/bastion')}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl font-bold text-green-600 mb-1">
                {stats.bastions}
              </div>
              <div className="text-sm text-gray-600">Bastion Seats</div>
              <div className="text-xs text-gray-500 mt-1">Same party all 3 elections</div>
              <div className="text-xs text-green-600 font-semibold mt-2">View Analysis →</div>
            </div>
            <div
              onClick={() => navigate('/analysis/swing')}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {stats.flipped}
              </div>
              <div className="text-sm text-gray-600">Flipped Seats</div>
              <div className="text-xs text-gray-500 mt-1">Party changed at least once</div>
              <div className="text-xs text-orange-600 font-semibold mt-2">View Analysis →</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="🔍 Search constituencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:w-64">
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Districts</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredAndSortedData.length} of {data.length} constituencies
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {filteredAndSortedData.map((item) => (
              <div
                key={item.constituency_id}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/constituency/${item.ac_slug || item.constituency_id}`)}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        AC {item.ac_number}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{item.constituency_name}</h3>
                    {item.district && (
                      <p className="text-sm text-gray-500 mt-1">{item.district}</p>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Election Results */}
                <div className="space-y-3">
                  {/* 2021 Winner */}
                  <div className="flex items-start gap-3">
                    <div className="text-xs font-semibold text-gray-500 w-12 flex-shrink-0 pt-1">2021</div>
                    {item.winner_2021 ? (
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getPartyColor(item.winner_2021.party) }}
                          />
                          <span className="text-sm font-bold text-gray-900">
                            {formatPartyName(item.winner_2021.party)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">{item.winner_2021.candidate}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Margin: {item.winner_2021.margin.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No data</span>
                    )}
                  </div>

                  {/* 2016 Winner */}
                  <div className="flex items-start gap-3">
                    <div className="text-xs font-semibold text-gray-500 w-12 flex-shrink-0 pt-1">2016</div>
                    {item.winner_2016 ? (
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getPartyColor(item.winner_2016.party) }}
                          />
                          <span className="text-sm font-bold text-gray-900">
                            {formatPartyName(item.winner_2016.party)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">{item.winner_2016.candidate}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Margin: {item.winner_2016.margin.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No data</span>
                    )}
                  </div>

                  {/* 2011 Winner */}
                  <div className="flex items-start gap-3">
                    <div className="text-xs font-semibold text-gray-500 w-12 flex-shrink-0 pt-1">2011</div>
                    {item.winner_2011 ? (
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getPartyColor(item.winner_2011.party) }}
                          />
                          <span className="text-sm font-bold text-gray-900">
                            {formatPartyName(item.winner_2011.party)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">{item.winner_2011.candidate}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Margin: {item.winner_2011.margin.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No data</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('ac_number')}
                    >
                      <div className="flex items-center gap-1">
                        AC# {sortBy === 'ac_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Constituency {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      2021 Winner
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      2016 Winner
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      2011 Winner
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedData.map((item) => (
                    <tr
                      key={item.constituency_id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/constituency/${item.ac_slug || item.constituency_id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{item.ac_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{item.constituency_name}</div>
                        {item.district && (
                          <div className="text-sm text-gray-500">{item.district}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.winner_2021 ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getPartyColor(item.winner_2021.party) }}
                              />
                              <span className="text-sm font-semibold text-gray-900">
                                {formatPartyName(item.winner_2021.party)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">{item.winner_2021.candidate}</div>
                            <div className="text-sm text-gray-500">Margin: {item.winner_2021.margin.toLocaleString()}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No data</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.winner_2016 ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getPartyColor(item.winner_2016.party) }}
                              />
                              <span className="text-sm font-semibold text-gray-900">
                                {formatPartyName(item.winner_2016.party)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">{item.winner_2016.candidate}</div>
                            <div className="text-sm text-gray-500">Margin: {item.winner_2016.margin.toLocaleString()}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No data</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.winner_2011 ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getPartyColor(item.winner_2011.party) }}
                              />
                              <span className="text-sm font-semibold text-gray-900">
                                {formatPartyName(item.winner_2011.party)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">{item.winner_2011.candidate}</div>
                            <div className="text-sm text-gray-500">Margin: {item.winner_2011.margin.toLocaleString()}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No data</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredAndSortedData.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No constituencies found matching your criteria</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ConstituencyList;
