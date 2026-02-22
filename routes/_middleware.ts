import { FreshContext } from '$fresh/server.ts';
import { createRequestLogger } from '@shared/utils/logger.ts';

export const handler = [
  async function requestLogger(req: Request, ctx: FreshContext) {
    const requestId = crypto.randomUUID();
    const log = createRequestLogger(requestId);
    const url = new URL(req.url);
    const start = performance.now();

    log.info('request start', { method: req.method, path: url.pathname });

    const resp = await ctx.next();
    const durationMs = Math.round(performance.now() - start);

    log.info('request end', {
      method: req.method,
      path: url.pathname,
      status: resp.status,
      durationMs,
    });

    resp.headers.set('X-Request-Id', requestId);
    return resp;
  },

  async function securityHeaders(req: Request, ctx: FreshContext) {
    const resp = await ctx.next();

    resp.headers.set('X-Content-Type-Options', 'nosniff');
    resp.headers.set('X-Frame-Options', 'DENY');
    resp.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    resp.headers.set('X-DNS-Prefetch-Control', 'off');

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.tile.openstreetmap.org",
      "connect-src 'self'",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "worker-src 'self'",
    ].join('; ');
    resp.headers.set('Content-Security-Policy', csp);

    const isHttps = req.headers.get('x-forwarded-proto') === 'https' ||
      req.url.startsWith('https:');
    if (isHttps) {
      resp.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload',
      );
    }

    return resp;
  },
];
