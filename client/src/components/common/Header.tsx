/**
 * Header component - Navigation bar with mega menu
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const [analysisDropdownOpen, setAnalysisDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close dropdown on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAnalysisDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAnalysisDropdownOpen(false);
      }
    };

    if (analysisDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [analysisDropdownOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAnalysisDropdownOpen(false);
  }, [location]);

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg sticky top-0 z-[1100]">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
            <div className="text-2xl font-bold tracking-tight">
              Votelytics
            </div>
            <div className="text-xs bg-blue-500 px-2 py-1 rounded font-semibold">
              BETA
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link
              to="/"
              className="hover:text-blue-100 transition-colors font-medium flex items-center gap-2 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Map</span>
            </Link>

            <Link
              to="/constituency"
              className="hover:text-blue-100 transition-colors font-medium flex items-center gap-2 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Constituencies</span>
            </Link>

            <Link
              to="/predictions"
              className="hover:text-blue-100 transition-colors font-medium flex items-center gap-2 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Predictions 2026</span>
            </Link>

            {/* Analysis Mega Menu */}
            <div
              className="relative"
              ref={dropdownRef}
            >
              <button
                onClick={() => setAnalysisDropdownOpen(!analysisDropdownOpen)}
                className="hover:text-blue-100 transition-colors font-medium flex items-center gap-2 group py-2"
                aria-haspopup="menu"
                aria-expanded={analysisDropdownOpen}
                aria-controls="analysis-mega-menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Analysis</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${analysisDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Mega Menu Dropdown */}
              {analysisDropdownOpen && (
                <div
                  id="analysis-mega-menu"
                  role="menu"
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[1110]"
                >
                  <div className="w-96 bg-white text-gray-800 rounded-lg shadow-2xl overflow-hidden animate-fadeIn"
                  >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">
                      Explore Election Data
                    </h3>
                  </div>

                  {/* Menu Items */}
                  <div className="p-4">
                    <Link
                      to="/analysis"
                      role="menuitem"
                      className="block p-4 rounded-lg hover:bg-blue-50 transition-colors group"
                      onClick={() => setAnalysisDropdownOpen(false)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">Analysis Hub</h4>
                          <p className="text-sm text-gray-600">Central insights & election trends</p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/analysis/swing"
                      role="menuitem"
                      className="block p-4 rounded-lg hover:bg-orange-50 transition-colors group"
                      onClick={() => setAnalysisDropdownOpen(false)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">Swing Analysis</h4>
                          <p className="text-sm text-gray-600">Track vote share changes & volatility</p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/analysis/bastion"
                      role="menuitem"
                      className="block p-4 rounded-lg hover:bg-green-50 transition-colors group"
                      onClick={() => setAnalysisDropdownOpen(false)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">Bastion Analysis</h4>
                          <p className="text-sm text-gray-600">Identify party strongholds (2011-2021)</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/about"
              className="hover:text-blue-100 transition-colors font-medium flex items-center gap-2 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>About</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-3 rounded-lg hover:bg-blue-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-blue-700 pt-4 animate-fadeIn">
            <div className="space-y-2">
              <Link
                to="/"
                className="block px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Map
              </Link>
              <Link
                to="/constituency"
                className="block px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Constituencies
              </Link>
              <div className="px-4 py-2 text-sm text-blue-200 font-semibold">Analysis</div>
              <Link
                to="/analysis"
                className="block px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Analysis Hub
              </Link>
              <Link
                to="/analysis/swing"
                className="block px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Swing Analysis
              </Link>
              <Link
                to="/analysis/bastion"
                className="block px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Bastion Analysis
              </Link>
              <Link
                to="/about"
                className="block px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
