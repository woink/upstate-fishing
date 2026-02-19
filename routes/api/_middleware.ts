import { FreshContext } from '$fresh/server.ts';

export const handler = [
  async function corsMiddleware(req: Request, ctx: FreshContext) {
    const origin = req.headers.get('origin');
    const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:8000')
      .split(',')
      .map((o) => o.trim());

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...(origin && allowedOrigins.includes(origin)
            ? { 'Access-Control-Allow-Origin': origin }
            : {}),
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const resp = await ctx.next();

    if (origin && allowedOrigins.includes(origin)) {
      resp.headers.set('Access-Control-Allow-Origin', origin);
    }

    return resp;
  },
];
