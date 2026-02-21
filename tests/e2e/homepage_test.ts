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
import { assertMatch } from '@std/assert';

describe('Homepage', () => {
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
    await navigateTo(page, '/');
  });

  afterEach(async () => {
    await page.close();
  });

  it('displays the main heading and description', async () => {
    await assertTextContent(page, 'h1', 'Where should I fish today?');
    await waitForText(page, 'Real-time conditions and hatch predictions');
  });

  it('shows navigation bar with all links', async () => {
    await assertVisible(page, 'nav');
    await waitForText(page, 'Upstate Fishing');
    await assertVisible(page, 'nav a[href="/"]');
    await assertVisible(page, 'nav a[href="/streams"]');
    await assertVisible(page, 'nav a[href="/hatches"]');
    await assertVisible(page, 'nav a[href="/map"]');
  });

  it('shows quick links section with region links', async () => {
    await waitForText(page, 'Quick Links');
    await assertVisible(page, 'a[href="/streams?region=catskills"]');
    await assertVisible(page, 'a[href="/streams?region=delaware"]');
    await assertVisible(page, 'a[href="/streams?region=croton"]');
    await assertVisible(page, 'a[href="/streams?state=NJ"]');
  });

  it('shows hatch calendar section with link', async () => {
    await waitForText(page, 'Hatch Calendar');
    await assertVisible(page, 'a[href="/hatches"]');
  });

  it('shows footer with data attribution', async () => {
    await assertContainsText(page, 'footer', 'Data from USGS and Weather.gov');
  });

  it('loads Top Picks island with stream recommendations', async () => {
    // TopPicks island loads async and hits live USGS/Weather APIs, so we can't
    // assert on specific data. Instead, verify the island resolved to any terminal
    // state — success ("Top Picks"), error ("No conditions data"), or retry prompt.
    // This confirms the island hydrated, fetched, and rendered.
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (
        bodyText.includes('Top Picks') ||
        bodyText.includes('No conditions data') ||
        bodyText.includes('Retry')
      ) {
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error('TopPicks island did not finish loading within 30 seconds');
  });

  it('navigates to streams page via quick link', async () => {
    await clickAndNavigate(page, 'a[href="/streams?region=catskills"]');
    assertMatch(page.url, /\/streams\?region=catskills/);
    await assertContainsText(page, 'h1', 'Catskills');
  });

  it('navigates to hatch chart via button', async () => {
    await clickAndNavigate(page, 'a[href="/hatches"]');
    assertMatch(page.url, /\/hatches/);
    await assertTextContent(page, 'h1', 'Hatch Chart');
  });
});
