import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays the main heading and description', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Where should I fish today?');
    await expect(page.locator('text=Real-time conditions and hatch predictions')).toBeVisible();
  });

  test('shows navigation bar with all links', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(nav.locator('text=Upstate Fishing')).toBeVisible();
    await expect(nav.locator('a[href="/"]', { hasText: 'Today' })).toBeVisible();
    await expect(nav.locator('a[href="/streams"]')).toBeVisible();
    await expect(nav.locator('a[href="/hatches"]')).toBeVisible();
    await expect(nav.locator('a[href="/map"]')).toBeVisible();
  });

  test('shows quick links section with region links', async ({ page }) => {
    await expect(page.locator('text=Quick Links')).toBeVisible();
    await expect(page.locator('a[href="/streams?region=catskills"]')).toBeVisible();
    await expect(page.locator('a[href="/streams?region=delaware"]')).toBeVisible();
    await expect(page.locator('a[href="/streams?region=croton"]')).toBeVisible();
    await expect(page.locator('a[href="/streams?state=NJ"]')).toBeVisible();
  });

  test('shows hatch calendar section with link', async ({ page }) => {
    await expect(page.locator('text=Hatch Calendar')).toBeVisible();
    await expect(page.locator('a[href="/hatches"]', { hasText: 'View Hatch Chart' })).toBeVisible();
  });

  test('shows footer with data attribution', async ({ page }) => {
    await expect(page.locator('footer')).toContainText('Data from USGS and Weather.gov');
  });

  test('loads Top Picks island with stream recommendations', async ({ page }) => {
    // TopPicks fetches data asynchronously -- wait for content to appear or error state
    const topPicksArea = page.locator('text=Top Picks').first();
    await expect(topPicksArea).toBeVisible({ timeout: 15_000 });
  });

  test('navigates to streams page via quick link', async ({ page }) => {
    await page.click('a[href="/streams?region=catskills"]');
    await expect(page).toHaveURL(/\/streams\?region=catskills/);
    await expect(page.locator('h1')).toContainText('Catskills');
  });

  test('navigates to hatch chart via button', async ({ page }) => {
    await page.click('a[href="/hatches"] >> text=View Hatch Chart');
    await expect(page).toHaveURL('/hatches');
    await expect(page.locator('h1')).toHaveText('Hatch Chart');
  });
});
