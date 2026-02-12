import { Handlers, PageProps } from '$fresh/server.ts';
import type { StreamConditions } from '@shared/models/types.ts';
import StreamConditionsCard from '../../islands/StreamConditionsCard.tsx';

interface StreamDetailData {
  conditions: StreamConditions | null;
  error?: string;
  apiUrl: string;
}

export const handler: Handlers<StreamDetailData> = {
  async GET(_req, ctx) {
    const { id } = ctx.params;
    const backendUrl = Deno.env.get('API_URL') ?? 'http://localhost:8000';

    try {
      const response = await fetch(`${backendUrl}/api/streams/${id}/conditions`);
      const json = await response.json();

      if (!json.success) {
        return ctx.render({
          conditions: null,
          error: json.error?.error ?? 'Failed to load stream',
          apiUrl: '', // Relative URL for client-side fetches
        });
      }

      return ctx.render({
        conditions: json.data,
        apiUrl: '', // Relative URL for client-side fetches
      });
    } catch (error) {
      console.error('Failed to fetch stream conditions:', error);
      return ctx.render({
        conditions: null,
        error: 'Failed to connect to API',
        apiUrl: '', // Relative URL for client-side fetches
      });
    }
  },
};

export default function StreamDetail({ data }: PageProps<StreamDetailData>) {
  const { conditions, error, apiUrl } = data;

  if (error || !conditions) {
    return (
      <div class='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
        <p class='text-red-700'>{error ?? 'Stream not found'}</p>
        <a href='/streams' class='text-stream-600 hover:underline mt-2 inline-block'>
          ← Back to streams
        </a>
      </div>
    );
  }

  return (
    <div>
      <a href='/streams' class='text-stream-600 hover:underline text-sm mb-4 inline-block'>
        ← Back to streams
      </a>

      <StreamConditionsCard conditions={conditions} apiUrl={apiUrl} />
    </div>
  );
}
