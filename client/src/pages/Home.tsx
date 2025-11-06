/**
 * Home page - displays the interactive Tamil Nadu map
 * Optimized with caching and memoization
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { constituenciesAPI, electionsAPI } from '../services/api';
import TNMap from '../components/map/TNMap';
import MetaTags from '../components/SEO/MetaTags';
import { PAGE_SEO, SEO_CONFIG } from '../utils/seoConfig';
import { generateWebsiteSchema, generateOrganizationSchema } from '../utils/structuredData';
import type { Constituency } from '../types/constituency';
import type { Election, ElectionResult } from '../types/election';

export interface ConstituencyWithWinner extends Constituency {
  winner?: ElectionResult;
}

function Home() {
  const [constituencies, setConstituencies] = useState<ConstituencyWithWinner[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch available elections on mount
  useEffect(() => {
    loadElections();
  }, []);

  // Load data when election is selected
  useEffect(() => {
    if (selectedElectionId !== null) {
      loadData(selectedElectionId);
    }
  }, [selectedElectionId]);

  const loadElections = async () => {
    try {
      const electionsData = await electionsAPI.getAll({ limit: 100 });

      // Sort elections by year descending (newest first)
      const sortedElections = electionsData.sort((a, b) => b.year - a.year);
      setElections(sortedElections);

      // Auto-select the most recent election (2021)
      if (sortedElections.length > 0) {
        setSelectedElectionId(sortedElections[0].id);
      }
    } catch (err) {
      setError('Failed to load elections. Make sure the backend is running.');
      console.error('Error loading elections:', err);
    }
  };

  const loadData = async (electionId: number) => {
    try {
      setLoading(true);

      // Fetch constituencies and winners for selected election in parallel
      const [constituenciesData, winners] = await Promise.all([
        constituenciesAPI.getAll({ limit: 500 }),
        electionsAPI.getResults(electionId, { winner_only: true, limit: 500 })
      ]);

      // Create a map of constituency_id to winner
      const winnerMap = new Map<number, ElectionResult>();
      winners.forEach(winner => {
        winnerMap.set(winner.constituency_id, winner);
      });

      // Merge constituencies with winners
      const merged = constituenciesData.constituencies.map(constituency => ({
        ...constituency,
        winner: winnerMap.get(constituency.id)
      }));

      setConstituencies(merged);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Make sure the backend is running.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Memoize click handler to prevent re-creation on every render
  const handleConstituencyClick = useCallback((constituency: Constituency) => {
    console.log('Constituency clicked:', constituency);
    navigate(`/constituency/${constituency.slug}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading Votelytics...</div>
          <div className="text-gray-600">Fetching Tamil Nadu constituencies</div>
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
            onClick={loadElections}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get currently selected election
  const selectedElection = elections.find(e => e.id === selectedElectionId);

  // Generate combined structured data for homepage
  const combinedStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      generateWebsiteSchema(),
      generateOrganizationSchema(),
    ],
  };

  // Smooth scroll to map
  const scrollToMap = () => {
    const mapSection = document.getElementById('map-section');
    mapSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <MetaTags
        title={PAGE_SEO.home.title}
        description={PAGE_SEO.home.description}
        keywords={PAGE_SEO.home.keywords}
        canonical={`${SEO_CONFIG.siteUrl}/`}
        structuredData={combinedStructuredData}
      />

      <div className="min-h-screen flex flex-col">
        {/* Hero Banner Landing Section */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Hero Header */}
            <div className="text-center mb-8 md:mb-10">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3 md:mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                VOTELYTICS
              </h1>
              <p className="text-xl md:text-2xl font-semibold text-blue-100 mb-3 md:mb-4">
                Tamil Nadu Election Data Visualization
              </p>
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
                Explore 234 constituencies across 3 elections with interactive maps and detailed analytics
              </p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-5 md:p-6 text-center hover:scale-105 transition-transform shadow-xl">
                <div className="text-3xl md:text-4xl font-bold mb-2">234</div>
                <div className="text-base md:text-lg text-blue-50">Constituencies</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-indigo-700 rounded-lg p-5 md:p-6 text-center hover:scale-105 transition-transform shadow-xl">
                <div className="text-3xl md:text-4xl font-bold mb-2">3</div>
                <div className="text-base md:text-lg text-purple-50">Elections Covered</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-5 md:p-6 text-center hover:scale-105 transition-transform shadow-xl">
                <div className="text-3xl md:text-4xl font-bold mb-2">2011-2021</div>
                <div className="text-base md:text-lg text-orange-50">Historical Data</div>
              </div>
            </div>

            {/* Feature Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
              <button
                onClick={scrollToMap}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-sm md:text-base"
              >
                Interactive Map
              </button>
              <button
                onClick={() => navigate('/analysis/swing')}
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-sm md:text-base"
              >
                Swing Analysis
              </button>
              <button
                onClick={() => navigate('/analysis/bastion')}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-sm md:text-base"
              >
                Party Bastions
              </button>
              <button
                onClick={() => navigate('/constituency')}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-sm md:text-base"
              >
                Browse All
              </button>
            </div>

            {/* Scroll Indicator */}
            <div className="text-center">
              <button
                onClick={scrollToMap}
                className="inline-flex flex-col items-center text-blue-100 hover:text-white transition-colors group"
                aria-label="Scroll to map"
              >
                <span className="text-sm md:text-base mb-2">Explore the Map Below</span>
                <svg
                  className="w-6 h-6 md:w-8 md:h-8 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <div id="map-section" className="h-screen flex flex-col relative">
          {/* Year Selection Dropdown - positioned to avoid header overlap */}
          <div className="absolute top-2 right-4 z-[1001]">
            <div className="bg-white rounded-lg shadow-lg p-3">
              <label htmlFor="year-select" className="block text-xs font-semibold text-gray-700 mb-2">
                Election Year
              </label>
              <select
                id="year-select"
                value={selectedElectionId || ''}
                onChange={(e) => setSelectedElectionId(Number(e.target.value))}
                className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {elections.map((election) => (
                  <option key={election.id} value={election.id}>
                    {election.year} - {election.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1">
            <TNMap
              constituencies={constituencies}
              selectedYear={selectedElection?.year}
              onConstituencyClick={handleConstituencyClick}
            />
          </div>

          {/* Bottom Stats Bar */}
          <div className="bg-white border-t shadow-lg">
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {constituencies.length}
                  </div>
                  <div className="text-sm text-gray-600">Constituencies</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{constituencies.length}</div>
                  <div className="text-sm text-gray-600">Total Seats</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">2026</div>
                  <div className="text-sm text-gray-600">Next Election</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">6.3 Cr</div>
                  <div className="text-sm text-gray-600">Voters</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
