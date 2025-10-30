/**
 * Tamil Nadu Map Component using Leaflet
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import type { Constituency } from '../../types/constituency';

interface TNMapProps {
  constituencies: Constituency[];
  onConstituencyClick?: (constituency: Constituency) => void;
}

function TNMap({ constituencies, onConstituencyClick }: TNMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!mapRef.current || constituencies.length === 0) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current!.removeLayer(layer);
      }
    });

    // Add markers for each constituency (temporary - until we have GeoJSON)
    // In a real implementation, you would render constituency polygons from GeoJSON
    constituencies.forEach((constituency) => {
      // For demo purposes, we're placing markers at approximate locations
      // You would replace this with actual GeoJSON polygon rendering
      const lat = 11.0 + Math.random() * 2 - 1; // Random around TN center
      const lon = 78.5 + Math.random() * 2 - 1;

      const marker = L.marker([lat, lon], {
        title: constituency.name,
      }).addTo(mapRef.current!);

      // Add popup with constituency info
      marker.bindPopup(`
        <div style="text-align: center;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${constituency.name}</h3>
          <p style="margin: 4px 0; color: #666;">${constituency.district}</p>
          <p style="margin: 4px 0; font-size: 12px;">Code: ${constituency.code}</p>
          <button
            onclick="window.location.href='/constituency/${constituency.id}'"
            style="
              margin-top: 8px;
              padding: 6px 12px;
              background: #3B82F6;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            "
          >
            View Details
          </button>
        </div>
      `);

      // Handle marker click
      marker.on('click', () => {
        if (onConstituencyClick) {
          onConstituencyClick(constituency);
        }
      });
    });
  }, [constituencies, onConstituencyClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full rounded-lg shadow-lg" />

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-[1000]">
        <h4 className="font-semibold text-sm mb-2">Map Legend</h4>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Constituency Marker</span>
          </div>
          <p className="text-gray-500 mt-2">
            Click markers for details
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[1000] max-w-xs">
        <h3 className="font-bold text-lg mb-2">Tamil Nadu - 2026 Elections</h3>
        <p className="text-sm text-gray-600 mb-2">
          {constituencies.length} constituencies loaded
        </p>
        <p className="text-xs text-gray-500">
          📍 Click on any marker to view constituency details
        </p>
      </div>
    </div>
  );
}

export default TNMap;
