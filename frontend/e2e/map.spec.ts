import { expect, test } from '@playwright/test';

test.describe('Map Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/map');
  });

  test('displays the page heading and description', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Sensor Map');
    await expect(page.locator('text=USGS monitoring stations')).toBeVisible();
  });

  test('shows the map container', async ({ page }) => {
    const mapContainer = page.locator('[style*="height"]').first();
    await expect(mapContainer).toBeVisible();
  });

  test('displays the quality legend', async ({ page }) => {
    await expect(page.locator('text=Excellent')).toBeVisible();
    await expect(page.locator('text=Good')).toBeVisible();
    await expect(page.locator('text=Fair')).toBeVisible();
    await expect(page.locator('text=Poor')).toBeVisible();
  });

  test('Leaflet map initializes with tiles', async ({ page }) => {
    // Leaflet creates a .leaflet-container element when initialized
    const leafletMap = page.locator('.leaflet-container');
    await expect(leafletMap).toBeVisible({ timeout: 15_000 });
  });

  test('map shows station markers', async ({ page }) => {
    // Wait for Leaflet to load and markers to appear
    const marker = page.locator('.leaflet-marker-icon, .leaflet-interactive').first();
    await expect(marker).toBeVisible({ timeout: 20_000 });
  });
});
