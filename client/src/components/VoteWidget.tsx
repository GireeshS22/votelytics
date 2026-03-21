/**
 * VoteWidget - Floating visitor poll widget
 * Collapsed bottom-right button → 2-step vote form → results link
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { constituenciesAPI, votesAPI } from '../services/api';
import ConstituencySearch from './ConstituencySearch';
import type { Constituency } from '../types/constituency';

// Stable session ID stored in localStorage
function getSessionId(): string {
  const key = 'vl_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

const ALLIANCES = ['DMK+', 'AIADMK+', 'NTK', 'TVK', 'BJP+', 'Others'];

const ALLIANCE_COLORS: Record<string, string> = {
  'DMK+': '#FF0000',
  'AIADMK+': '#008000',
  'NTK': '#800080',
  'TVK': '#8B4513',
  'BJP+': '#FF9933',
  'Others': '#6B7280',
};

// LocalStorage key for recording already-voted constituencies
const VOTED_KEY = 'vl_voted_constituency';

function VoteWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState<number | ''>('');
  const [selectedAlliance, setSelectedAlliance] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alreadyVoted, setAlreadyVoted] = useState<number | null>(null);

  // Load constituencies once
  useEffect(() => {
    constituenciesAPI.getAll({ limit: 500 }).then((data) => {
      const sorted = [...data.constituencies].sort((a, b) => a.ac_number - b.ac_number);
      setConstituencies(sorted);
    });
  }, []);

  // Check if already voted when opening
  const handleOpen = useCallback(() => {
    const voted = localStorage.getItem(VOTED_KEY);
    if (voted) {
      setAlreadyVoted(parseInt(voted, 10));
      setStep('done');
    } else {
      setStep(1);
      setAlreadyVoted(null);
    }
    setError('');
    setOpen(true);
  }, []);

  const handleNextStep = () => {
    if (!selectedConstituency) {
      setError('Please select your constituency');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedAlliance) {
      setError('Please select an alliance');
      return;
    }
    if (!selectedConstituency) return;

    setSubmitting(true);
    setError('');
    try {
      await votesAPI.castVote(selectedConstituency as number, selectedAlliance, getSessionId());
      localStorage.setItem(VOTED_KEY, String(selectedConstituency));
      setAlreadyVoted(selectedConstituency as number);
      setStep('done');
    } catch (err: any) {
      if (err?.response?.status === 409) {
        // Already voted
        localStorage.setItem(VOTED_KEY, String(selectedConstituency));
        setAlreadyVoted(selectedConstituency as number);
        setStep('done');
      } else {
        setError('Failed to submit vote. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewResults = () => {
    setOpen(false);
    navigate('/vote-results', { state: { constituencyId: alreadyVoted } });
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95"
          aria-label="Open vote widget"
        >
          <span className="text-lg">🗳️</span>
          <span className="text-sm">Cast Your Vote</span>
        </button>
      )}

      {/* Widget Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🗳️</span>
              <span className="text-white font-semibold text-sm">Who Will You Vote For?</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-blue-200 hover:text-white transition-colors text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="p-6 min-h-[320px] flex flex-col justify-between">
            {step === 1 && (
              <>
                <p className="text-xs text-gray-500 mb-3">This is a non-binding public opinion poll.</p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Constituency
                </label>
                <div className="mb-3">
                  <ConstituencySearch
                    constituencies={constituencies}
                    value={selectedConstituency}
                    onChange={setSelectedConstituency}
                  />
                </div>
                {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                <button
                  onClick={handleNextStep}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  Next →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  onClick={() => { setStep(1); setError(''); }}
                  className="text-xs text-blue-600 hover:underline mb-3 flex items-center gap-1"
                >
                  ← Change constituency
                </button>
                <p className="text-sm font-medium text-gray-700 mb-3">Which alliance will you vote for?</p>
                <div className="space-y-2 mb-3">
                  {ALLIANCES.map((alliance) => (
                    <button
                      key={alliance}
                      onClick={() => setSelectedAlliance(alliance)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-all text-sm text-left ${
                        selectedAlliance === alliance
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ALLIANCE_COLORS[alliance] }}
                      />
                      <span className="font-medium text-gray-800">{alliance}</span>
                    </button>
                  ))}
                </div>
                {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedAlliance}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Vote'}
                </button>
              </>
            )}

            {step === 'done' && (
              <div className="text-center py-2">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {alreadyVoted ? 'Your vote has been recorded!' : 'Already voted'}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  See how others are voting across Tamil Nadu.
                </p>
                <button
                  onClick={handleViewResults}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  View Poll Results →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default VoteWidget;
