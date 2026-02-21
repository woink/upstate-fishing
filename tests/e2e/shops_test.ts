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
  waitForText,
} from './helpers/mod.ts';
import { assertMatch } from '@std/assert';

describe('Fly Shops Page', () => {
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
    await navigateTo(page, '/shops');
  });

  afterEach(async () => {
    await page.close();
  });

  it('displays the page title and filter buttons', async () => {
    await assertTextContent(page, 'h1', 'All Fly Shops');

    // State tabs
    await assertVisible(page, 'a[href="/shops"]');
    await assertVisible(page, 'a[href="/shops?state=NY"]');
    await assertVisible(page, 'a[href="/shops?state=NJ"]');
    await assertVisible(page, 'a[href="/shops?state=CT"]');
    await assertVisible(page, 'a[href="/shops?state=NC"]');

    // Region filter buttons
    await assertVisible(page, 'a[href="/shops?region=catskills"]');
    await assertVisible(page, 'a[href="/shops?region=raritan"]');
    await assertVisible(page, 'a[href="/shops?region=connecticut"]');
  });

  it('"All" filter is active by default', async () => {
    await assertHasClass(
      page,
      'main a[href="/shops"]',
      /bg-forest-600/,
    );
  });

  it('filters shops by Catskills region', async () => {
    await clickAndNavigate(page, 'a[href="/shops?region=catskills"]');
    assertMatch(page.url, /region=catskills/);
    await assertTextContent(page, 'h1', 'Catskills Fly Shops');
    await assertHasClass(page, 'a[href="/shops?region=catskills"]', /bg-stream-600/);
  });

  it('clicking "All" clears the filter', async () => {
    await navigateTo(page, '/shops?region=catskills');
    await assertTextContent(page, 'h1', 'Catskills Fly Shops');

    await clickAndNavigate(page, 'main a[href="/shops"]');
    assertMatch(page.url, /\/shops$/);
    await assertTextContent(page, 'h1', 'All Fly Shops');
  });

  it('shows shop cards with name and address', async () => {
    await waitForText(page, 'Beaverkill Angler');
    await assertVisible(page, 'a[href^="/shops/"]');
  });

  it('clicking a shop navigates to detail page', async () => {
    const shopLink = await page.waitForSelector('a[href^="/shops/"]', { timeout: 10_000 });
    const href = await shopLink.evaluate((el: Element) => el.getAttribute('href'));

    await Promise.all([
      page.waitForNavigation(),
      shopLink.click(),
    ]);

    assertMatch(page.url, new RegExp(href!));
  });
});

describe('Fly Shop Detail Page', () => {
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

  it('displays shop details', async () => {
    await navigateTo(page, '/shops/beaverkill-angler');
    await waitForText(page, 'Beaverkill Angler');
    await waitForText(page, 'Roscoe');
    await waitForText(page, '(607) 498-5194');
  });

  it('shows nearby streams section', async () => {
    await navigateTo(page, '/shops/beaverkill-angler');
    await waitForText(page, 'Nearby Streams');
    await assertVisible(page, 'a[href^="/streams/"]');
  });

  it('shows back to shops link', async () => {
    await navigateTo(page, '/shops/beaverkill-angler');
    await assertVisible(page, '[data-testid="back-to-shops"]');
  });

  it('shows error for nonexistent shop', async () => {
    await navigateTo(page, '/shops/nonexistent');
    await waitForText(page, 'Fly shop not found');
    await assertVisible(page, '[data-testid="back-to-shops"]');
  });
});

describe('Fly Shops - State Filtering', () => {
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

  it('filters shops by NJ state', async () => {
    await navigateTo(page, '/shops?state=NJ');
    await assertTextContent(page, 'h1', 'NJ Fly Shops');
  });

  it('filters shops by NY state', async () => {
    await navigateTo(page, '/shops?state=NY');
    await assertTextContent(page, 'h1', 'NY Fly Shops');
  });

  it('filters shops by CT state', async () => {
    await navigateTo(page, '/shops?state=CT');
    await assertTextContent(page, 'h1', 'CT Fly Shops');
  });

  it('filters shops by NC state', async () => {
    await navigateTo(page, '/shops?state=NC');
    await assertTextContent(page, 'h1', 'NC Fly Shops');
  });
});

describe('Navigation - Fly Shops Link', () => {
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

  it('nav bar contains Fly Shops link', async () => {
    await navigateTo(page, '/');
    await assertVisible(page, 'nav a[href="/shops"]');
  });

  it('clicking Fly Shops nav link goes to shops page', async () => {
    await navigateTo(page, '/');
    await clickAndNavigate(page, 'nav a[href="/shops"]');
    assertMatch(page.url, /\/shops$/);
    await assertTextContent(page, 'h1', 'All Fly Shops');
  });
});
