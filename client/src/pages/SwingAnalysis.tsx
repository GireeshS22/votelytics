/**
 * Analysis page - Shows swing analysis and party changes between elections
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { electionsAPI } from '../services/api';
import { getPartyColor, formatPartyName } from '../utils/partyColors';
import MetaTags from '../components/SEO/MetaTags';
import { PAGE_SEO, SEO_CONFIG } from '../utils/seoConfig';
import { generateDatasetSchema } from '../utils/structuredData';

interface SwingData {
  from_year: number;
  to_year: number;
  total_flips: number;
  flips: any[];
  party_summary: Array<{
    party: string;
    gained: number;
    lost: number;
    net_change: number;
  }>;
  margin_changes: {
    top_increases: any[];
    top_decreases: any[];
  };
  statistics: {
    total_constituencies_compared: number;
    constituencies_unchanged: number;
  };
}

function SwingAnalysis() {
  const [swingData, setSwingData] = useState<SwingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSwingAnalysis();
  }, []);

  const loadSwingAnalysis = async () => {
    try {
      setLoading(true);
      const data = await electionsAPI.getSwingAnalysis(2016, 2021);
      setSwingData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load swing analysis. Make sure the backend is running.');
      console.error('Error loading swing analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading Analysis...</div>
          <div className="text-gray-600">Calculating swing data</div>
        </div>
      </div>
    );
  }

  if (error || !swingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-xl font-semibold text-red-600 mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={loadSwingAnalysis}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Generate structured data for swing analysis page
  const datasetSchema = generateDatasetSchema(
    'Tamil Nadu Election Swing Analysis 2016-2021',
    'Analysis of constituency flips and electoral swings between 2016 and 2021 Tamil Nadu assembly elections'
  );

  return (
    <>
      {/* SEO Meta Tags */}
      <MetaTags
        title={PAGE_SEO.swingAnalysis.title}
        description={PAGE_SEO.swingAnalysis.description}
        keywords={PAGE_SEO.swingAnalysis.keywords}
        canonical={`${SEO_CONFIG.siteUrl}/analysis/swing`}
        structuredData={datasetSchema}
      />

      <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Swing Analysis: {swingData.from_year} → {swingData.to_year}
          </h1>
          <p className="text-gray-600">
            Analyzing party changes and electoral swings across Tamil Nadu constituencies
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {swingData.total_flips}
            </div>
            <div className="text-sm text-gray-600">Constituencies Flipped</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {swingData.statistics.constituencies_unchanged}
            </div>
            <div className="text-sm text-gray-600">Seats Retained</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {swingData.statistics.total_constituencies_compared}
            </div>
            <div className="text-sm text-gray-600">Total Compared</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {((swingData.total_flips / swingData.statistics.total_constituencies_compared) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Flip Rate</div>
          </div>
        </div>

        {/* Party-wise Gains & Losses */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Party Performance</h2>
            <p className="text-sm text-gray-600 mt-1">Seat gains and losses by party</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Party
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seats Gained
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seats Lost
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {swingData.party_summary.map((party) => (
                    <tr
                      key={party.party}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/party/${party.party}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded mr-3"
                            style={{ backgroundColor: getPartyColor(party.party) }}
                          />
                          <span className="font-medium text-gray-900">
                            {formatPartyName(party.party)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-green-600 font-semibold">+{party.gained}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-red-600 font-semibold">-{party.lost}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`font-bold text-lg ${
                            party.net_change > 0
                              ? 'text-green-600'
                              : party.net_change < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {party.net_change > 0 ? '+' : ''}
                          {party.net_change}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Flipped Constituencies */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              Flipped Constituencies ({swingData.total_flips})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Constituencies that changed hands between parties
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {swingData.flips.map((flip) => (
                <div
                  key={flip.constituency_id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/constituency/${flip.ac_slug}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {flip.constituency_name}
                      </h3>
                      <p className="text-sm text-gray-500">AC {flip.ac_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 my-3">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded mr-2"
                        style={{ backgroundColor: getPartyColor(flip.from_party) }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {formatPartyName(flip.from_party)}
                      </span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded mr-2"
                        style={{ backgroundColor: getPartyColor(flip.to_party) }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {formatPartyName(flip.to_party)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div className="mb-1">
                      <span className="font-medium">{swingData.from_year}:</span> {flip.from_candidate}
                      {flip.from_margin && ` (Margin: ${flip.from_margin.toLocaleString()})`}
                    </div>
                    <div>
                      <span className="font-medium">{swingData.to_year}:</span> {flip.to_candidate}
                      {flip.to_margin && ` (Margin: ${flip.to_margin.toLocaleString()})`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Margin Changes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Margin Increases */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b bg-green-50">
              <h2 className="text-xl font-bold text-gray-900">
                Biggest Margin Increases
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Constituencies where winning margins increased the most
              </p>
            </div>
            <div className="p-4">
              {swingData.margin_changes.top_increases.slice(0, 10).map((change, idx) => (
                <div
                  key={change.constituency_id}
                  className="py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer rounded px-2"
                  onClick={() => navigate(`/constituency/${change.ac_slug}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {idx + 1}. {change.constituency_name}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center mt-1">
                        <div
                          className="w-3 h-3 rounded mr-2"
                          style={{ backgroundColor: getPartyColor(change.party) }}
                        />
                        {formatPartyName(change.party)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-bold">
                        +{change.margin_change.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {change.from_margin.toLocaleString()} → {change.to_margin.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Margin Decreases */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b bg-red-50">
              <h2 className="text-xl font-bold text-gray-900">
                Biggest Margin Decreases
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Constituencies where winning margins decreased the most
              </p>
            </div>
            <div className="p-4">
              {swingData.margin_changes.top_decreases.reverse().slice(0, 10).map((change, idx) => (
                <div
                  key={change.constituency_id}
                  className="py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer rounded px-2"
                  onClick={() => navigate(`/constituency/${change.ac_slug}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {idx + 1}. {change.constituency_name}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center mt-1">
                        <div
                          className="w-3 h-3 rounded mr-2"
                          style={{ backgroundColor: getPartyColor(change.party) }}
                        />
                        {formatPartyName(change.party)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600 font-bold">
                        {change.margin_change.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {change.from_margin.toLocaleString()} → {change.to_margin.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default SwingAnalysis;
