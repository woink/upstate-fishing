/// <reference lib="dom" />

/**
 * E2E test helpers for Astral browser automation.
 *
 * Provides server lifecycle management, browser launch helpers,
 * and Playwright-style assertion utilities built on @std/assert.
 */

import { launch } from '@astral/astral';
import type { Browser, Page } from '@astral/astral';
import { assert, assertEquals, assertMatch, assertStringIncludes } from '@std/assert';

// Re-export for convenience
export type { Browser, Page };
export { launch };

const BASE_URL = 'http://localhost:8000';

/** Handle returned by startServer() for cleanup */
export interface ServerHandle {
  close(): Promise<void>;
}

/**
 * Starts the Fresh dev server if not already running.
 * Polls the base URL until it responds (30s timeout).
 */
export async function startServer(): Promise<ServerHandle> {
  // Check if server is already running
  if (await isServerReady()) {
    return { async close() {} };
  }

  const command = new Deno.Command('deno', {
    args: ['run', '-A', '--unstable-kv', 'dev.ts'],
    cwd: new URL('../../', import.meta.url).pathname,
    stdout: 'null',
    stderr: 'null',
  });
  const child = command.spawn();

  // Consume the status promise to prevent leak detection
  const statusPromise = child.status;

  // Poll until the server responds
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await isServerReady()) {
      return {
        async close() {
          try {
            child.kill('SIGTERM');
          } catch {
            // Process may have already exited
          }
          // Await the status to clean up the resource
          await statusPromise.catch(() => {
            // Process terminated, expected during cleanup
          });
        },
      };
    }
    await delay(500);
  }

  child.kill('SIGTERM');
  await statusPromise.catch(() => {});
  throw new Error('Dev server failed to start within 30 seconds');
}

async function isServerReady(): Promise<boolean> {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) });
    await res.body?.cancel();
    return res.ok;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Launch a headless browser for E2E tests. */
export async function launchBrowser(): Promise<Browser> {
  const args = ['--disable-dev-shm-usage'];

  // CI environments need --no-sandbox since they run as root
  if (Deno.env.get('CI')) {
    args.push('--no-sandbox', '--disable-setuid-sandbox');
  }

  return await launch({ headless: true, args });
}

/** Full URL from a path (e.g. "/streams" -> "http://localhost:8000/streams"). */
export function url(path: string): string {
  return `${BASE_URL}${path}`;
}

// ─── Assertion Helpers ──────────────────────────────────────────────────────

/**
 * Waits for text to appear anywhere on the page body.
 * Polls `document.body.innerText` until a substring match is found.
 */
export async function waitForText(
  page: Page,
  text: string,
  timeout = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes(text)) return;
    await delay(250);
  }
  throw new Error(`Timed out waiting for text "${text}" on page ${page.url}`);
}

/**
 * Assert that an element's textContent equals expected string.
 */
export async function assertTextContent(
  page: Page,
  selector: string,
  expected: string,
): Promise<void> {
  const el = await page.waitForSelector(selector, { timeout: 10_000 });
  const text = await el.evaluate((node: Element) => node.textContent?.trim() ?? '');
  assertEquals(text, expected);
}

/**
 * Assert that an element's textContent contains a substring.
 */
export async function assertContainsText(
  page: Page,
  selector: string,
  text: string,
): Promise<void> {
  const el = await page.waitForSelector(selector, { timeout: 10_000 });
  const content = await el.evaluate((node: Element) => node.textContent ?? '');
  assertStringIncludes(content, text);
}

/**
 * Assert that an element matching selector is visible on the page.
 */
export async function assertVisible(
  page: Page,
  selector: string,
  timeout = 10_000,
): Promise<void> {
  const el = await page.waitForSelector(selector, { timeout });
  assert(el !== null, `Expected element "${selector}" to be visible`);
}

/**
 * Assert the current page URL matches a string or RegExp.
 */
export function assertURL(page: Page, pattern: string | RegExp): void {
  if (typeof pattern === 'string') {
    // Normalize trailing slashes for exact path comparison
    const pageUrl = new URL(page.url);
    const expected = new URL(pattern, BASE_URL);
    assertEquals(pageUrl.pathname + pageUrl.search, expected.pathname + expected.search);
  } else {
    assertMatch(page.url, pattern);
  }
}

/**
 * Assert an element's className matches a regex pattern.
 */
export async function assertHasClass(
  page: Page,
  selector: string,
  classPattern: RegExp,
): Promise<void> {
  const el = await page.waitForSelector(selector, { timeout: 10_000 });
  const className = await el.evaluate((node: Element) => node.className);
  assertMatch(className, classPattern);
}

/**
 * Click an element and wait for navigation to complete.
 */
export async function clickAndNavigate(page: Page, selector: string): Promise<void> {
  const el = await page.waitForSelector(selector, { timeout: 10_000 });
  await Promise.all([
    page.waitForNavigation(),
    el.click(),
  ]);
}

/**
 * Navigate to a URL and wait for network idle.
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(url(path), { waitUntil: 'networkidle2' });
}

/**
 * Find an element by its visible text content using XPath.
 * Returns the first matching element.
 */
export async function findByText(
  page: Page,
  text: string,
  _tag = '*',
): Promise<ReturnType<Page['waitForSelector']>> {
  return await page.waitForSelector(
    `xpath=//${_tag}[contains(text(),"${text}")]`,
    { timeout: 10_000 },
  );
}

/**
 * Get the count of elements matching a selector.
 */
export async function elementCount(page: Page, selector: string): Promise<number> {
  const elements = await page.$$(selector);
  return elements.length;
}
