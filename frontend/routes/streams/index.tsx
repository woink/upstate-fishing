import { Handlers, PageProps } from "$fresh/server.ts";
import type { Stream } from "@shared/models/types.ts";
import StreamList from "../../islands/StreamList.tsx";

interface StreamsPageData {
  streams: Stream[];
  region?: string;
  state?: string;
  apiUrl: string;
}

export const handler: Handlers<StreamsPageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const region = url.searchParams.get("region") ?? undefined;
    const state = url.searchParams.get("state") ?? undefined;

    const backendUrl = Deno.env.get("API_URL") ?? "http://localhost:8000";

    let apiEndpoint = `${backendUrl}/api/streams`;
    if (region) {
      apiEndpoint += `?region=${region}`;
    } else if (state) {
      apiEndpoint += `?state=${state}`;
    }

    try {
      const response = await fetch(apiEndpoint);
      const json = await response.json();

      return ctx.render({
        streams: json.data ?? [],
        region,
        state,
        apiUrl: "", // Relative URL for client-side fetches via proxy
      });
    } catch (error) {
      console.error("Failed to fetch streams:", error);
      return ctx.render({
        streams: [],
        region,
        state,
        apiUrl: "", // Relative URL for client-side fetches via proxy
      });
    }
  },
};

const regionLabels: Record<string, string> = {
  catskills: "Catskills",
  delaware: "Delaware System",
  croton: "Croton Watershed",
  raritan: "Raritan / NJ",
};

export default function StreamsPage({ data }: PageProps<StreamsPageData>) {
  const { streams, region, state, apiUrl } = data;

  const title = region
    ? `${regionLabels[region] ?? region} Streams`
    : state
    ? `${state} Streams`
    : "All Streams";

  return (
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-slate-800">{title}</h1>
        <div class="flex gap-2">
          <a
            href="/streams"
            class={`px-3 py-1 rounded text-sm ${
              !region && !state ? "bg-forest-600 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            All
          </a>
          {Object.entries(regionLabels).map(([key, label]) => (
            <a
              key={key}
              href={`/streams?region=${key}`}
              class={`px-3 py-1 rounded text-sm ${
                region === key ? "bg-forest-600 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <StreamList streams={streams} apiUrl={apiUrl} />
    </div>
  );
}
