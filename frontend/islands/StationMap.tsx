import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import type { Stream, StreamConditions } from '@shared/models/types.ts';

interface StationMapProps {
  streams: Stream[];
  apiUrl: string;
}

const qualityColors = {
  excellent: '#22c55e',
  good: '#3b82f6',
  fair: '#eab308',
  poor: '#ef4444',
};

export default function StationMap({ streams, apiUrl }: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const conditionsMap = useSignal<Record<string, StreamConditions>>({});
  const loaded = useSignal(false);

  useEffect(() => {
    // Dynamically load Leaflet
    const loadLeaflet = async () => {
      if (typeof L === 'undefined') {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      if (!mapRef.current || mapInstance.current) return;

      // Center on upstate NY
      const map = L.map(mapRef.current).setView([41.8, -74.5], 8);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      loaded.value = true;
    };

    loadLeaflet();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Add markers when map is loaded
  useEffect(() => {
    if (!loaded.value || !mapInstance.current) return;

    const map = mapInstance.current;

    // Add stream markers
    streams.forEach((stream) => {
      if (!stream.coordinates) return;

      const marker = L.circleMarker(
        [stream.coordinates.latitude, stream.coordinates.longitude],
        {
          radius: 10,
          fillColor: '#64748b', // Default gray
          color: '#475569',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        },
      ).addTo(map);

      // Initial popup
      marker.bindPopup(`
        <div style="min-width: 150px">
          <strong>${stream.name}</strong><br>
          <span style="color: #64748b; font-size: 12px">${stream.region} • ${stream.state}</span><br>
          <span style="color: #94a3b8; font-size: 11px">Loading conditions...</span>
        </div>
      `);

      // Fetch conditions and update marker
      fetch(`${apiUrl}/api/streams/${stream.id}/conditions`)
        .then((res) => res.json())
        .then((json) => {
          if (!json.success || !json.data) return;

          const cond: StreamConditions = json.data;
          conditionsMap.value = {
            ...conditionsMap.value,
            [stream.id]: cond,
          };

          // Update marker color
          marker.setStyle({
            fillColor: qualityColors[cond.fishingQuality],
            color: qualityColors[cond.fishingQuality],
          });

          // Update popup content
          const waterTemp = cond.stationData[0]?.waterTempF;
          const flow = cond.stationData[0]?.dischargeCfs;
          const topHatch = cond.predictedHatches[0]?.hatch.commonName;

          marker.setPopupContent(`
            <div style="min-width: 180px">
              <strong>${stream.name}</strong><br>
              <span style="color: #64748b; font-size: 12px">${stream.region} • ${stream.state}</span>
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #e2e8f0">
              <div style="font-size: 13px">
                ${waterTemp ? `💧 Water: <strong>${waterTemp}°F</strong><br>` : ''}
                ${flow ? `🌊 Flow: <strong>${flow} cfs</strong><br>` : ''}
                ${topHatch ? `🪰 ${topHatch}<br>` : ''}
              </div>
              <div style="margin-top: 8px">
                <span style="
                  background: ${qualityColors[cond.fishingQuality]};
                  color: white;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 11px;
                  text-transform: uppercase;
                ">${cond.fishingQuality}</span>
              </div>
              <a href="/streams/${stream.id}" style="
                display: block;
                margin-top: 8px;
                color: #0ea5e9;
                font-size: 12px;
              ">View details →</a>
            </div>
          `);
        })
        .catch(console.error);
    });
  }, [loaded.value, streams, apiUrl]);

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }}>
      {!loaded.value && (
        <div class='flex items-center justify-center h-full bg-slate-100'>
          <div class='text-slate-500'>Loading map...</div>
        </div>
      )}
    </div>
  );
}

// Note: Leaflet types are defined in frontend/types/global.d.ts
