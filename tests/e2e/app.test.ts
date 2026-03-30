import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  const BASE_URL = 'http://localhost:3000';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('should load the home page', async () => {
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const title = await page.title();
    expect(title).toBeDefined();
    expect(title.length).toBeGreaterThan(0);
  });

  it('should have the correct page content', async () => {
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const content = await page.content();
    expect(content).toContain('html');
    expect(content).toContain('body');
  });
});
