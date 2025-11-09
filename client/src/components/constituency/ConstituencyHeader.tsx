/**
 * ConstituencyHeader Component - Displays constituency information
 */
import { useNavigate } from 'react-router-dom';
import type { Constituency } from '../../types/constituency';

interface ConstituencyHeaderProps {
  constituency: Constituency;
  prevConstituency?: Constituency | null;
  nextConstituency?: Constituency | null;
}

function ConstituencyHeader({ constituency, prevConstituency, nextConstituency }: ConstituencyHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-8 mb-8 text-white overflow-hidden relative">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-48 -translate-x-48"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation - Back Buttons (Left) and Prev/Next (Right) */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          {/* Left side - Back buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-blue-100 transition-all bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Map</span>
            </button>
            <button
              onClick={() => navigate('/predictions')}
              className="flex items-center gap-2 text-white hover:text-blue-100 transition-all bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Predictions</span>
            </button>
          </div>

          {/* Right side - Prev/Next buttons */}
          <div className="flex items-center gap-3">
            {prevConstituency && (
              <button
                onClick={() => navigate(`/constituency/${prevConstituency.slug}`)}
                className="flex items-center gap-2 text-white hover:text-blue-100 transition-all bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20"
                aria-label={`Previous constituency: ${prevConstituency.name}`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium hidden md:inline">Previous</span>
              </button>
            )}
            {nextConstituency && (
              <button
                onClick={() => navigate(`/constituency/${nextConstituency.slug}`)}
                className="flex items-center gap-2 text-white hover:text-blue-100 transition-all bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20"
                aria-label={`Next constituency: ${nextConstituency.name}`}
              >
                <span className="font-medium hidden md:inline">Next</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Constituency Info */}
        <div>
          <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold mb-3">
            Assembly Constituency
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
            {constituency.name}
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {/* AC Number */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all">
            <div className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wide">AC Number</div>
            <div className="text-2xl font-bold">{constituency.ac_number}</div>
          </div>

          {/* District */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all">
            <div className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wide">District</div>
            <div className="text-lg font-bold truncate">{constituency.district || 'Unknown'}</div>
          </div>

          {/* Region - hide if Unknown */}
          {constituency.region && constituency.region.toLowerCase() !== 'unknown' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all">
              <div className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wide">Region</div>
              <div className="text-lg font-bold">{constituency.region}</div>
            </div>
          )}

          {/* Population */}
          {constituency.population && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all">
              <div className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wide">Population</div>
              <div className="text-lg font-bold">{constituency.population.toLocaleString()}</div>
            </div>
          )}

          {/* Literacy Rate */}
          {constituency.literacy_rate && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all">
              <div className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wide">Literacy</div>
              <div className="text-lg font-bold">{constituency.literacy_rate.toFixed(1)}%</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConstituencyHeader;
