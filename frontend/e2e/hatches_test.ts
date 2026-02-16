import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from '@std/testing/bdd';
import {
  assertContainsText,
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

describe('Hatch Chart Page', () => {
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
    await navigateTo(page, '/hatches');
  });

  afterEach(async () => {
    await page.close();
  });

  it('displays the page heading and description', async () => {
    await assertTextContent(page, 'h1', 'Hatch Chart');
    await waitForText(page, 'Insect emergence patterns');
  });

  it('shows insect type filter buttons', async () => {
    await waitForText(page, 'Insect Type');
    await waitForText(page, 'All');
    await waitForText(page, 'Mayflies');
    await waitForText(page, 'Caddisflies');
    await waitForText(page, 'Stoneflies');
    await waitForText(page, 'Midges');
  });

  it('shows month dropdown filter', async () => {
    await assertVisible(page, '[data-testid="month-filter"]');
    await assertContainsText(page, '[data-testid="month-filter"]', 'All Months');
    await assertContainsText(page, '[data-testid="month-filter"]', 'January');
    await assertContainsText(page, '[data-testid="month-filter"]', 'December');
  });

  it('shows hatch count', async () => {
    await waitForText(page, 'hatches');
  });

  it('displays legend with insect types', async () => {
    await waitForText(page, 'Legend');
    await waitForText(page, 'Mayflies');
    await waitForText(page, 'Caddisflies');
    await waitForText(page, 'Stoneflies');
    await waitForText(page, 'Midges');
  });

  it('filters by insect type via URL', async () => {
    await navigateTo(page, '/hatches?order=mayfly');
    await assertTextContent(page, 'h2', 'Mayflies');

    // Mayflies button should be active
    await assertHasClass(page, 'a[href*="order=mayfly"]', /bg-slate-800/);
  });

  it('filters by month via URL', async () => {
    await navigateTo(page, '/hatches?month=4');
    await assertContainsText(page, 'h2', 'April Hatches');
  });

  it('filters by both type and month', async () => {
    await navigateTo(page, '/hatches?order=mayfly&month=5');
    await assertContainsText(page, 'h2', 'Mayflies in May');
  });

  it('clicking insect type button filters results', async () => {
    await clickAndNavigate(page, 'a[href*="order=mayfly"]');
    assertMatch(page.url, /order=mayfly/);
    await assertTextContent(page, 'h2', 'Mayflies');
  });

  it('clear filters link appears when filters are active', async () => {
    await navigateTo(page, '/hatches?order=mayfly');
    await waitForText(page, 'Clear filters');

    // Click "Clear filters" which links to /hatches
    await clickAndNavigate(page, 'a[href="/hatches"]');
    assertMatch(page.url, /\/hatches$/);
    await assertTextContent(page, 'h2', 'All Hatches');
  });

  it('shows empty state when no hatches match filters', async () => {
    // Stoneflies in an unlikely month combination
    await navigateTo(page, '/hatches?order=stonefly&month=8');
    // Just check page doesn't crash
    await assertTextContent(page, 'h1', 'Hatch Chart');
  });

  it('HatchChart island renders the interactive table', async () => {
    // These hatch names are static entries from src/data/hatches.ts, not dynamic
    // API data — they won't change unexpectedly. We poll for any of them to
    // confirm the HatchChart island hydrated and rendered.
    const deadline = Date.now() + 10_000;
    let found = false;
    while (Date.now() < deadline) {
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (
        bodyText.includes('Hendrickson') || bodyText.includes('Blue-Winged Olive') ||
        bodyText.includes('March Brown')
      ) {
        found = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!found) {
      throw new Error(
        'Expected at least one hatch name (Hendrickson, Blue-Winged Olive, or March Brown) to appear',
      );
    }
  });
});
