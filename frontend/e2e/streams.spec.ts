import { expect, test } from '@playwright/test';

test.describe('Streams Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/streams');
  });

  test('displays the page title and filter buttons', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('All Streams');

    // Region filter buttons
    await expect(page.locator('a[href="/streams"]', { hasText: 'All' })).toBeVisible();
    await expect(page.locator('a[href="/streams?region=catskills"]')).toBeVisible();
    await expect(page.locator('a[href="/streams?region=delaware"]')).toBeVisible();
    await expect(page.locator('a[href="/streams?region=croton"]')).toBeVisible();
    await expect(
      page.locator('a[href="/streams?region=raritan"]', { hasText: 'Raritan / NJ' }),
    ).toBeVisible();
  });

  test('"All" filter is active by default', async ({ page }) => {
    const allButton = page.locator('a[href="/streams"]', { hasText: 'All' });
    await expect(allButton).toHaveClass(/bg-forest-600/);
  });

  test('filters streams by Catskills region', async ({ page }) => {
    await page.click('a[href="/streams?region=catskills"]');
    await expect(page).toHaveURL(/region=catskills/);
    await expect(page.locator('h1')).toHaveText('Catskills Streams');

    // Catskills filter should be active
    const catskillsButton = page.locator('a[href="/streams?region=catskills"]');
    await expect(catskillsButton).toHaveClass(/bg-forest-600/);
  });

  test('filters streams by Delaware region', async ({ page }) => {
    await page.click('a[href="/streams?region=delaware"]');
    await expect(page).toHaveURL(/region=delaware/);
    await expect(page.locator('h1')).toHaveText('Delaware System Streams');
  });

  test('filters streams by Croton region', async ({ page }) => {
    await page.click('a[href="/streams?region=croton"]');
    await expect(page).toHaveURL(/region=croton/);
    await expect(page.locator('h1')).toHaveText('Croton Watershed Streams');
  });

  test('clicking "All" clears the filter', async ({ page }) => {
    await page.goto('/streams?region=catskills');
    await expect(page.locator('h1')).toHaveText('Catskills Streams');

    await page.click('a[href="/streams"]', { strict: false });
    await expect(page).toHaveURL('/streams');
    await expect(page.locator('h1')).toHaveText('All Streams');
  });

  test('stream list loads with stream items', async ({ page }) => {
    // The StreamList island renders stream cards -- wait for at least one to appear
    const streamLink = page.locator('a[href^="/streams/"]').first();
    await expect(streamLink).toBeVisible({ timeout: 15_000 });
  });

  test('clicking a stream navigates to detail page', async ({ page }) => {
    const streamLink = page.locator('a[href^="/streams/"]').first();
    await expect(streamLink).toBeVisible({ timeout: 15_000 });

    const href = await streamLink.getAttribute('href');
    await streamLink.click();
    await expect(page).toHaveURL(href!);
  });
});

test.describe('Streams Page - State Filtering', () => {
  test('filters streams by NJ state', async ({ page }) => {
    await page.goto('/streams?state=NJ');
    await expect(page.locator('h1')).toHaveText('NJ Streams');
  });

  test('filters streams by NY state', async ({ page }) => {
    await page.goto('/streams?state=NY');
    await expect(page.locator('h1')).toHaveText('NY Streams');
  });
});
