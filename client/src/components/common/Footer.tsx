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

        {/* Open Source Section */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://github.com/GireeshS22/votelytics"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">View on GitHub</span>
            </a>
            <span className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              Open Source
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-sm text-gray-400">
          <p className="mb-2">
            © {currentYear} Votelytics. Open Source Project. No warranty provided.
          </p>
          <p className="text-xs mb-2">
            This is an independent, unofficial project. Always verify data with official sources.
          </p>
          <p className="text-xs text-gray-500">
            Developed by{' '}
            <a
              href="https://x.com/gireeshs22"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
            >
              @gireeshs22
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
