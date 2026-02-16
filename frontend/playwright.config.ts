import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for the Upstate Fishing Fresh app.
 *
 * The Fresh dev server must be running on port 8000 before tests execute.
 * In CI, the `webServer` block handles startup automatically.
 * Locally, run `deno task dev` in a separate terminal first, or rely on
 * the webServer config below.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: process.env.CI
      ? 'deno run -A --unstable-kv --node-modules-dir=none dev.ts'
      : 'deno task dev',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
