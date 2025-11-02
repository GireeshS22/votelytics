/**
 * Analysis Hub page - Shows different types of electoral analysis
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { electionsAPI } from '../services/api';
import { getPartyColor, formatPartyName } from '../utils/partyColors';

interface BastionData {
  years: number[];
  total_bastion_seats: number;
  bastion_seats: Array<{
    constituency_id: number;
    constituency_name: string;
    ac_number: number;
    party: string;
    margin_2011: number;
    margin_2016: number;
    margin_2021: number;
    avg_margin: number;
    margin_pct_2011: number;
    margin_pct_2016: number;
    margin_pct_2021: number;
    avg_margin_pct: number;
    vote_share_2011: number;
    vote_share_2016: number;
    vote_share_2021: number;
    candidate_2011: string;
    candidate_2016: string;
    candidate_2021: string;
    margin_trend: string;
    strength: string;
  }>;
  party_summary: Array<{
    party: string;
    total_bastions: number;
    avg_margin: number;
    strong_bastions: number;
    moderate_bastions: number;
    weak_bastions: number;
    increasing_trend: number;
    decreasing_trend: number;
  }>;
  statistics: {
    total_constituencies_analyzed: number;
    bastion_percentage: number;
    strong_bastions: number;
    moderate_bastions: number;
    weak_bastions: number;
    increasing_trend: number;
    decreasing_trend: number;
  };
}

function Analysis() {
  const [bastionData, setBastionData] = useState<BastionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadBastionAnalysis();
  }, []);

  const loadBastionAnalysis = async () => {
    try {
      setLoading(true);
      const data = await electionsAPI.getBastionSeatsThreeElections();
      setBastionData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load bastion seats analysis. Make sure the backend is running.');
      console.error('Error loading bastion analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading Analysis...</div>
          <div className="text-gray-600">Analyzing bastion seats</div>
        </div>
      </div>
    );
  }

  if (error || !bastionData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-xl font-semibold text-red-600 mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={loadBastionAnalysis}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStrengthBadge = (strength: string) => {
    const colors = {
      strong: 'bg-green-100 text-green-800 border-green-300',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      weak: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[strength as keyof typeof colors] || colors.moderate;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header with Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Electoral Analysis
              </h1>
              <p className="text-gray-600">
                Explore different analytical perspectives on Tamil Nadu elections
              </p>
            </div>
            <button
              onClick={() => navigate('/analysis/swing')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Swing Analysis →
            </button>
          </div>
        </div>

        {/* Main Section: Bastion Seats */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bastion Seats Analysis: 2011 → 2016 → 2021
          </h2>
          <p className="text-gray-600 mb-6">
            Constituencies held by the same party across ALL THREE elections - true party strongholds over 10 years
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Found {bastionData.total_bastion_seats} constituencies ({bastionData.statistics.bastion_percentage}%) where the same party won in 2011, 2016, AND 2021
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {bastionData.total_bastion_seats}
            </div>
            <div className="text-sm text-gray-600">Total Bastion Seats</div>
            <div className="text-xs text-gray-500 mt-1">
              {((bastionData.total_bastion_seats / bastionData.statistics.total_constituencies_analyzed) * 100).toFixed(1)}% of constituencies
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {bastionData.statistics.strong_bastions}
            </div>
            <div className="text-sm text-gray-600">Strong Bastions</div>
            <div className="text-xs text-gray-500 mt-1">Margin &gt; 20,000</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {bastionData.statistics.moderate_bastions}
            </div>
            <div className="text-sm text-gray-600">Moderate Bastions</div>
            <div className="text-xs text-gray-500 mt-1">Margin 10k-20k</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {bastionData.statistics.weak_bastions}
            </div>
            <div className="text-sm text-gray-600">Weak Bastions</div>
            <div className="text-xs text-gray-500 mt-1">Margin &lt; 10,000</div>
          </div>
        </div>

        {/* Party-wise Bastion Summary */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Party Strongholds</h2>
            <p className="text-sm text-gray-600 mt-1">Number of bastion seats by party</p>
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
                      Total Bastions
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Strong
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Moderate
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weak
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Margin
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bastionData.party_summary.map((party) => (
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
                        <span className="text-lg font-bold text-gray-900">
                          {party.total_bastions}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-green-600 font-semibold">
                          {party.strong_bastions}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-yellow-600 font-semibold">
                          {party.moderate_bastions}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-orange-600 font-semibold">
                          {party.weak_bastions}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700">
                        {party.avg_margin.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-green-600">
                            ↗ {party.increasing_trend}
                          </span>
                          <span className="text-red-600">
                            ↘ {party.decreasing_trend}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bastion Seats List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              All Bastion Seats ({bastionData.total_bastion_seats})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Sorted by average margin strength (strongest first)
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bastionData.bastion_seats.map((seat) => (
                <div
                  key={seat.constituency_id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/constituency/${seat.constituency_id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {seat.constituency_name}
                      </h3>
                      <p className="text-sm text-gray-500">AC {seat.ac_number}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStrengthBadge(seat.strength)}`}>
                      {seat.strength.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center mb-3">
                    <div
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: getPartyColor(seat.party) }}
                    />
                    <span className="font-medium text-gray-800">
                      {formatPartyName(seat.party)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500 mb-1">2011 Margin</div>
                      <div className="font-semibold text-gray-700">
                        {seat.margin_2011?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500 mb-1">2016 Margin</div>
                      <div className="font-semibold text-gray-700">
                        {seat.margin_2016?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500 mb-1">2021 Margin</div>
                      <div className="font-semibold text-gray-700">
                        {seat.margin_2021?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        Avg Margin: <span className="font-semibold text-gray-900">{seat.avg_margin.toLocaleString()}</span>
                      </span>
                      <span className={`font-medium ${
                        seat.margin_trend === 'increasing' ? 'text-green-600' :
                        seat.margin_trend === 'decreasing' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {seat.margin_trend === 'increasing' ? '↗ Strengthening' :
                         seat.margin_trend === 'decreasing' ? '↘ Weakening' :
                         '↔ Mixed'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analysis;
