import { useSignal } from '@preact/signals';
import type { NearbyStream, Region } from '@shared/models/types.ts';

type Step = 'location' | 'results';

const regionLabels: Record<Region, string> = {
  catskills: 'Catskills',
  delaware: 'Delaware System',
  croton: 'Croton Watershed',
  raritan: 'Raritan / NJ',
  connecticut: 'Connecticut',
  'nc-highcountry': 'NC High Country',
  'nc-foothills': 'NC Foothills',
};

const regions = Object.keys(regionLabels) as Region[];

export default function StreamWizard() {
  const step = useSignal<Step>('location');
  const results = useSignal<NearbyStream[]>([]);
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const locationLabel = useSignal<string>('');

  async function handleGeolocation() {
    if (!('geolocation' in navigator)) {
      error.value = 'Geolocation is not supported by your browser.';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10_000,
          enableHighAccuracy: false,
        });
      });

      const { latitude, longitude } = position.coords;
      locationLabel.value = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      await fetchNearbyStreams(latitude, longitude);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            error.value = 'Location access denied. Try selecting a region instead.';
            break;
          case err.POSITION_UNAVAILABLE:
            error.value = 'Location unavailable. Try selecting a region instead.';
            break;
          case err.TIMEOUT:
            error.value = 'Location request timed out. Try selecting a region instead.';
            break;
        }
      } else {
        error.value = 'Failed to get location. Try selecting a region instead.';
      }
      loading.value = false;
    }
  }

  async function handleRegionSelect(region: Region) {
    loading.value = true;
    error.value = null;
    locationLabel.value = regionLabels[region];

    // Use a central coordinate for the region by fetching all streams and picking the midpoint
    const res = await fetch(`/api/streams?region=${region}`);
    const json = await res.json();
    if (!json.success || !json.data || json.data.length === 0) {
      error.value = 'No streams found for this region.';
      loading.value = false;
      return;
    }

    // Compute centroid of streams in this region
    const coords = json.data
      .filter((s: { coordinates?: { latitude: number; longitude: number } }) => s.coordinates)
      .map((s: { coordinates: { latitude: number; longitude: number } }) => s.coordinates);

    if (coords.length === 0) {
      error.value = 'No coordinates available for this region.';
      loading.value = false;
      return;
    }

    const lat = coords.reduce((sum: number, c: { latitude: number }) => sum + c.latitude, 0) /
      coords.length;
    const lon = coords.reduce((sum: number, c: { longitude: number }) => sum + c.longitude, 0) /
      coords.length;

    await fetchNearbyStreams(lat, lon, 200);
  }

  async function fetchNearbyStreams(lat: number, lon: number, radius = 50) {
    try {
      const res = await fetch(`/api/nearby-streams?lat=${lat}&lon=${lon}&radius=${radius}`);
      const json = await res.json();

      if (json.success && json.data) {
        results.value = json.data;
        step.value = 'results';
      } else {
        error.value = json.error?.error ?? 'Failed to find nearby streams.';
      }
    } catch {
      error.value = 'Network error. Please try again.';
    } finally {
      loading.value = false;
    }
  }

  function handleReset() {
    step.value = 'location';
    results.value = [];
    error.value = null;
    locationLabel.value = '';
  }

  return (
    <div data-testid='stream-wizard'>
      {/* Step indicator */}
      <div class='flex items-center gap-2 mb-6 text-sm text-slate-500'>
        <span class={step.value === 'location' ? 'font-semibold text-forest-700' : ''}>
          1. Location
        </span>
        <span>{'>'}</span>
        <span class={step.value === 'results' ? 'font-semibold text-forest-700' : ''}>
          2. Results
        </span>
      </div>

      {/* Error display */}
      {error.value && (
        <div class='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4'>
          {error.value}
        </div>
      )}

      {/* Loading spinner */}
      {loading.value && (
        <div class='flex items-center justify-center py-12'>
          <div class='w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin'>
          </div>
          <span class='ml-3 text-slate-600'>Finding streams near you...</span>
        </div>
      )}

      {/* Step 1: Location */}
      {step.value === 'location' && !loading.value && (
        <div class='space-y-6'>
          <div class='bg-white rounded-lg shadow p-6'>
            <h2 class='text-lg font-semibold text-slate-800 mb-3'>Use My Location</h2>
            <p class='text-slate-600 text-sm mb-4'>
              Find the closest trout streams based on your current location.
            </p>
            <button
              type='button'
              onClick={handleGeolocation}
              class='bg-forest-600 text-white px-6 py-2 rounded hover:bg-forest-700 transition font-medium'
              data-testid='geolocation-btn'
            >
              Find Streams Near Me
            </button>
          </div>

          <div class='relative'>
            <div class='absolute inset-0 flex items-center'>
              <div class='w-full border-t border-slate-200'></div>
            </div>
            <div class='relative flex justify-center'>
              <span class='bg-slate-50 px-3 text-sm text-slate-500'>or pick a region</span>
            </div>
          </div>

          <div class='bg-white rounded-lg shadow p-6'>
            <h2 class='text-lg font-semibold text-slate-800 mb-3'>Select a Region</h2>
            <div class='grid grid-cols-2 md:grid-cols-3 gap-3'>
              {regions.map((region) => (
                <button
                  key={region}
                  type='button'
                  onClick={() => handleRegionSelect(region)}
                  class='text-left px-4 py-3 rounded border border-slate-200 hover:border-forest-400 hover:bg-forest-50 transition text-sm'
                  data-testid={`region-btn-${region}`}
                >
                  {regionLabels[region]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Results */}
      {step.value === 'results' && !loading.value && (
        <div>
          <div class='flex items-center justify-between mb-4'>
            <div>
              <p class='text-sm text-slate-500'>
                Showing {results.value.length} streams near{' '}
                <span class='font-medium text-slate-700'>{locationLabel.value}</span>
              </p>
            </div>
            <button
              type='button'
              onClick={handleReset}
              class='text-sm text-forest-600 hover:text-forest-700 font-medium'
              data-testid='reset-btn'
            >
              Change Location
            </button>
          </div>

          {results.value.length === 0
            ? (
              <div class='bg-slate-100 rounded-lg p-6 text-center'>
                <p class='text-slate-600'>No streams found within range. Try a larger area.</p>
              </div>
            )
            : (
              <div class='grid gap-3'>
                {results.value.map((stream) => (
                  <a
                    key={stream.streamId}
                    href={`/streams/${stream.streamId}`}
                    class='block bg-white rounded-lg border-l-4 border-forest-400 p-4 shadow hover:shadow-md transition'
                  >
                    <div class='flex items-start justify-between'>
                      <div>
                        <h3 class='font-semibold text-slate-800'>{stream.name}</h3>
                        <p class='text-sm text-slate-500 capitalize'>
                          {stream.region.replace(/-/g, ' ')} &middot; {stream.state}
                        </p>
                      </div>
                      <span class='text-sm font-medium text-forest-700 whitespace-nowrap ml-3'>
                        {stream.distanceMiles} mi
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
