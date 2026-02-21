import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import type { Stream, StreamConditions } from '@shared/models/types.ts';
import { defaultBorderColor, defaultMarkerColor, qualityHexColors } from '@shared/lib/colors.ts';
import { promisePool } from '@shared/lib/promise-pool.ts';

const FAILED_MARKER_COLOR = '#94a3b8'; // slate-400

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
        await new Promise((resolve) => setTimeout(resolve, 0));

        if (!mapRef.current) {
          error.value = 'Map container not found';
          return;
        }

        // Prevent double initialization
        if (mapInstance.current) return;

        // Initial center — will be overridden by fitBounds once markers are added
        const map = L.map(mapRef.current, {
          center: [39.0, -78.0],
          zoom: 6,
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
    const markers = new Map<string, L.CircleMarker>();

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

      markers.set(stream.id, marker);

      // Initial popup
      marker.bindPopup(`
        <div style="min-width: 150px">
          <strong>${stream.name}</strong><br>
          <span style="color: #64748b; font-size: 12px">${stream.region} • ${stream.state}</span><br>
          <span style="color: #94a3b8; font-size: 11px">Loading conditions...</span>
        </div>
      `);
    });

    // Fit map to all stream markers
    const streamsWithCoords = streams.filter((s) => s.coordinates);
    if (streamsWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        streamsWithCoords.map((s) => [s.coordinates!.latitude, s.coordinates!.longitude]),
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }

    // Fetch conditions with concurrency limiting
    const tasks = streamsWithCoords
      .map((stream) => async () => {
        const res = await fetch(`${apiUrl}/api/streams/${stream.id}/conditions`);
        const json = await res.json();
        return { stream, json };
      });

    promisePool(tasks, 4).then((results) => {
      const newConditions: Record<string, StreamConditions> = {};

      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        // Use the stream from the task result (fulfilled) or the parallel array (rejected)
        const stream = result.status === 'fulfilled' ? result.value.stream : streamsWithCoords[i];
        if (!stream) continue;

        const marker = markers.get(stream.id);
        if (!marker) continue;

        if (result.status === 'fulfilled' && result.value.json.success && result.value.json.data) {
          const cond: StreamConditions = result.value.json.data;
          newConditions[stream.id] = cond;

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
                ${waterTemp != null ? `Water: <strong>${waterTemp}°F</strong><br>` : ''}
                ${flow != null ? `Flow: <strong>${flow} cfs</strong><br>` : ''}
                ${topHatch ? `${topHatch}<br>` : ''}
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
              ">View details</a>
            </div>
          `);
        } else {
          // Failed — update marker to indicate error
          marker.setStyle({
            fillColor: FAILED_MARKER_COLOR,
            color: FAILED_MARKER_COLOR,
          });
          marker.setPopupContent(`
            <div style="min-width: 150px">
              <strong>${stream.name}</strong><br>
              <span style="color: #64748b; font-size: 12px">${stream.region} • ${stream.state}</span><br>
              <span style="color: #ef4444; font-size: 11px">Failed to load conditions</span>
            </div>
          `);
        }
      }

      conditionsMap.value = { ...conditionsMap.value, ...newConditions };
    });
  }, [loaded.value, streams, apiUrl]);

  // Error state
  if (error.value) {
    return (
      <div class='flex items-center justify-center h-full bg-red-50'>
        <div class='text-center'>
          <div class='text-red-500 text-lg mb-2'>Map Error</div>
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
            <div class='animate-pulse text-slate-500 text-lg'>Loading map...</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Leaflet types are declared in types/global.d.ts
