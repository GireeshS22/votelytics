/**
 * Footer component - Site-wide footer with links
 */
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      {/* Important Disclaimer Banner */}
      <div className="bg-yellow-600 text-gray-900">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="text-lg font-bold flex-shrink-0">⚠️</span>
            <p className="text-sm font-semibold">
              <strong>Voting Disclaimer:</strong> Any analysis, predictions, or trends shown for future elections (including 2026) are for informational and educational purposes only.
              They do NOT constitute recommendations, endorsements, or advice on how to vote.
              We do not endorse any political party, candidate, or ideology.
              Please use your own discretion and judgment when exercising your democratic right to vote.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-3">Votelytics</h3>
            <p className="text-sm text-gray-300">
              A free, open-source educational project for exploring Tamil Nadu election data.
              Not affiliated with any government body or political organization.
            </p>
            <div className="mt-3 inline-block bg-yellow-600 text-white text-xs px-2 py-1 rounded">
              BETA - Educational Use Only
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Home - Map View
                </Link>
              </li>
              <li>
                <Link to="/analysis" className="text-gray-300 hover:text-white transition-colors">
                  Swing Analysis
                </Link>
              </li>
              <li>
                <a
                  href="https://eci.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Election Commission of India ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-bold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  About This Project
                </Link>
              </li>
            </ul>
            <div className="mt-4 text-xs text-gray-400">
              <p className="mb-1">⚠️ Data may contain errors</p>
              <p>Not for official use</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p className="mb-2">
            © {currentYear} Votelytics. Open Source Project. No warranty provided.
          </p>
          <p className="text-xs">
            This is an independent, unofficial project. Always verify data with official sources.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
