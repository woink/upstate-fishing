import { type FreshContext } from 'fresh';

export const handler = [
  async function corsMiddleware(ctx: FreshContext) {
    const origin = ctx.req.headers.get('origin');
    const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:8000')
      .split(',')
      .map((o) => o.trim());

    if (ctx.req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...(origin && allowedOrigins.includes(origin)
            ? { 'Access-Control-Allow-Origin': origin }
            : {}),
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin',
        },
      });
    }

    const resp = await ctx.next();

    if (origin && allowedOrigins.includes(origin)) {
      resp.headers.set('Access-Control-Allow-Origin', origin);
    }
    resp.headers.set('Vary', 'Origin');

    return resp;
  },
];
