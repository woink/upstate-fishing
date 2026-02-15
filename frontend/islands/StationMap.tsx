import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import type { Stream, StreamConditions } from '@shared/models/types.ts';
import { defaultBorderColor, defaultMarkerColor, qualityHexColors } from '../lib/colors.ts';

interface StationMapProps {
  streams: Stream[];
  apiUrl: string;
}

export default function StationMap({ streams, apiUrl }: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const conditionsMap = useSignal<Record<string, StreamConditions>>({});
  const loaded = useSignal(false);
  const error = useSignal<string | null>(null);

  useEffect(() => {
    // Dynamically load Leaflet
    const loadLeaflet = async () => {
      try {
        if (typeof L === 'undefined') {
          // Load Leaflet CSS if not already present
          if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
          }

          // Load Leaflet JS
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Leaflet'));
            document.head.appendChild(script);
          });
        }

        // Wait for next frame to ensure DOM is ready
        await new Promise((resolve) => requestAnimationFrame(resolve));

        if (!mapRef.current) {
          error.value = 'Map container not found';
          return;
        }

        // Prevent double initialization
        if (mapInstance.current) return;

        // Center on upstate NY
        const map = L.map(mapRef.current, {
          center: [41.8, -74.5],
          zoom: 8,
        });
        mapInstance.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Force a resize after initialization to fix rendering issues
        setTimeout(() => {
          map.invalidateSize();
        }, 100);

        loaded.value = true;
      } catch (err) {
        console.error('Failed to initialize map:', err);
        error.value = err instanceof Error ? err.message : 'Failed to load map';
      }
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
          fillColor: defaultMarkerColor,
          color: defaultBorderColor,
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
            fillColor: qualityHexColors[cond.fishingQuality],
            color: qualityHexColors[cond.fishingQuality],
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
                ${waterTemp != null ? `💧 Water: <strong>${waterTemp}°F</strong><br>` : ''}
                ${flow != null ? `🌊 Flow: <strong>${flow} cfs</strong><br>` : ''}
                ${topHatch ? `🪰 ${topHatch}<br>` : ''}
              </div>
              <div style="margin-top: 8px">
                <span style="
                  background: ${qualityHexColors[cond.fishingQuality]};
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

  // Error state
  if (error.value) {
    return (
      <div class='flex items-center justify-center h-full bg-red-50'>
        <div class='text-center'>
          <div class='text-red-500 text-lg mb-2'>⚠️ Map Error</div>
          <div class='text-red-400 text-sm'>{error.value}</div>
        </div>
      </div>
    );
  }

  return (
    <div class='relative w-full h-full'>
      {/* Map container - always rendered */}
      <div
        ref={mapRef}
        class='absolute inset-0'
        style={{ zIndex: 1 }}
      />

      {/* Loading overlay - positioned above map container */}
      {!loaded.value && (
        <div
          class='absolute inset-0 flex items-center justify-center bg-slate-100'
          style={{ zIndex: 2 }}
        >
          <div class='text-center'>
            <div class='animate-pulse text-slate-500 text-lg'>🗺️</div>
            <div class='text-slate-500 mt-2'>Loading map...</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Declare Leaflet types
declare global {
  const L: typeof import('leaflet');
}
