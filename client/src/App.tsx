/**
 * Votelytics - Main Application Component
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import VoteWidget from './components/VoteWidget';
import './App.css';

// Lazy load route components for better performance
const ConstituencyDetail    = lazy(() => import('./pages/ConstituencyDetail'));
const ConstituencyList      = lazy(() => import('./pages/ConstituencyList'));
const PartyProfile          = lazy(() => import('./pages/PartyProfile'));
const Analysis              = lazy(() => import('./pages/Analysis'));
const SwingAnalysis         = lazy(() => import('./pages/SwingAnalysis'));
const BastionAnalysis       = lazy(() => import('./pages/BastionAnalysis'));
const Predictions           = lazy(() => import('./pages/Predictions'));
const VoteResults           = lazy(() => import('./pages/VoteResults'));
const Terms                 = lazy(() => import('./pages/Terms'));
const About                 = lazy(() => import('./pages/About'));
const ConstituencyInfographic = lazy(() => import('./pages/ConstituencyInfographic'));

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

/** Main site layout — header + footer */
function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <VoteWidget />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Infographic route — no header/footer, used for Playwright screenshots */}
          <Route path="/infographic/:slug" element={<ConstituencyInfographic />} />

          {/* All other routes use the main layout */}
          <Route element={<MainLayout />}>
            <Route path="/"                    element={<Home />} />
            <Route path="/predictions"         element={<Predictions />} />
            <Route path="/analysis"            element={<Analysis />} />
            <Route path="/analysis/swing"      element={<SwingAnalysis />} />
            <Route path="/analysis/bastion"    element={<BastionAnalysis />} />
            <Route path="/constituency"        element={<ConstituencyList />} />
            <Route path="/constituency/:slug"  element={<ConstituencyDetail />} />
            <Route path="/party/:partyName"    element={<PartyProfile />} />
            <Route path="/vote-results"        element={<VoteResults />} />
            <Route path="/terms"               element={<Terms />} />
            <Route path="/about"               element={<About />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
