/**
 * Tamil Nadu Map Component using Leaflet with GeoJSON polygons
 * Optimized with memoization for better performance
 */
import { useEffect, useRef, useMemo, memo } from 'react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import type { ConstituencyWithWinner } from '../../pages/Home';
import { getPartyColor, formatPartyName } from '../../utils/partyColors';

interface TNMapProps {
  constituencies: ConstituencyWithWinner[];
  selectedYear?: number;
  onConstituencyClick?: (constituency: ConstituencyWithWinner) => void;
}

function TNMap({ constituencies, selectedYear, onConstituencyClick }: TNMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize map only once
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map centered on Tamil Nadu
    const map = L.map(mapContainerRef.current).setView([11.0, 78.5], 7);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Memoize party seat counts calculation
  const partySeatCounts = useMemo(() => {
    const seatCounts: Record<string, number> = {};
    constituencies.forEach(c => {
      if (c.winner) {
        const party = c.winner.party;
        seatCounts[party] = (seatCounts[party] || 0) + 1;
      }
    });
    return seatCounts;
  }, [constituencies]);

  // Memoize GeoJSON features creation (expensive operation)
  const geojsonFeatures = useMemo(() => {
    return constituencies
      .filter(c => c.geojson)
      .map(c => ({
        type: 'Feature' as const,
        properties: {
          ...c,
          winner: c.winner
        },
        geometry: c.geojson!.geometry
      }));
  }, [constituencies]);

  useEffect(() => {
    if (!mapRef.current || constituencies.length === 0) return;

    // Remove existing GeoJSON layer
    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }

    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: geojsonFeatures
    };

    // Add GeoJSON layer
    const geoJsonLayer = L.geoJSON(geojsonData, {
      style: (feature) => {
        const party = feature?.properties.winner?.party;
        return {
          fillColor: getPartyColor(party),
          fillOpacity: 0.7,
          color: '#333',
          weight: 1,
          opacity: 0.8
        };
      },
      onEachFeature: (feature, layer) => {
        const constituency = feature.properties as ConstituencyWithWinner;
        const winner = constituency.winner;

        // Create hover tooltip content (brief)
        const tooltipContent = winner ? `
          <div style="padding: 4px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${constituency.name}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">AC ${constituency.ac_number} · ${constituency.district || 'Unknown'}</div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #ddd;">
              <div style="width: 10px; height: 10px; background: ${getPartyColor(winner.party)}; border-radius: 2px;"></div>
              <span style="font-size: 12px; font-weight: 600;">${formatPartyName(winner.party)}</span>
            </div>
            <div style="font-size: 11px; margin-top: 2px;">${winner.candidate_name}</div>
            <div style="font-size: 10px; color: #888; margin-top: 2px;">
              ${winner.total_votes.toLocaleString()} votes (${winner.vote_share_pct?.toFixed(1)}%)
            </div>
          </div>
        ` : `
          <div style="padding: 4px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${constituency.name}</div>
            <div style="font-size: 12px; color: #666;">AC ${constituency.ac_number} · ${constituency.district || 'Unknown'}</div>
            <div style="font-size: 11px; color: #999; margin-top: 6px;">Click for details</div>
          </div>
        `;

        // Bind tooltip for hover
        layer.bindTooltip(tooltipContent, {
          sticky: true, // Tooltip follows cursor
          className: 'custom-tooltip'
        });

        // Hover effects
        layer.on({
          mouseover: (e) => {
            const layer = e.target;
            layer.setStyle({
              weight: 3,
              color: '#000',
              fillOpacity: 0.9
            });
            layer.bringToFront();
          },
          mouseout: (e) => {
            geoJsonLayer.resetStyle(e.target);
          },
          click: () => {
            if (onConstituencyClick) {
              onConstituencyClick(constituency);
            }
          }
        });
      }
    }).addTo(mapRef.current);

    geoJsonLayerRef.current = geoJsonLayer;

    // Fit bounds to show all constituencies
    if (geojsonFeatures.length > 0) {
      mapRef.current.fitBounds(geoJsonLayer.getBounds());
    }
  }, [geojsonFeatures, onConstituencyClick]);

  // Memoize top parties calculation for legend
  const topParties = useMemo(() => {
    return Object.entries(partySeatCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [partySeatCounts]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full rounded-lg shadow-lg" />

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-[1000] max-w-xs">
        <h4 className="font-semibold text-sm mb-3">
          {selectedYear ? `${selectedYear} Election Results` : 'Election Results'}
        </h4>
        <div className="text-xs space-y-2">
          {topParties.map(([party, count]) => (
            <div
              key={party}
              className="flex items-center justify-between gap-3 hover:bg-gray-100 -mx-2 px-2 py-1 rounded cursor-pointer transition-colors"
              onClick={() => navigate(`/party/${party}`)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-gray-300"
                  style={{ backgroundColor: getPartyColor(party) }}
                ></div>
                <span className="font-medium">{formatPartyName(party)}</span>
              </div>
              <span className="text-gray-600 font-semibold">{count}</span>
            </div>
          ))}
          <p className="text-gray-500 mt-3 pt-2 border-t">
            Hover over constituencies · Click parties to view profile
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[1000] max-w-xs">
        <h3 className="font-bold text-lg mb-2">
          Tamil Nadu {selectedYear || ''}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {constituencies.length} constituencies
        </p>
        <p className="text-xs text-gray-500">
          {selectedYear && `🗳️ Showing results from ${selectedYear} Assembly Election`}
        </p>
      </div>
    </div>
  );
}

// Wrap with React.memo to prevent unnecessary re-renders
export default memo(TNMap);
