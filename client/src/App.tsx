/**
 * Votelytics - Main Application Component
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import './App.css';

// Lazy load route components for better performance
const ConstituencyDetail = lazy(() => import('./pages/ConstituencyDetail'));
const PartyProfile = lazy(() => import('./pages/PartyProfile'));
const Analysis = lazy(() => import('./pages/Analysis'));
const SwingAnalysis = lazy(() => import('./pages/SwingAnalysis'));
const Terms = lazy(() => import('./pages/Terms'));
const About = lazy(() => import('./pages/About'));

// Loading component for lazy-loaded routes
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/analysis/swing" element={<SwingAnalysis />} />
              <Route path="/constituency/:slug" element={<ConstituencyDetail />} />
              <Route path="/party/:partyName" element={<PartyProfile />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
