import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from '@std/testing/bdd';
import {
  assertContainsText,
  assertTextContent,
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

describe('Stream Wizard Page', () => {
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
    await navigateTo(page, '/wizard');
  });

  afterEach(async () => {
    await page.close();
  });

  it('displays the page title', async () => {
    await assertTextContent(page, 'h1', 'Find a Stream');
  });

  it('displays the wizard island', async () => {
    await assertVisible(page, '[data-testid="stream-wizard"]');
  });

  it('shows step indicator starting at Location', async () => {
    await waitForText(page, '1. Location');
    await waitForText(page, '2. Results');
  });

  it('displays geolocation button', async () => {
    await assertVisible(page, '[data-testid="geolocation-btn"]');
    await assertContainsText(page, '[data-testid="geolocation-btn"]', 'Find Streams Near Me');
  });

  it('displays region selection buttons', async () => {
    await assertVisible(page, '[data-testid="region-btn-catskills"]');
    await assertVisible(page, '[data-testid="region-btn-delaware"]');
    await assertVisible(page, '[data-testid="region-btn-croton"]');
    await assertVisible(page, '[data-testid="region-btn-raritan"]');
    await assertVisible(page, '[data-testid="region-btn-connecticut"]');
    await assertVisible(page, '[data-testid="region-btn-nc-highcountry"]');
    await assertVisible(page, '[data-testid="region-btn-nc-foothills"]');
  });

  it('clicking a region shows nearby streams results', async () => {
    const btn = await page.waitForSelector('[data-testid="region-btn-catskills"]', {
      timeout: 10_000,
    });
    await btn.click();

    // Wait for results to load
    await waitForText(page, 'Catskills', 15_000);
    await assertVisible(page, '[data-testid="reset-btn"]');
  });

  it('reset button returns to location step', async () => {
    // Select a region first
    const btn = await page.waitForSelector('[data-testid="region-btn-catskills"]', {
      timeout: 10_000,
    });
    await btn.click();

    // Wait for results
    await assertVisible(page, '[data-testid="reset-btn"]', 15_000);

    // Click reset
    const resetBtn = await page.waitForSelector('[data-testid="reset-btn"]');
    await resetBtn.click();

    // Should be back at location step
    await assertVisible(page, '[data-testid="geolocation-btn"]');
  });
});

describe('Stream Wizard Navigation', () => {
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

  it('wizard link appears in navigation bar', async () => {
    await navigateTo(page, '/');
    await assertVisible(page, 'a[href="/wizard"]');
    await assertContainsText(page, 'a[href="/wizard"]', 'Find a Stream');
  });

  it('navigating from homepage to wizard works', async () => {
    await navigateTo(page, '/');
    await clickAndNavigate(page, 'a[href="/wizard"]');
    assertMatch(page.url, /\/wizard/);
    await assertTextContent(page, 'h1', 'Find a Stream');
  });
});

describe('Nearby Streams API', () => {
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

  it('returns nearby streams for valid coordinates', async () => {
    await navigateTo(page, '/api/nearby-streams?lat=41.9&lon=-74.9&radius=50');
    const bodyText = await page.evaluate(() => document.body.innerText);
    const json = JSON.parse(bodyText);

    assertEquals(json.success, true);
    assertEquals(Array.isArray(json.data), true);
    assertEquals(json.data.length > 0, true);

    // First result should be closest stream
    for (const stream of json.data) {
      assertEquals(typeof stream.distanceMiles, 'number');
      assertEquals(typeof stream.name, 'string');
      assertEquals(typeof stream.streamId, 'string');
    }
  });

  it('returns error for missing parameters', async () => {
    await navigateTo(page, '/api/nearby-streams');
    const bodyText = await page.evaluate(() => document.body.innerText);
    const json = JSON.parse(bodyText);

    assertEquals(json.success, false);
  });

  it('results are sorted by distance ascending', async () => {
    await navigateTo(page, '/api/nearby-streams?lat=41.9&lon=-74.9&radius=500');
    const bodyText = await page.evaluate(() => document.body.innerText);
    const json = JSON.parse(bodyText);

    assertEquals(json.success, true);
    for (let i = 1; i < json.data.length; i++) {
      assertEquals(
        json.data[i].distanceMiles >= json.data[i - 1].distanceMiles,
        true,
        'Results should be sorted by distance',
      );
    }
  });
});
