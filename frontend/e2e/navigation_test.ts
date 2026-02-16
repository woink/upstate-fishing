import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from '@std/testing/bdd';
import {
  assertTextContent,
  assertVisible,
  type Browser,
  clickAndNavigate,
  launchBrowser,
  navigateTo,
  type Page,
  type ServerHandle,
  startServer,
  url,
  waitForText,
} from './helpers/mod.ts';
import { assert, assertEquals, assertMatch } from '@std/assert';

describe('Site Navigation', () => {
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

  it('navigates from home to streams via nav bar', async () => {
    await navigateTo(page, '/');
    await clickAndNavigate(page, 'nav a[href="/streams"]');
    assertMatch(page.url, /\/streams$/);
    await assertTextContent(page, 'h1', 'All Streams');
  });

  it('navigates from home to hatches via nav bar', async () => {
    await navigateTo(page, '/');
    await clickAndNavigate(page, 'nav a[href="/hatches"]');
    assertMatch(page.url, /\/hatches$/);
    await assertTextContent(page, 'h1', 'Hatch Chart');
  });

  it('navigates from home to map via nav bar', async () => {
    await navigateTo(page, '/');
    await clickAndNavigate(page, 'nav a[href="/map"]');
    assertMatch(page.url, /\/map$/);
    await assertTextContent(page, 'h1', 'Sensor Map');
  });

  it('logo links back to homepage', async () => {
    await navigateTo(page, '/streams');
    // The first a[href="/"] in nav is the logo
    await clickAndNavigate(page, 'nav a[href="/"]');
    assertMatch(page.url, /localhost:8000\/$/);
    await assertTextContent(page, 'h1', 'Where should I fish today?');
  });

  it('full user journey: home -> streams -> detail -> back', async () => {
    // Start at home
    await navigateTo(page, '/');
    await assertTextContent(page, 'h1', 'Where should I fish today?');

    // Go to streams
    await clickAndNavigate(page, 'nav a[href="/streams"]');
    assertMatch(page.url, /\/streams$/);

    // Wait for stream list to load, then click first stream
    const streamLink = await page.waitForSelector('a[href^="/streams/"]', { timeout: 15_000 });
    await Promise.all([
      page.waitForNavigation(),
      streamLink.click(),
    ]);

    // Should be on a stream detail page
    assertMatch(page.url, /\/streams\/.+/);
    await assertVisible(page, '[data-testid="back-to-streams"]');

    // Go back to streams list
    await clickAndNavigate(page, '[data-testid="back-to-streams"]');
    assertMatch(page.url, /\/streams$/);
  });

  it('full user journey: home -> hatches -> filter -> clear', async () => {
    await navigateTo(page, '/');

    // Navigate to hatches
    await clickAndNavigate(page, 'nav a[href="/hatches"]');
    assertMatch(page.url, /\/hatches$/);
    await assertTextContent(page, 'h2', 'All Hatches');

    // Filter by mayfly
    await clickAndNavigate(page, 'a[href*="order=mayfly"]');
    assertMatch(page.url, /order=mayfly/);
    await assertTextContent(page, 'h2', 'Mayflies');

    // Clear filters
    await waitForText(page, 'Clear filters');
    await clickAndNavigate(page, 'a[href="/hatches"]');
    assertMatch(page.url, /\/hatches$/);
  });
});

describe('API Routes', () => {
  let server: ServerHandle;

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /api/streams returns stream data', async () => {
    const response = await fetch(url('/api/streams'));
    assert(response.ok);

    const body = await response.json();
    assertEquals(body.success, true);
    assert(body.data !== undefined);
    assert(Array.isArray(body.data));
    assert(body.data.length > 0);
  });

  it('GET /api/streams supports region filter', async () => {
    const response = await fetch(url('/api/streams?region=catskills'));
    assert(response.ok);

    const body = await response.json();
    assertEquals(body.success, true);
    assert(body.data.length > 0);
  });

  it('GET /api/hatches returns hatch data', async () => {
    const response = await fetch(url('/api/hatches'));
    assert(response.ok);

    const body = await response.json();
    assertEquals(body.success, true);
    assert(body.data !== undefined);
    assert(Array.isArray(body.data));
    assert(body.data.length > 0);
  });

  it('GET /api/hatches supports order filter', async () => {
    const response = await fetch(url('/api/hatches?order=mayfly'));
    assert(response.ok);

    const body = await response.json();
    assertEquals(body.success, true);
    assert(body.data.length > 0);
  });

  it('GET /api/streams/{id}/conditions returns conditions', async () => {
    const response = await fetch(url('/api/streams/beaverkill/conditions'));
    assert(response.ok);

    const body = await response.json();
    assertEquals(body.success, true);
    assert(body.data !== undefined);
  });

  it('GET /api/streams/{id} returns 404 for unknown stream', async () => {
    const response = await fetch(url('/api/streams/nonexistent-stream-xyz'));
    assertEquals(response.status, 404);

    const body = await response.json();
    assertEquals(body.success, false);
    assert(body.error !== undefined);
  });

  it('GET /api/hatches/{id} returns 404 for unknown hatch', async () => {
    const response = await fetch(url('/api/hatches/nonexistent-hatch-xyz'));
    assertEquals(response.status, 404);

    const body = await response.json();
    assertEquals(body.success, false);
    assert(body.error !== undefined);
  });

  it('GET /api/streams with invalid region still returns 200', async () => {
    const response = await fetch(url('/api/streams?region=nonexistent'));
    assert(response.ok);

    const body = await response.json();
    assertEquals(body.success, true);
    assert(body.data.length > 0);
  });
});
