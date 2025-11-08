/**
 * KeyFactorsTooltip Component
 * Displays prediction key factors in a tooltip on hover/click
 */
import { useState, useRef, useEffect } from 'react';

interface KeyFactorsTooltipProps {
  factors: string[];
  constituencyName: string;
}

export function KeyFactorsTooltip({ factors, constituencyName }: KeyFactorsTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'left' | 'center'>('center');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Determine tooltip position based on viewport
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // If icon is in the right 40% of viewport, position tooltip to the left
      if (rect.right > viewportWidth * 0.6) {
        setPosition('left');
      } else {
        setPosition('center');
      }
    }
  };

  // Update position when showing tooltip
  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  // Don't render if no factors
  if (!factors || factors.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      {/* Info Icon Button */}
      <button
        ref={buttonRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        className="ml-2 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
        aria-label="View key factors"
        type="button"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Tooltip Box */}
      {isVisible && (
        <div className={`absolute bottom-full mb-2 z-[1200] animate-fadeIn ${
          position === 'left'
            ? 'right-0'
            : 'left-1/2 transform -translate-x-1/2'
        }`}>
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-96 max-w-[95vw]">
            {/* Arrow pointing down */}
            <div className={`absolute top-full ${
              position === 'left'
                ? 'right-4'
                : 'left-1/2 transform -translate-x-1/2'
            }`}>
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" style={{ marginTop: '-1px' }}></div>
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-200 absolute top-0 left-0" style={{ marginTop: '0px' }}></div>
            </div>

            {/* Header */}
            <div className="mb-3 pb-2 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Key Prediction Factors
              </h4>
              <p className="text-xs text-gray-500 mt-1">{constituencyName}</p>
            </div>

            {/* Factors List */}
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {factors.map((factor, idx) => (
                <li key={idx} className="flex items-start text-sm text-gray-700">
                  <span className="text-blue-500 mr-2 mt-1 flex-shrink-0">•</span>
                  <span className="leading-relaxed break-words">{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
