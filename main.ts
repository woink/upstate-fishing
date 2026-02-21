/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { loadSync } from '@std/dotenv';
try {
  loadSync({ export: true, examplePath: null });
} catch {
  // .env file absent (e.g. Deno Deploy) — env vars set via dashboard
}

import { App, staticFiles } from 'fresh';

export const app = new App()
  .use(staticFiles())
  .fsRoutes();

export default app;
