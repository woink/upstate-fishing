import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Upstate Fishing</title>
        <link rel="stylesheet" href="/styles.css" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossorigin=""
        />
      </head>
      <body class="bg-slate-50 min-h-screen">
        <nav class="bg-forest-700 text-white shadow-lg">
          <div class="max-w-6xl mx-auto px-4 py-3">
            <div class="flex items-center justify-between">
              <a href="/" class="text-xl font-bold flex items-center gap-2">
                🎣 Upstate Fishing
              </a>
              <div class="flex gap-4">
                <a href="/" class="hover:text-forest-200 transition">Today</a>
                <a href="/streams" class="hover:text-forest-200 transition">Streams</a>
                <a href="/map" class="hover:text-forest-200 transition">Map</a>
              </div>
            </div>
          </div>
        </nav>
        <main class="max-w-6xl mx-auto px-4 py-6">
          <Component />
        </main>
        <footer class="bg-slate-800 text-slate-400 py-4 mt-8">
          <div class="max-w-6xl mx-auto px-4 text-center text-sm">
            Data from USGS and Weather.gov
          </div>
        </footer>
      </body>
    </html>
  );
}
