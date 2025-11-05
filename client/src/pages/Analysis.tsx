/**
 * Analysis Hub page - Shows different types of electoral analysis
 */
import { useNavigate } from 'react-router-dom';
import MetaTags from '../components/SEO/MetaTags';
import { PAGE_SEO, SEO_CONFIG } from '../utils/seoConfig';

function Analysis() {
  const navigate = useNavigate();

  return (
    <>
      {/* SEO Meta Tags */}
      <MetaTags
        title={PAGE_SEO.analysis.title}
        description={PAGE_SEO.analysis.description}
        keywords={PAGE_SEO.analysis.keywords}
        canonical={`${SEO_CONFIG.siteUrl}/analysis`}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Electoral Analysis
            </h1>
            <p className="text-gray-600">
              Explore different analytical perspectives on Tamil Nadu elections
            </p>
          </div>

          {/* Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Swing Analysis Card */}
            <div
              onClick={() => navigate('/analysis/swing')}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Swing Analysis
                  </h2>
                  <div className="text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Analyze vote share changes between elections. Identify constituencies with significant swings in party support and electoral volatility patterns.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Vote Share Changes
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Electoral Volatility
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Trend Analysis
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 px-6 py-3 border-t border-blue-100">
                <button className="text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-2">
                  View Swing Analysis
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bastion Seats Card */}
            <div
              onClick={() => navigate('/analysis/bastion')}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Bastion Seats Analysis
                  </h2>
                  <div className="text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Discover party strongholds held consistently across 2011, 2016, and 2021 elections. Explore margin trends and bastion strength classifications.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    Party Strongholds
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    Margin Trends
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    3-Election Analysis
                  </span>
                </div>
              </div>
              <div className="bg-green-50 px-6 py-3 border-t border-green-100">
                <button className="text-green-600 font-semibold hover:text-green-800 flex items-center gap-2">
                  View Bastion Analysis
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              About Electoral Analysis
            </h3>
            <p className="text-gray-600 mb-4">
              Our analytical tools provide deep insights into Tamil Nadu's electoral patterns. Each analysis type offers unique perspectives:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Swing Analysis</strong> helps identify shifting voter preferences and electoral volatility</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span><strong>Bastion Seats</strong> reveals long-term party strongholds and their stability over time</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default Analysis;
