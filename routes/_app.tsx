import { type PageProps } from '$fresh/server.ts';
import { Icon } from '../components/ui/Icon.tsx';

export default function App({ Component }: PageProps) {
  return (
    <html lang='en'>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>Upstate Fishing</title>
        <meta
          name='description'
          content='Real-time fishing conditions and hatch predictions for NY, NJ, CT, and NC trout streams.'
        />
        <meta name='theme-color' content='#15803d' />
        <link rel='manifest' href='/manifest.json' />
        <link rel='apple-touch-icon' href='/icons/icon-192.png' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='black-translucent' />
        <meta name='apple-mobile-web-app-title' content='Upstate Fishing' />
        <link rel='stylesheet' href='/styles.css' />
      </head>
      <body class='bg-slate-50 min-h-screen'>
        <nav class='bg-forest-700 text-white shadow-lg'>
          <div class='max-w-6xl mx-auto px-4 py-3'>
            <div class='flex items-center justify-between'>
              <a href='/' class='text-xl font-bold flex items-center gap-2'>
                <Icon name='fish' size='md' class='text-forest-200' /> Upstate Fishing
              </a>
              <div class='flex gap-4'>
                <a href='/' class='hover:text-forest-200 transition'>Today</a>
                <a href='/streams' class='hover:text-forest-200 transition'>Streams</a>
                <a href='/wizard' class='hover:text-forest-200 transition'>Find a Stream</a>
                <a href='/hatches' class='hover:text-forest-200 transition'>Hatches</a>
                <a href='/shops' class='hover:text-forest-200 transition'>Fly Shops</a>
                <a href='/map' class='hover:text-forest-200 transition'>Map</a>
              </div>
            </div>
          </div>
        </nav>
        <main class='max-w-6xl mx-auto px-4 py-6'>
          <Component />
        </main>
        <footer class='bg-slate-800 text-slate-400 py-4 mt-8'>
          <div class='max-w-6xl mx-auto px-4 text-center text-sm'>
            Data from USGS and Weather.gov
          </div>
        </footer>
        <script
          dangerouslySetInnerHTML={{
            __html:
              `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){})}`,
          }}
        />
      </body>
    </html>
  );
}
