import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from '@std/testing/bdd';
import {
  assertHasClass,
  assertTextContent,
  assertVisible,
  type Browser,
  clickAndNavigate,
  launchBrowser,
  navigateTo,
  type Page,
  type ServerHandle,
  startServer,
} from './helpers/mod.ts';
import { assertMatch } from '@std/assert';

describe('Streams Page', () => {
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
    await navigateTo(page, '/streams');
  });

  afterEach(async () => {
    await page.close();
  });

  it('displays the page title and filter buttons', async () => {
    await assertTextContent(page, 'h1', 'All Streams');

    // Region filter buttons
    await assertVisible(page, 'a[href="/streams"]');
    await assertVisible(page, 'a[href="/streams?region=catskills"]');
    await assertVisible(page, 'a[href="/streams?region=delaware"]');
    await assertVisible(page, 'a[href="/streams?region=croton"]');
    await assertVisible(page, 'a[href="/streams?region=raritan"]');
  });

  it('"All" filter is active by default', async () => {
    // The "All" link should have the active bg-forest-600 class
    // There are multiple a[href="/streams"] (nav + filter) — target the filter area
    await assertHasClass(
      page,
      'main a[href="/streams"]',
      /bg-forest-600/,
    );
  });

  it('filters streams by Catskills region', async () => {
    await clickAndNavigate(page, 'a[href="/streams?region=catskills"]');
    assertMatch(page.url, /region=catskills/);
    await assertTextContent(page, 'h1', 'Catskills Streams');

    // Catskills filter should be active
    await assertHasClass(page, 'a[href="/streams?region=catskills"]', /bg-forest-600/);
  });

  it('filters streams by Delaware region', async () => {
    await clickAndNavigate(page, 'a[href="/streams?region=delaware"]');
    assertMatch(page.url, /region=delaware/);
    await assertTextContent(page, 'h1', 'Delaware System Streams');
  });

  it('filters streams by Croton region', async () => {
    await clickAndNavigate(page, 'a[href="/streams?region=croton"]');
    assertMatch(page.url, /region=croton/);
    await assertTextContent(page, 'h1', 'Croton Watershed Streams');
  });

  it('clicking "All" clears the filter', async () => {
    await navigateTo(page, '/streams?region=catskills');
    await assertTextContent(page, 'h1', 'Catskills Streams');

    // Click the "All" filter link in the main content area
    await clickAndNavigate(page, 'main a[href="/streams"]');
    assertMatch(page.url, /\/streams$/);
    await assertTextContent(page, 'h1', 'All Streams');
  });

  it('stream list loads with stream items', async () => {
    // The StreamList island renders stream cards -- wait for at least one
    await assertVisible(page, 'a[href^="/streams/"]', 15_000);
  });

  it('clicking a stream navigates to detail page', async () => {
    const streamLink = await page.waitForSelector('a[href^="/streams/"]', { timeout: 15_000 });
    const href = await streamLink.evaluate((el: Element) => el.getAttribute('href'));

    await Promise.all([
      page.waitForNavigation(),
      streamLink.click(),
    ]);

    assertMatch(page.url, new RegExp(href!));
  });
});

describe('Streams Page - State Filtering', () => {
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

  it('filters streams by NJ state', async () => {
    await navigateTo(page, '/streams?state=NJ');
    await assertTextContent(page, 'h1', 'NJ Streams');
  });

  it('filters streams by NY state', async () => {
    await navigateTo(page, '/streams?state=NY');
    await assertTextContent(page, 'h1', 'NY Streams');
  });
});
