import { expect, test } from '@playwright/test';

test.describe('Stream Detail Page', () => {
  test('loads conditions for a known stream', async ({ page }) => {
    await page.goto('/streams/beaverkill');

    // Back link should be present
    await expect(page.locator('[data-testid="back-to-streams"]')).toBeVisible();

    // StreamConditionsCard island loads data -- wait for the stream name or an error state
    const conditionsCard = page.locator('[class*="rounded-lg"]').first();
    await expect(conditionsCard).toBeVisible({ timeout: 20_000 });
  });

  test('shows back link that navigates to streams list', async ({ page }) => {
    await page.goto('/streams/beaverkill');

    const backLink = page.locator('[data-testid="back-to-streams"]');
    await expect(backLink).toBeVisible();

    await backLink.click();
    await expect(page).toHaveURL('/streams');
  });

  test('displays error for non-existent stream', async ({ page }) => {
    await page.goto('/streams/nonexistent-stream-xyz');

    // Should show error state with link back
    await expect(page.locator('text=Stream not found')).toBeVisible();
    await expect(page.locator('[data-testid="back-to-streams"]')).toBeVisible();
  });

  test('stream detail page has correct page title', async ({ page }) => {
    await page.goto('/streams/esopus');
    await expect(page).toHaveTitle('Upstate Fishing');
  });
});
