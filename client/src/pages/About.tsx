/**
 * About page - Project information
 */
import MetaTags from '../components/SEO/MetaTags';
import { PAGE_SEO, SEO_CONFIG } from '../utils/seoConfig';

function About() {
  return (
    <>
      {/* SEO Meta Tags */}
      <MetaTags
        title={PAGE_SEO.about.title}
        description={PAGE_SEO.about.description}
        keywords={PAGE_SEO.about.keywords}
        canonical={`${SEO_CONFIG.siteUrl}/about`}
      />

      <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Votelytics</h1>
          <p className="text-lg text-gray-600 mb-8">
            An open-source educational project for exploring Tamil Nadu election data
          </p>

          <div className="prose max-w-none">
            {/* What is Votelytics */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What is Votelytics?</h2>
              <p className="text-gray-700 mb-4">
                Votelytics is a free, open-source web application that visualizes and analyzes
                Tamil Nadu Assembly Election data. It provides an interactive map-based interface
                to explore election results, compare party performances, and understand electoral
                trends across constituencies.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-sm text-gray-800">
                  <strong>Important:</strong> This is an independent educational project, not
                  affiliated with any government body, political party, or official organization.
                  Data may contain errors. Always verify with official sources.
                </p>
              </div>
            </section>

            {/* Features */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Interactive Map:</strong> Visualize election results on an interactive
                  Tamil Nadu map with constituency-level data
                </li>
                <li>
                  <strong>Year Selector:</strong> Compare results across different elections
                  (2021, 2016)
                </li>
                <li>
                  <strong>Swing Analysis:</strong> Understand how constituencies changed between
                  elections, party-wise gains/losses, and margin shifts
                </li>
                <li>
                  <strong>Party Profiles:</strong> Detailed breakdowns of each party's performance
                  across constituencies
                </li>
                <li>
                  <strong>Constituency Details:</strong> Historical results and candidate
                  information for each constituency
                </li>
              </ul>
            </section>

            {/* Technology Stack */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Technology Stack</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">Frontend</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>React + TypeScript</li>
                    <li>React Router</li>
                    <li>Tailwind CSS</li>
                    <li>Leaflet (Maps)</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">Backend</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>Python + FastAPI</li>
                    <li>SQLAlchemy</li>
                    <li>PostgreSQL / SQLite</li>
                    <li>Pandas (Data Processing)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Sources */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sources</h2>
              <p className="text-gray-700 mb-4">
                Election data is sourced from publicly available datasets and government
                repositories. We process this data to make it more accessible and analyzable.
              </p>
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-700">
                  <strong>For Official Data:</strong> Visit the{' '}
                  <a
                    href="https://eci.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Election Commission of India
                  </a>{' '}
                  website for verified, authoritative election information.
                </p>
              </div>
            </section>

            {/* Project Status */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Status</h2>
              <div className="flex items-start space-x-3 mb-3">
                <span className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  BETA
                </span>
                <p className="text-gray-700 text-sm">
                  This project is in active development. Features may be added, changed, or
                  removed. Data may be incomplete or contain errors.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  OPEN SOURCE
                </span>
                <p className="text-gray-700 text-sm">
                  The source code is freely available. Contributions, bug reports, and feedback
                  are welcome.
                </p>
              </div>
            </section>

            {/* Purpose & Goals */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Purpose & Goals</h2>
              <p className="text-gray-700 mb-4">This project aims to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  Make election data more accessible and understandable through visualization
                </li>
                <li>
                  Provide an educational tool for learning about electoral patterns and trends
                </li>
                <li>
                  Demonstrate modern web development techniques with real-world data
                </li>
                <li>Encourage civic engagement and political awareness</li>
                <li>Serve as a learning resource for developers interested in data visualization</li>
              </ul>
            </section>

            {/* Limitations */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Known Limitations</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Data may be incomplete, outdated, or contain errors</li>
                <li>Limited historical data coverage (currently 2016-2021)</li>
                <li>
                  Countermanded elections (postponed/cancelled) are excluded from analysis
                </li>
                <li>No real-time data updates - information is static at time of data load</li>
                <li>Design optimized for desktop; mobile experience may vary</li>
                <li>Community-maintained with no guaranteed support or updates</li>
              </ul>
            </section>

            {/* Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Legal Disclaimer</h2>
              <p className="text-gray-700 mb-4">
                Votelytics is provided "as is" without any warranties. The creators are not liable
                for any damages or consequences arising from use of this website or reliance on its
                data. This is an educational project only.
              </p>
              <p className="text-gray-700">
                For complete legal terms, please see our{' '}
                <a href="/terms" className="text-blue-600 hover:underline">
                  Terms and Conditions
                </a>
                .
              </p>
            </section>

            {/* Credits */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Credits & Acknowledgments</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Election data from publicly available government sources</li>
                <li>Map tiles from OpenStreetMap contributors</li>
                <li>Built with open-source libraries and frameworks</li>
                <li>Inspired by data journalism and civic tech projects worldwide</li>
              </ul>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact & Contributions</h2>
              <p className="text-gray-700 mb-4">
                This is an open-source project. If you find issues, have suggestions, or want to
                contribute:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Report bugs or data inaccuracies via GitHub issues</li>
                <li>Contribute code improvements via pull requests</li>
                <li>Share feedback and feature requests</li>
                <li>Help improve documentation</li>
              </ul>
            </section>

            {/* Final Note */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200 mt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-2">A Weekend Project</h3>
              <p className="text-sm text-gray-700">
                Votelytics started as a weekend coding project to explore election data and learn
                about web mapping technologies. It's maintained by volunteers in their spare time.
                We hope it helps people better understand Tamil Nadu's electoral landscape, but
                please remember it's not a substitute for official sources.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default About;
