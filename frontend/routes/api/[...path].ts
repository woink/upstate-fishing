/**
 * API Proxy Route
 *
 * Proxies all /api/* requests to the backend API.
 * This allows client-side islands to use relative URLs
 * that work regardless of where the user accesses the frontend from.
 */

import { Handlers } from "$fresh/server.ts";

const BACKEND_URL = Deno.env.get("API_URL") ?? "http://localhost:8000";

export const handler: Handlers = {
  async GET(req, ctx) {
    const path = ctx.params.path;
    const url = new URL(req.url);
    const backendUrl = `${BACKEND_URL}/api/${path}${url.search}`;

    try {
      const res = await fetch(backendUrl, {
        headers: {
          "Accept": "application/json",
        },
      });

      const body = await res.text();

      return new Response(body, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("Content-Type") ?? "application/json",
        },
      });
    } catch (error) {
      console.error(`Proxy error for /api/${path}:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Backend unavailable",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  async POST(req, ctx) {
    const path = ctx.params.path;
    const url = new URL(req.url);
    const backendUrl = `${BACKEND_URL}/api/${path}${url.search}`;

    try {
      const body = await req.text();
      const res = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": req.headers.get("Content-Type") ?? "application/json",
          "Accept": "application/json",
        },
        body,
      });

      const responseBody = await res.text();

      return new Response(responseBody, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("Content-Type") ?? "application/json",
        },
      });
    } catch (error) {
      console.error(`Proxy error for POST /api/${path}:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Backend unavailable",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
