import { type Handlers, type PageProps } from 'fresh';
import TopPicks from '../islands/TopPicks.tsx';

interface HomeData {
  apiUrl: string;
}

export const handler: Handlers<HomeData> = {
  GET(ctx) {
    // Use empty string for relative URLs - the frontend proxies /api/* to backend
    const apiUrl = '';
    return ctx.render({ apiUrl });
  },
};

export default function Home({ data }: PageProps<HomeData>) {
  return (
    <div>
      <section class='mb-8'>
        <h1 class='text-3xl font-bold text-slate-800 mb-2'>
          Where should I fish today?
        </h1>
        <p class='text-slate-600'>
          Real-time conditions and hatch predictions for NY, NJ, CT, and NC streams.
        </p>
      </section>

      <TopPicks apiUrl={data.apiUrl} />

      <section class='mt-8 grid md:grid-cols-2 gap-6'>
        <div class='bg-white rounded-lg shadow p-6'>
          <h2 class='text-xl font-semibold text-slate-800 mb-3'>📍 Quick Links</h2>
          <ul class='space-y-2'>
            <li>
              <a href='/streams?region=catskills' class='text-stream-600 hover:underline'>
                Catskills Streams
              </a>
            </li>
            <li>
              <a href='/streams?region=delaware' class='text-stream-600 hover:underline'>
                Delaware System
              </a>
            </li>
            <li>
              <a href='/streams?region=croton' class='text-stream-600 hover:underline'>
                Croton Watershed
              </a>
            </li>
            <li>
              <a href='/streams?state=NJ' class='text-stream-600 hover:underline'>
                New Jersey Waters
              </a>
            </li>
            <li>
              <a href='/streams?state=CT' class='text-stream-600 hover:underline'>
                Connecticut Waters
              </a>
            </li>
            <li>
              <a href='/streams?state=NC' class='text-stream-600 hover:underline'>
                NC Streams
              </a>
            </li>
          </ul>
        </div>

        <div class='bg-white rounded-lg shadow p-6'>
          <h2 class='text-xl font-semibold text-slate-800 mb-3'>🪰 Hatch Calendar</h2>
          <p class='text-slate-600 text-sm mb-3'>
            Current month's expected hatches based on typical emergence timing.
          </p>
          <a
            href='/hatches'
            class='inline-block bg-forest-600 text-white px-4 py-2 rounded hover:bg-forest-700 transition'
          >
            View Hatch Chart
          </a>
        </div>
      </section>
    </div>
  );
}
