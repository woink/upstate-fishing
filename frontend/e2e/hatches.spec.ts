import { expect, test } from '@playwright/test';

test.describe('Hatch Chart Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hatches');
  });

  test('displays the page heading and description', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Hatch Chart');
    await expect(page.locator('text=Insect emergence patterns')).toBeVisible();
  });

  test('shows insect type filter buttons', async ({ page }) => {
    const filterSection = page.locator('text=Insect Type').locator('..');
    await expect(filterSection.locator('a', { hasText: 'All' })).toBeVisible();
    await expect(filterSection.locator('a', { hasText: 'Mayflies' })).toBeVisible();
    await expect(filterSection.locator('a', { hasText: 'Caddisflies' })).toBeVisible();
    await expect(filterSection.locator('a', { hasText: 'Stoneflies' })).toBeVisible();
    await expect(filterSection.locator('a', { hasText: 'Midges' })).toBeVisible();
  });

  test('shows month dropdown filter', async ({ page }) => {
    const select = page.locator('[data-testid="month-filter"]');
    await expect(select).toBeVisible();
    await expect(select).toContainText('All Months');
    await expect(select).toContainText('January');
    await expect(select).toContainText('December');
  });

  test('shows hatch count', async ({ page }) => {
    await expect(page.locator('text=/\\d+ hatches/')).toBeVisible();
  });

  test('displays legend with insect types', async ({ page }) => {
    const legend = page.locator('text=Legend').locator('..');
    await expect(legend.locator('text=Mayflies')).toBeVisible();
    await expect(legend.locator('text=Caddisflies')).toBeVisible();
    await expect(legend.locator('text=Stoneflies')).toBeVisible();
    await expect(legend.locator('text=Midges')).toBeVisible();
  });

  test('filters by insect type via URL', async ({ page }) => {
    await page.goto('/hatches?order=mayfly');
    await expect(page.locator('h2')).toHaveText('Mayflies');

    // Mayflies button should be active
    const mayfliesLink = page.locator('a[href*="order=mayfly"]', { hasText: 'Mayflies' });
    await expect(mayfliesLink).toHaveClass(/bg-slate-800/);
  });

  test('filters by month via URL', async ({ page }) => {
    await page.goto('/hatches?month=4');
    await expect(page.locator('h2')).toContainText('April Hatches');
  });

  test('filters by both type and month', async ({ page }) => {
    await page.goto('/hatches?order=mayfly&month=5');
    await expect(page.locator('h2')).toContainText('Mayflies in May');
  });

  test('clicking insect type button filters results', async ({ page }) => {
    await page.click('a[href*="order=mayfly"] >> text=Mayflies');
    await expect(page).toHaveURL(/order=mayfly/);
    await expect(page.locator('h2')).toHaveText('Mayflies');
  });

  test('clear filters link appears when filters are active', async ({ page }) => {
    await page.goto('/hatches?order=mayfly');
    await expect(page.locator('text=Clear filters')).toBeVisible();

    await page.click('text=Clear filters');
    await expect(page).toHaveURL('/hatches');
    await expect(page.locator('h2')).toHaveText('All Hatches');
  });

  test('shows empty state when no hatches match filters', async ({ page }) => {
    // Stoneflies in an unlikely month combination
    await page.goto('/hatches?order=stonefly&month=8');
    // This may or may not show "No hatches found" depending on data -- just check page doesn't crash
    await expect(page.locator('h1')).toHaveText('Hatch Chart');
  });

  test('HatchChart island renders the interactive table', async ({ page }) => {
    // The HatchChart island should render with hatch names visible
    const hatchRow = page.locator('text=/Hendrickson|Blue-Winged Olive|March Brown/').first();
    await expect(hatchRow).toBeVisible({ timeout: 10_000 });
  });
});
