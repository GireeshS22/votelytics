/**
 * ConstituencySearch - Searchable combobox for selecting a constituency
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Constituency } from '../types/constituency';

interface Props {
  constituencies: Constituency[];
  value: number | '';
  onChange: (id: number | '') => void;
  placeholder?: string;
}

function ConstituencySearch({ constituencies, value, onChange, placeholder = 'Search constituency...' }: Props) {
  const selected = constituencies.find((c) => c.id === value) ?? null;
  const [query, setQuery] = useState(selected ? `${selected.ac_number}. ${selected.name}` : '');
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input text in sync when value is cleared externally
  useEffect(() => {
    if (!value) setQuery('');
  }, [value]);

  // Measure available space below/above input and decide direction
  const measureDropDirection = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 200; // max-h-48 = 192px + a bit
    setDropUp(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
  }, []);

  const filtered = query.trim()
    ? constituencies.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        String(c.ac_number).startsWith(query) ||
        (c.district ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : constituencies;

  const handleSelect = (c: Constituency) => {
    setQuery(`${c.ac_number}. ${c.name}`);
    onChange(c.id);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange('');   // clear selection while typing
    measureDropDirection();
    setOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Restore display text if a value is selected
        if (value) {
          const c = constituencies.find((c) => c.id === value);
          if (c) setQuery(`${c.ac_number}. ${c.name}`);
        }
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [value, constituencies]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { measureDropDirection(); setOpen(true); }}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange(''); setOpen(true); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            tabIndex={-1}
          >
            ✕
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul className={`absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto text-sm ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          {filtered.slice(0, 50).map((c) => (
            <li
              key={c.id}
              onMouseDown={() => handleSelect(c)}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between ${
                c.id === value ? 'bg-blue-50 font-semibold' : ''
              }`}
            >
              <span>
                <span className="text-gray-400 mr-1">{c.ac_number}.</span>
                {c.name}
              </span>
              {c.district && (
                <span className="text-xs text-gray-400 ml-2 truncate max-w-[80px]">{c.district}</span>
              )}
            </li>
          ))}
          {filtered.length > 50 && (
            <li className="px-3 py-2 text-xs text-gray-400 text-center">
              Type more to narrow results ({filtered.length} found)
            </li>
          )}
        </ul>
      )}

      {open && query.trim() && filtered.length === 0 && (
        <div className={`absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400 ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          No constituencies found
        </div>
      )}
    </div>
  );
}

export default ConstituencySearch;
