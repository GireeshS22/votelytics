/**
 * Votelytics - Main Application Component
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import ConstituencyDetail from './pages/ConstituencyDetail';
import PartyProfile from './pages/PartyProfile';
import Analysis from './pages/Analysis';
import SwingAnalysis from './pages/SwingAnalysis';
import Terms from './pages/Terms';
import About from './pages/About';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/analysis/swing" element={<SwingAnalysis />} />
            <Route path="/constituency/:id" element={<ConstituencyDetail />} />
            <Route path="/party/:partyName" element={<PartyProfile />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
