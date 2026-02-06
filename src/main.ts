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
// App Configuration
// ============================================================================

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());
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
