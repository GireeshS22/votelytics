/**
 * Header component - Navigation bar
 */
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold tracking-tight">
              Votelytics
            </div>
            <div className="text-xs bg-blue-500 px-2 py-1 rounded">
              BETA
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-6">
            <Link
              to="/"
              className="hover:text-blue-200 transition-colors font-medium"
            >
              Map
            </Link>
            <Link
              to="/analysis"
              className="hover:text-blue-200 transition-colors font-medium"
            >
              Analysis
            </Link>
            <Link
              to="/about"
              className="hover:text-blue-200 transition-colors font-medium"
            >
              About
            </Link>
          </div>

          {/* Mobile menu button (placeholder) */}
          <button className="md:hidden">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Header;
