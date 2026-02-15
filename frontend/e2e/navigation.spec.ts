import { expect, test } from '@playwright/test';

test.describe('Site Navigation', () => {
  test('navigates from home to streams via nav bar', async ({ page }) => {
    await page.goto('/');
    await page.click('nav >> a[href="/streams"]');
    await expect(page).toHaveURL('/streams');
    await expect(page.locator('h1')).toHaveText('All Streams');
  });

  test('navigates from home to hatches via nav bar', async ({ page }) => {
    await page.goto('/');
    await page.click('nav >> a[href="/hatches"]');
    await expect(page).toHaveURL('/hatches');
    await expect(page.locator('h1')).toHaveText('Hatch Chart');
  });

  test('navigates from home to map via nav bar', async ({ page }) => {
    await page.goto('/');
    await page.click('nav >> a[href="/map"]');
    await expect(page).toHaveURL('/map');
    await expect(page.locator('h1')).toHaveText('Sensor Map');
  });

  test('logo links back to homepage', async ({ page }) => {
    await page.goto('/streams');
    await page.click('nav >> a[href="/"]', { strict: false });
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toHaveText('Where should I fish today?');
  });

  test('full user journey: home -> streams -> detail -> back', async ({ page }) => {
    // Start at home
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Where should I fish today?');

    // Go to streams
    await page.click('nav >> a[href="/streams"]');
    await expect(page).toHaveURL('/streams');

    // Wait for stream list to load, then click first stream
    const streamLink = page.locator('a[href^="/streams/"]').first();
    await expect(streamLink).toBeVisible({ timeout: 15_000 });
    await streamLink.click();

    // Should be on a stream detail page
    await expect(page).toHaveURL(/\/streams\/.+/);
    await expect(page.locator('a[href="/streams"]', { hasText: 'Back to streams' })).toBeVisible();

    // Go back to streams list
    await page.click('a[href="/streams"] >> text=Back to streams');
    await expect(page).toHaveURL('/streams');
  });

  test('full user journey: home -> hatches -> filter -> clear', async ({ page }) => {
    await page.goto('/');

    // Navigate to hatches
    await page.click('nav >> a[href="/hatches"]');
    await expect(page).toHaveURL('/hatches');
    await expect(page.locator('h2')).toHaveText('All Hatches');

    // Filter by mayfly
    await page.click('a[href*="order=mayfly"] >> text=Mayflies');
    await expect(page).toHaveURL(/order=mayfly/);
    await expect(page.locator('h2')).toHaveText('Mayflies');

    // Clear filters
    await expect(page.locator('text=Clear filters')).toBeVisible();
    await page.click('text=Clear filters');
    await expect(page).toHaveURL('/hatches');
  });
});

test.describe('API Routes', () => {
  test('GET /api/streams returns stream data', async ({ request }) => {
    const response = await request.get('/api/streams');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/streams supports region filter', async ({ request }) => {
    const response = await request.get('/api/streams?region=catskills');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/hatches returns hatch data', async ({ request }) => {
    const response = await request.get('/api/hatches');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/hatches supports order filter', async ({ request }) => {
    const response = await request.get('/api/hatches?order=mayfly');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/streams/{id}/conditions returns conditions', async ({ request }) => {
    const response = await request.get('/api/streams/beaverkill/conditions');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test('GET /api/streams/{id} returns 404 for unknown stream', async ({ request }) => {
    const response = await request.get('/api/streams/nonexistent-stream-xyz');
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  test('GET /api/hatches/{id} returns 404 for unknown hatch', async ({ request }) => {
    const response = await request.get('/api/hatches/nonexistent-hatch-xyz');
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  test('GET /api/streams with invalid region still returns 200', async ({ request }) => {
    const response = await request.get('/api/streams?region=nonexistent');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });
});
