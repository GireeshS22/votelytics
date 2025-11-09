/**
 * ConstituencyDetail Page - Displays detailed election results for a constituency
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { constituenciesAPI, electionsAPI, predictionsAPI } from '../services/api';
import ConstituencyHeader from '../components/constituency/ConstituencyHeader';
import ElectionResults from '../components/constituency/ElectionResults';
import PredictionSection from '../components/constituency/PredictionSection';
import MetaTags from '../components/SEO/MetaTags';
import { getConstituencySEO, SEO_CONFIG } from '../utils/seoConfig';
import { generateConstituencySchema, generateBreadcrumbSchema, generatePredictionEventSchema } from '../utils/structuredData';
import type { Constituency } from '../types/constituency';
import type { ElectionResult } from '../types/election';
import type { PredictionDetail } from '../types/prediction';

function ConstituencyDetail() {
  const { slug } = useParams<{ slug: string }>();

  const [constituency, setConstituency] = useState<Constituency | null>(null);
  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
  const [results2021, setResults2021] = useState<ElectionResult[]>([]);
  const [results2016, setResults2016] = useState<ElectionResult[]>([]);
  const [results2011, setResults2011] = useState<ElectionResult[]>([]);
  const [allConstituencies, setAllConstituencies] = useState<Constituency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all constituencies once for navigation
  useEffect(() => {
    loadAllConstituencies();
  }, []);

  // Load current constituency data when slug changes
  useEffect(() => {
    if (slug) {
      loadData();
    }
  }, [slug]);

  const loadAllConstituencies = async () => {
    try {
      const data = await constituenciesAPI.getAll({ limit: 500 });
      // Sort by ac_number to maintain constituency order (1-234)
      const sortedConstituencies = data.constituencies.sort(
        (a, b) => a.ac_number - b.ac_number
      );
      setAllConstituencies(sortedConstituencies);
    } catch (err) {
      console.error('Error loading constituencies:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch constituency by slug
      const constituencyData = await constituenciesAPI.getBySlug(slug!);

      // Fetch election results using the constituency ID
      const allResults = await electionsAPI.getConstituencyHistory(constituencyData.id);

      setConstituency(constituencyData);

      // Group results by year and sort by rank
      const results2021Data = allResults
        .filter(r => r.year === 2021)
        .sort((a, b) => (a.rank || 999) - (b.rank || 999));

      const results2016Data = allResults
        .filter(r => r.year === 2016)
        .sort((a, b) => (a.rank || 999) - (b.rank || 999));

      const results2011Data = allResults
        .filter(r => r.year === 2011)
        .sort((a, b) => (a.rank || 999) - (b.rank || 999));

      setResults2021(results2021Data);
      setResults2016(results2016Data);
      setResults2011(results2011Data);

      // Fetch 2026 prediction (optional - don't fail if not found)
      try {
        const predictionData = await predictionsAPI.getByConstituency(constituencyData.id, 2026);
        setPrediction(predictionData.prediction);
      } catch (predErr) {
        console.log('No prediction found for this constituency');
        setPrediction(null);
      }

    } catch (err) {
      console.error('Error loading constituency data:', err);
      setError('Failed to load constituency data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">
            Loading constituency details...
          </div>
        </div>
      </div>
    );
  }

  if (error || !constituency) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl font-semibold text-red-600 mb-2">Error</div>
          <div className="text-gray-600 mb-4">
            {error || 'Constituency not found'}
          </div>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate prev/next constituencies based on ac_number order
  const currentIndex = allConstituencies.findIndex(c => c.id === constituency.id);
  const prevConstituency = currentIndex > 0 ? allConstituencies[currentIndex - 1] : null;
  const nextConstituency = currentIndex < allConstituencies.length - 1 ? allConstituencies[currentIndex + 1] : null;

  // Generate SEO data dynamically based on constituency and prediction
  const hasPrediction = prediction !== null;
  const predictedWinner = prediction?.predicted_winner_alliance;

  const seoData = getConstituencySEO(
    constituency.name,
    constituency.district,
    constituency.ac_number,
    hasPrediction,
    predictedWinner
  );

  // Generate structured data for constituency
  const constituencySchema = generateConstituencySchema(constituency);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: SEO_CONFIG.siteUrl },
    { name: 'Constituencies', url: `${SEO_CONFIG.siteUrl}/` },
    { name: constituency.name, url: `${SEO_CONFIG.siteUrl}/constituency/${constituency.slug}` },
  ]);

  // Add prediction event schema if prediction exists
  const schemas: any[] = [constituencySchema, breadcrumbSchema];
  if (hasPrediction && prediction) {
    const predictionSchema = generatePredictionEventSchema(constituency, prediction);
    schemas.push(predictionSchema);
  }

  const combinedStructuredData = {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <MetaTags
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical={`${SEO_CONFIG.siteUrl}/constituency/${constituency.slug}`}
        structuredData={combinedStructuredData}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-[1800px]">
        {/* Constituency Header */}
        <ConstituencyHeader
          constituency={constituency}
          prevConstituency={prevConstituency}
          nextConstituency={nextConstituency}
        />

        {/* 2026 Prediction Section */}
        {prediction && <PredictionSection prediction={prediction} />}

        {/* No Data Warning */}
        {results2021.length === 0 && results2016.length === 0 && results2011.length === 0 ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center shadow-lg">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="text-2xl font-bold text-yellow-800 mb-3">
              No Election Data Available
            </div>
            <div className="text-base text-yellow-700">
              Election results for this constituency are not yet available in the database.
            </div>
          </div>
        ) : (
          <>
            {/* Comparison Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Election Results Comparison
              </h2>
              <div className="flex items-center justify-center gap-4">
                <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                <span className="text-gray-600 font-medium">2021 vs 2016 vs 2011</span>
                <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
              </div>
            </div>

            {/* Side-by-Side Election Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* 2021 Election Results */}
              <div className="flex flex-col">
                <ElectionResults
                  year={2021}
                  results={results2021}
                  title="Tamil Nadu Assembly Election"
                />
              </div>

              {/* 2016 Election Results */}
              <div className="flex flex-col">
                <ElectionResults
                  year={2016}
                  results={results2016}
                  title="Tamil Nadu Assembly Election"
                />
              </div>

              {/* 2011 Election Results */}
              <div className="flex flex-col">
                <ElectionResults
                  year={2011}
                  results={results2011}
                  title="Tamil Nadu Assembly Election"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}

export default ConstituencyDetail;
