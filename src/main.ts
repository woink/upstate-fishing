/**
 * Fishing Conditions API Server
 * Main entry point
 */

import { Hono } from '@hono/hono';
import { cors } from '@hono/hono/cors';
import { logger } from '@hono/hono/logger';
import { prettyJSON } from '@hono/hono/pretty-json';
import { api } from './routes/api.ts';

// ============================================================================
// CORS Configuration
// ============================================================================

/**
 * Parse allowed origins from environment variable.
 * CORS_ORIGINS can be:
 * - "*" for all origins (not recommended for production)
 * - Comma-separated list of origins: "http://localhost:8001,https://fishing.example.com"
 */
function getCorsOrigins(): string | string[] {
  const originsEnv = Deno.env.get('CORS_ORIGINS');

  // Default: allow common development origins
  if (!originsEnv) {
    return [
      'http://localhost:8001', // Fresh dev server
      'http://localhost:3000', // Alternative dev port
      'http://127.0.0.1:8001',
    ];
  }

  // Allow all origins (use with caution)
  if (originsEnv === '*') {
    return '*';
  }

  // Parse comma-separated list
  return originsEnv.split(',').map((origin) => origin.trim());
}

const corsOrigins = getCorsOrigins();

// ============================================================================
// App Configuration
// ============================================================================

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: corsOrigins,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Accept',
      'X-Forwarded-For',
      'X-Real-IP',
      'X-Forwarded-Proto',
      'X-Forwarded-Host',
    ],
    exposeHeaders: ['Content-Type', 'Content-Length'],
    maxAge: 86400, // 24 hours
    credentials: false,
  }),
);
app.use('*', prettyJSON());

// ============================================================================
// Routes
// ============================================================================

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'Fishing Conditions API',
    version: '0.1.0',
    status: 'ok',
    endpoints: {
      streams: '/api/streams',
      hatches: '/api/hatches',
      stations: '/api/stations/:id',
      conditions: '/api/streams/:id/conditions',
      predict: 'POST /api/predict',
    },
  });
});

// API routes
app.route('/api', api);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        error: 'Not found',
        code: 'NOT_FOUND',
      },
      timestamp: new Date().toISOString(),
    },
    404,
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      error: {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: err instanceof Error ? err.message : String(err),
      },
      timestamp: new Date().toISOString(),
    },
    500,
  );
});

// ============================================================================
// Server Start
// ============================================================================

const port = parseInt(Deno.env.get('PORT') ?? '8000', 10);

console.log(`🎣 Fishing Conditions API starting on http://localhost:${port}`);

Deno.serve({ port }, app.fetch);
