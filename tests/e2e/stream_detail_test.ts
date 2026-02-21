import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from '@std/testing/bdd';
import {
  assertVisible,
  type Browser,
  clickAndNavigate,
  launchBrowser,
  navigateTo,
  type Page,
  type ServerHandle,
  startServer,
  waitForText,
} from './helpers/mod.ts';
import { assertEquals, assertMatch } from '@std/assert';

describe('Stream Detail Page', () => {
  let server: ServerHandle;
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    server = await startServer();
    browser = await launchBrowser();
  });

  afterAll(async () => {
    await browser.close();
    await server.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  it('loads conditions for a known stream', async () => {
    await navigateTo(page, '/streams/beaverkill');

    // Back link should be present (server-rendered, allow extra time for initial page load)
    await assertVisible(page, '[data-testid="back-to-streams"]', 15_000);

    // StreamConditionsCard island loads data — wait for a rounded-lg card or error state
    await assertVisible(page, '[class*="rounded-lg"]', 20_000);
  });

  it('shows back link that navigates to streams list', async () => {
    await navigateTo(page, '/streams/beaverkill');

    await assertVisible(page, '[data-testid="back-to-streams"]');

    await clickAndNavigate(page, '[data-testid="back-to-streams"]');
    assertMatch(page.url, /\/streams$/);
  });

  it('displays error for non-existent stream', async () => {
    await navigateTo(page, '/streams/nonexistent-stream-xyz');

    // Should show error state with link back
    await waitForText(page, 'Stream not found');
    await assertVisible(page, '[data-testid="back-to-streams"]');
  });

  it('stream detail page has correct page title', async () => {
    await navigateTo(page, '/streams/esopus');
    const title = await page.evaluate(() => document.title);
    assertEquals(title, 'Upstate Fishing');
  });
});
