import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from '@std/testing/bdd';
import {
  assertTextContent,
  assertVisible,
  type Browser,
  launchBrowser,
  navigateTo,
  type Page,
  type ServerHandle,
  startServer,
  waitForText,
} from './helpers/mod.ts';

describe('Map Page', () => {
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
    await navigateTo(page, '/map');
  });

  afterEach(async () => {
    await page.close();
  });

  it('displays the page heading and description', async () => {
    await assertTextContent(page, 'h1', 'Sensor Map');
    await waitForText(page, 'USGS monitoring stations');
  });

  it('shows the map container', async () => {
    await assertVisible(page, '[style*="height"]');
  });

  it('displays the quality legend', async () => {
    await waitForText(page, 'Excellent');
    await waitForText(page, 'Good');
    await waitForText(page, 'Fair');
    await waitForText(page, 'Poor');
  });

  it('Leaflet map initializes with tiles', async () => {
    // Leaflet creates a .leaflet-container element when initialized
    await assertVisible(page, '.leaflet-container', 15_000);
  });

  it('map shows circle markers for stations', async () => {
    // StationMap uses L.circleMarker which renders as SVG with .leaflet-interactive
    await assertVisible(page, '.leaflet-interactive', 20_000);
  });
});
