/**
 * Predictions Page - 2026 Tamil Nadu Assembly Election Predictions
 * Shows AI-powered predictions with US-style bar chart, map, and detailed analysis
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictionsAPI } from '../services/api';
import { getPartyColor } from '../utils/partyColors';
import MetaTags from '../components/SEO/MetaTags';
import { PAGE_SEO, SEO_CONFIG } from '../utils/seoConfig';
import { generatePredictionsDatasetSchema, generateWebsiteSchema, generateBreadcrumbSchema } from '../utils/structuredData';
import type { PredictionsSummary, Prediction } from '../types/prediction';

/**
 * Get color for an alliance (maps to primary party color)
 */
const getAllianceColor = (alliance: string): string => {
  if (alliance.includes('DMK') && !alliance.includes('AIADMK')) return getPartyColor('DMK');
  if (alliance.includes('AIADMK') || alliance.includes('ADMK')) return getPartyColor('AIADMK');
  if (alliance.includes('NTK')) return getPartyColor('NTK');
  if (alliance.includes('TVK')) return getPartyColor('TVK');
  if (alliance.includes('BJP')) return getPartyColor('BJP');
  if (alliance.includes('PMK')) return getPartyColor('PMK');
  return '#808080'; // Gray for others
};

const Predictions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PredictionsSummary | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [allianceFilter, setAllianceFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'ac_number' | 'constituency_name' | 'district' | 'predicted_winner_alliance' | 'confidence_level' | 'predicted_vote_share'>('ac_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [summaryData, predictionsData] = await Promise.all([
        predictionsAPI.getSummary(2026),
        predictionsAPI.getAll({ year: 2026, limit: 234 }),
      ]);

      setSummary(summaryData);
      setPredictions(predictionsData.predictions);
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError('Failed to load predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Sort handler
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Get unique values for filters
  const uniqueDistricts = useMemo(() => {
    const districts = new Set(predictions.map(p => p.district).filter(Boolean));
    return Array.from(districts).sort();
  }, [predictions]);

  const uniqueAlliances = useMemo(() => {
    const alliances = new Set(predictions.map(p => p.predicted_winner_alliance));
    return Array.from(alliances).sort();
  }, [predictions]);

  // Filter and sort predictions
  const filteredAndSortedPredictions = useMemo(() => {
    let filtered = predictions;

    // Apply dropdown filters
    if (districtFilter !== 'all') {
      filtered = filtered.filter(pred => pred.district === districtFilter);
    }

    if (allianceFilter !== 'all') {
      filtered = filtered.filter(pred => pred.predicted_winner_alliance === allianceFilter);
    }

    if (confidenceFilter !== 'all') {
      filtered = filtered.filter(pred => pred.confidence_level === confidenceFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'ac_number':
          comparison = a.ac_number - b.ac_number;
          break;
        case 'constituency_name':
          comparison = a.constituency_name.localeCompare(b.constituency_name);
          break;
        case 'district':
          comparison = (a.district || '').localeCompare(b.district || '');
          break;
        case 'predicted_winner_alliance':
          comparison = a.predicted_winner_alliance.localeCompare(b.predicted_winner_alliance);
          break;
        case 'confidence_level':
          const confidenceOrder = { 'Safe': 1, 'Likely': 2, 'Lean': 3, 'Toss-up': 4 };
          comparison = (confidenceOrder[a.confidence_level as keyof typeof confidenceOrder] || 5) -
                      (confidenceOrder[b.confidence_level as keyof typeof confidenceOrder] || 5);
          break;
        case 'predicted_vote_share':
          comparison = a.predicted_vote_share - b.predicted_vote_share;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [predictions, districtFilter, allianceFilter, confidenceFilter, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Loading Predictions...</div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="text-2xl font-bold text-red-600 mb-4">Error</div>
          <div className="text-gray-600 mb-6">{error || 'No predictions data available'}</div>
          <button
            onClick={loadData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Generate structured data for predictions page
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: SEO_CONFIG.siteUrl },
    { name: '2026 Predictions', url: `${SEO_CONFIG.siteUrl}/predictions` },
  ]);

  const combinedStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      generateWebsiteSchema(),
      generatePredictionsDatasetSchema(),
      breadcrumbSchema,
    ],
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <MetaTags
        title={PAGE_SEO.predictions.title}
        description={PAGE_SEO.predictions.description}
        keywords={PAGE_SEO.predictions.keywords}
        canonical={`${SEO_CONFIG.siteUrl}/predictions`}
        structuredData={combinedStructuredData}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            2026 Tamil Nadu Assembly Election Predictions
          </h1>
          <p className="text-base md:text-lg text-gray-600 mb-4">
            AI-powered predictions based on historical data and current political trends
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <div className="bg-white px-3 py-1.5 rounded-full shadow-sm">📅 Generated: {new Date(summary.generated_date).toLocaleDateString()}</div>
            <div className="bg-white px-3 py-1.5 rounded-full shadow-sm">📊 Based on: 2021, 2016, 2011 results</div>
            <div className="bg-white px-3 py-1.5 rounded-full shadow-sm">✅ {summary.predictions_complete}/{summary.total_seats} predictions complete</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="container mx-auto px-4 max-w-7xl py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* DMK+ Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: getAllianceColor('DMK+') }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getAllianceColor('DMK+') }}></div>
              <div className="text-sm font-semibold text-gray-700">DMK+ Alliance</div>
            </div>
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {summary.seat_distribution['DMK+']?.total || 0}
            </div>
            <div className="text-sm text-gray-600 mb-3">Projected Seats</div>
            {summary.seat_distribution['DMK+']?.total >= 117 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-700 font-semibold">
                ✓ Crosses majority (+{summary.seat_distribution['DMK+'].total - 117} above 117)
              </div>
            )}
          </div>

          {/* AIADMK+ Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: getAllianceColor('AIADMK+') }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getAllianceColor('AIADMK+') }}></div>
              <div className="text-sm font-semibold text-gray-700">AIADMK+ Alliance</div>
            </div>
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {summary.seat_distribution['AIADMK+']?.total || 0}
            </div>
            <div className="text-sm text-gray-600 mb-3">Projected Seats</div>
            <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
              {117 - (summary.seat_distribution['AIADMK+']?.total || 0)} short of majority
            </div>
          </div>

          {/* Battlegrounds Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-400">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 rounded bg-gray-400"></div>
              <div className="text-sm font-semibold text-gray-700">Key Battlegrounds</div>
            </div>
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {summary.toss_up}
            </div>
            <div className="text-sm text-gray-600 mb-3">Toss-up Seats</div>
            <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-600">
              Too close to call
            </div>
          </div>
        </div>
      </section>

      {/* Bar Chart Section */}
      <section className="container mx-auto px-4 max-w-7xl py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Seat Distribution by Alliance</h2>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-6">
            {Object.entries(summary.seat_distribution).map(([alliance, data]) => {
              const allianceColor = getAllianceColor(alliance);
              return (
                <div key={alliance}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: allianceColor }}></div>
                      <span className="font-semibold text-gray-900">{alliance}</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{data.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-10 overflow-hidden flex shadow-inner">
                    {data.safe > 0 && (
                      <div
                        className="flex items-center justify-center text-white text-xs font-semibold transition-all hover:opacity-90"
                        style={{
                          width: `${(data.safe / summary.total_seats) * 100}%`,
                          backgroundColor: allianceColor,
                          opacity: 1
                        }}
                        title={`Safe: ${data.safe} seats`}
                      >
                        {data.safe > 0 && `Safe ${data.safe}`}
                      </div>
                    )}
                    {data.likely > 0 && (
                      <div
                        className="flex items-center justify-center text-white text-xs font-semibold transition-all hover:opacity-90"
                        style={{
                          width: `${(data.likely / summary.total_seats) * 100}%`,
                          backgroundColor: allianceColor,
                          opacity: 0.75
                        }}
                        title={`Likely: ${data.likely} seats`}
                      >
                        {data.likely > 0 && `Likely ${data.likely}`}
                      </div>
                    )}
                    {data.lean > 0 && (
                      <div
                        className="flex items-center justify-center text-white text-xs font-semibold transition-all hover:opacity-90"
                        style={{
                          width: `${(data.lean / summary.total_seats) * 100}%`,
                          backgroundColor: allianceColor,
                          opacity: 0.5
                        }}
                        title={`Lean: ${data.lean} seats`}
                      >
                        {data.lean > 0 && `Lean ${data.lean}`}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-600">
                    {data.safe > 0 && <span>Safe: {data.safe}</span>}
                    {data.likely > 0 && <span>Likely: {data.likely}</span>}
                    {data.lean > 0 && <span>Lean: {data.lean}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <strong>Majority Mark:</strong> 117 seats required to form government
            </div>
          </div>
        </div>
      </section>

      {/* All Predictions Table */}
      <section className="container mx-auto px-4 max-w-7xl py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">All Predictions</h2>
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedPredictions.length} of {predictions.length} predictions
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ac_number')}
                  >
                    <div className="flex items-center gap-1">
                      AC# {sortBy === 'ac_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('constituency_name')}
                  >
                    <div className="flex items-center gap-1">
                      Constituency {sortBy === 'constituency_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1 cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('district')}
                      >
                        District {sortBy === 'district' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === 'district' ? null : 'district');
                        }}
                        className={`p-1 hover:bg-gray-200 rounded transition-colors relative ${districtFilter !== 'all' ? 'bg-blue-100' : ''}`}
                      >
                        <svg className={`w-3 h-3 ${districtFilter !== 'all' ? 'text-blue-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {districtFilter !== 'all' && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </button>
                      {openDropdown === 'district' && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
                          <div className="py-1 max-h-60 overflow-y-auto">
                            <button
                              onClick={() => {
                                setDistrictFilter('all');
                                setOpenDropdown(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${districtFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                              All Districts
                            </button>
                            {uniqueDistricts.map(district => (
                              <button
                                key={district}
                                onClick={() => {
                                  setDistrictFilter(district);
                                  setOpenDropdown(null);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${districtFilter === district ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                              >
                                {district}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1 cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('predicted_winner_alliance')}
                      >
                        Predicted Winner {sortBy === 'predicted_winner_alliance' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === 'alliance' ? null : 'alliance');
                        }}
                        className={`p-1 hover:bg-gray-200 rounded transition-colors relative ${allianceFilter !== 'all' ? 'bg-blue-100' : ''}`}
                      >
                        <svg className={`w-3 h-3 ${allianceFilter !== 'all' ? 'text-blue-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {allianceFilter !== 'all' && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </button>
                      {openDropdown === 'alliance' && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setAllianceFilter('all');
                                setOpenDropdown(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${allianceFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                              All Alliances
                            </button>
                            {uniqueAlliances.map(alliance => (
                              <button
                                key={alliance}
                                onClick={() => {
                                  setAllianceFilter(alliance);
                                  setOpenDropdown(null);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${allianceFilter === alliance ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                              >
                                {alliance}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1 cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('confidence_level')}
                      >
                        Confidence {sortBy === 'confidence_level' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === 'confidence' ? null : 'confidence');
                        }}
                        className={`p-1 hover:bg-gray-200 rounded transition-colors relative ${confidenceFilter !== 'all' ? 'bg-blue-100' : ''}`}
                      >
                        <svg className={`w-3 h-3 ${confidenceFilter !== 'all' ? 'text-blue-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {confidenceFilter !== 'all' && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </button>
                      {openDropdown === 'confidence' && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setConfidenceFilter('all');
                                setOpenDropdown(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${confidenceFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                              All Levels
                            </button>
                            <button
                              onClick={() => {
                                setConfidenceFilter('Safe');
                                setOpenDropdown(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${confidenceFilter === 'Safe' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                              Safe
                            </button>
                            <button
                              onClick={() => {
                                setConfidenceFilter('Likely');
                                setOpenDropdown(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${confidenceFilter === 'Likely' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                              Likely
                            </button>
                            <button
                              onClick={() => {
                                setConfidenceFilter('Lean');
                                setOpenDropdown(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${confidenceFilter === 'Lean' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                              Lean
                            </button>
                            <button
                              onClick={() => {
                                setConfidenceFilter('Toss-up');
                                setOpenDropdown(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${confidenceFilter === 'Toss-up' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                            >
                              Toss-up
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('predicted_vote_share')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Vote % {sortBy === 'predicted_vote_share' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedPredictions.map(pred => {
                  // Generate slug from constituency name
                  const slug = pred.constituency_name.toLowerCase().replace(/\s+/g, '-');

                  return (
                    <tr key={pred.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{pred.ac_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/constituency/${slug}`)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                        >
                          {pred.constituency_name}
                        </button>
                      </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{pred.district}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getAllianceColor(pred.predicted_winner_alliance) }}
                        ></div>
                        <span className="text-sm font-semibold text-gray-900">
                          {pred.predicted_winner_alliance}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        pred.confidence_level === 'Safe' ? 'bg-green-100 text-green-800' :
                        pred.confidence_level === 'Likely' ? 'bg-blue-100 text-blue-800' :
                        pred.confidence_level === 'Lean' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pred.confidence_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-semibold text-gray-900">{pred.predicted_vote_share.toFixed(1)}%</div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      </div>
    </>
  );
};

export default Predictions;
