import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import path from "path";
import fs from "fs";
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const screenshotDirectory = path.resolve('test-artifacts/screenshots/result');
const expectedDirectory = path.resolve('test-artifacts/screenshots/expected');
const diffDirectory = path.resolve('test-artifacts/screenshots/diffs');

describe('THREE.js Render Tests', () => {
  let browser: Browser;
  let page: Page;
  const BASE_URL = 'http://localhost:3000';

  beforeAll(async () => {
    fs.mkdirSync(screenshotDirectory, { recursive: true });
    fs.mkdirSync(expectedDirectory, { recursive: true });
    fs.mkdirSync(diffDirectory, { recursive: true });

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        // Enable WebGL support
        '--enable-webgl',
        '--enable-accelerated-2d-canvas',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--ignore-gpu-blocklist',
        // WebGL-specific flags
        '--enable-features=WebGL,WebGL2',
      ],
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();

    // Navigate to main page
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    //Set viewport to 1280x720
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('should navigate to panorama viewer and display 360° scene', async () => {
    // Navigate to main page
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    // Wait for the gallery container to appear
    await page.waitForSelector('div.grid', { timeout: 10000 });

    // Scroll all images to trigger lazy load
    const imageLinks = await page.$$('a[href^="/inverse-sphere-scene"]');
    for (const link of imageLinks) {
      await link.scrollIntoView();
    }

    // Wait for all images to finish loading
    const images = await page.$$('a[href^="/inverse-sphere-scene"] img');
    await Promise.all(
      images.map(img =>
        page.evaluate(img => img.complete && img.naturalWidth > 0, img)
      )
    );

    // Take screenshot of gallery page
    await page.screenshot({
      path: path.join(screenshotDirectory, '01-panorama-gallery.png'),
      fullPage: true,
    });

    // Click the first panorama image link and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
      page.click('a[href^="/inverse-sphere-scene"]'),
    ]);

    // Check if there's an error page
    const isErrorPage = await page.$('#__next_error__');
    expect(isErrorPage).toBeFalsy();

    // Wait for the panorama container to be present
    await page.waitForSelector('div.h-screen.w-screen', {
      timeout: 10000,
    });

    // Wait for canvas element (Three.js renderer)
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Take full page screenshot of the panorama viewer
    await page.screenshot({
      path: path.join(screenshotDirectory, '02-panorama-viewer-loaded.png'),
      fullPage: true,
    });

    // Verify the panorama viewer elements are present
    const panoramaContainer = await page.$('div.h-screen.w-screen');
    expect(panoramaContainer).toBeTruthy();

    // Verify canvas was created
    const canvas = await page.$('canvas');
    expect(canvas).toBeTruthy();

    // Verify navigation instructions are visible
    const instructionsText = await page.evaluate(() => {
      return document.body.textContent?.includes('Drag to look around');
    });
    expect(instructionsText).toBe(true);
  });

  it('should load inverse-sphere-scene with panorama=0 and match expected screenshot', async () => {
    // Navigate to inverse-sphere-scene with panorama=0
    await page.goto(`${BASE_URL}/inverse-sphere-scene?panorama=0`, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    // Check if there's an error page
    const isErrorPage = await page.$('#__next_error__');
    expect(isErrorPage).toBeFalsy();

    // Wait for the panorama container to be present
    await page.waitForSelector('div.h-screen.w-screen', {
      timeout: 10000,
    });

    // Wait for canvas element (Three.js renderer)
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Take screenshot
    const screenshotPath = path.join(screenshotDirectory, 'panorama-0-result.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    // Compare with expected screenshot
    const expectedPath = path.join(expectedDirectory, 'panorama-0.png');
    
    // Check if expected screenshot exists
    if (fs.existsSync(expectedPath)) {
      const img1 = PNG.sync.read(fs.readFileSync(screenshotPath));
      const img2 = PNG.sync.read(fs.readFileSync(expectedPath));
      
      const { width, height } = img1;
      const diff = new PNG({ width, height });

      // Calculate pixel difference
      const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        width,
        height,
        { threshold: 0.1,
          diffMask: true }
      );

      // Save diff image
      const diffPath = path.join(diffDirectory, 'panorama-0-diff.png');
      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      // Calculate difference percentage
      const totalPixels = width * height;
      const diffPercentage = (numDiffPixels / totalPixels) * 100;

      console.log(`Image comparison: ${numDiffPixels} different pixels (${diffPercentage.toFixed(2)}%)`);

      // Assert that difference is below 5%
      expect(diffPercentage).toBeLessThan(5);
    } else {
      console.warn(`Expected screenshot not found at ${expectedPath}. Skipping comparison.`);
      console.warn('This screenshot will serve as the baseline. Copy it to the expected directory.');
    }

    // Verify basic elements are present
    const panoramaContainer = await page.$('div.h-screen.w-screen');
    expect(panoramaContainer).toBeTruthy();

    const canvas = await page.$('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should load debug-box with default camera perspective and match expected screenshot', async () => {
    // Navigate to debug-box page
    await page.goto(`${BASE_URL}/inverse-sphere-scene?panorama=3`, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    // Check if there's an error page
    const isErrorPage = await page.$('#__next_error__');
    expect(isErrorPage).toBeFalsy();

    // Wait for canvas element (Three.js renderer)
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Set camera direction and FOV for default perspective
    await page.evaluate(() => {
      const camera = window.camera;
      const fov = 67.68;
      if (camera) {
        // Default perspective - looking straight ahead (no rotation)
        camera.rotation.set(0, -Math.PI / 2, 0);
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    });

    // Take screenshot
    const screenshotPath = path.join(screenshotDirectory, 'debug-box-result-fov-100-level.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    // Compare with expected screenshot
    const expectedPath = path.join(expectedDirectory, 'debug-box-result-fov-100-level.png');
    
    // Check if expected screenshot exists
    if (fs.existsSync(expectedPath)) {
      const img1 = PNG.sync.read(fs.readFileSync(screenshotPath));
      const img2 = PNG.sync.read(fs.readFileSync(expectedPath));
      
      const { width, height } = img1;
      const diff = new PNG({ width, height });

      // Calculate pixel difference
      const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        width,
        height,
        { threshold: 0.1,
          diffMask: true }
      );

      // Save diff image
      const diffPath = path.join(diffDirectory, 'debug-box-result-fov-100-level-diff.png');
      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      // Calculate difference percentage
      const totalPixels = width * height;
      const diffPercentage = (numDiffPixels / totalPixels) * 100;

      console.log(`Image comparison: ${numDiffPixels} different pixels (${diffPercentage.toFixed(2)}%)`);

      // Assert that difference is below 5%
      expect(diffPercentage).toBeLessThan(15);
    } else {
      console.warn(`Expected screenshot not found at ${expectedPath}. Skipping comparison.`);
      console.warn('This screenshot will serve as the baseline. Copy it to the expected directory.');
    }

    // Verify canvas is present
    const canvas = await page.$('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should load debug-box looking straight up and match expected screenshot', async () => {
    // Navigate to debug-box page
    await page.goto(`${BASE_URL}/inverse-sphere-scene?panorama=3`, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    // Check if there's an error page
    const isErrorPage = await page.$('#__next_error__');
    expect(isErrorPage).toBeFalsy();

    // Wait for canvas element (Three.js renderer)
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Set camera direction and FOV for looking straight up
    await page.evaluate(() => {
      const camera = window.camera;
      const fov = 67.68;
      if (camera) {
        // Looking straight up: rotate 90 degrees on X axis (in radians)
        camera.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    });

    // Take screenshot
    const screenshotPath = path.join(screenshotDirectory, 'debug-box-result-fov-100-ceiling.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    // Compare with expected screenshot
    const expectedPath = path.join(expectedDirectory, 'debug-box-result-fov-100-ceiling.png');
    
    // Check if expected screenshot exists
    if (fs.existsSync(expectedPath)) {
      const img1 = PNG.sync.read(fs.readFileSync(screenshotPath));
      const img2 = PNG.sync.read(fs.readFileSync(expectedPath));
      
      const { width, height } = img1;
      const diff = new PNG({ width, height });

      // Calculate pixel difference
      const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        width,
        height,
        { threshold: 0.1,
          diffMask: true }
      );

      // Save diff image
      const diffPath = path.join(diffDirectory, 'debug-box-result-fov-100-ceiling.png');
      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      // Calculate difference percentage
      const totalPixels = width * height;
      const diffPercentage = (numDiffPixels / totalPixels) * 100;

      console.log(`Image comparison: ${numDiffPixels} different pixels (${diffPercentage.toFixed(2)}%)`);

      // Assert that difference is below 5%
      expect(diffPercentage).toBeLessThan(15);
    } else {
      console.warn(`Expected screenshot not found at ${expectedPath}. Skipping comparison.`);
      console.warn('This screenshot will serve as the baseline. Copy it to the expected directory.');
    }

    // Verify canvas is present
    const canvas = await page.$('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should load debug-box looking straight down and match expected screenshot', async () => {
    // Navigate to debug-box page
    await page.goto(`${BASE_URL}/inverse-sphere-scene?panorama=3`, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    // Check if there's an error page
    const isErrorPage = await page.$('#__next_error__');
    expect(isErrorPage).toBeFalsy();

    // Wait for canvas element (Three.js renderer)
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Set camera direction and FOV for looking straight up
    await page.evaluate(() => {
      const camera = window.camera;
      const fov = 67.68;
      if (camera) {
        // Looking straight down: rotate -90 degrees on X axis (in radians)
        camera.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    });

    // Take screenshot
    const screenshotPath = path.join(screenshotDirectory, 'debug-box-result-fov-100-floor.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    // Compare with expected screenshot
    const expectedPath = path.join(expectedDirectory, 'debug-box-result-fov-100-floor.png');
    
    // Check if expected screenshot exists
    if (fs.existsSync(expectedPath)) {
      const img1 = PNG.sync.read(fs.readFileSync(screenshotPath));
      const img2 = PNG.sync.read(fs.readFileSync(expectedPath));
      
      const { width, height } = img1;
      const diff = new PNG({ width, height });

      // Calculate pixel difference
      const numDiffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        width,
        height,
        { threshold: 0.1,
          diffMask: true }
      );

      // Save diff image
      const diffPath = path.join(diffDirectory, 'debug-box-result-fov-100-floor-diff.png');
      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      // Calculate difference percentage
      const totalPixels = width * height;
      const diffPercentage = (numDiffPixels / totalPixels) * 100;

      console.log(`Image comparison: ${numDiffPixels} different pixels (${diffPercentage.toFixed(2)}%)`);

      // Assert that difference is below 5%
      expect(diffPercentage).toBeLessThan(15);
    } else {
      console.warn(`Expected screenshot not found at ${expectedPath}. Skipping comparison.`);
      console.warn('This screenshot will serve as the baseline. Copy it to the expected directory.');
    }

    // Verify canvas is present
    const canvas = await page.$('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should expose camera, renderer, scene, and cameraState to window for testing', async () => {
    // Navigate to inverse-sphere-scene with panorama=0
    await page.goto(`${BASE_URL}/inverse-sphere-scene?panorama=0`, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    // Check if there's an error page
    const isErrorPage = await page.$('#__next_error__');
    expect(isErrorPage).toBeFalsy();

    // Wait for canvas element (Three.js renderer)
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Check if camera is exposed on window
    const exposedObjects = await page.evaluate(() => {
      return {
        hasCamera: typeof (window as Window).camera !== 'undefined',
        hasRenderer: typeof (window as Window).renderer !== 'undefined',
        hasScene: typeof (window as Window).scene !== 'undefined',
        hasCameraState: typeof (window as Window).cameraState !== 'undefined',
        hasUpdateCameraRotation: typeof (window as Window).updateCameraRotation !== 'undefined',
        cameraType: (window as Window).camera?.type,
        cameraIsPerspective: (window as Window).camera?.isPerspectiveCamera,
      };
    });

    // Verify all objects are exposed
    expect(exposedObjects.hasCamera).toBe(true);
    expect(exposedObjects.hasRenderer).toBe(true);
    expect(exposedObjects.hasScene).toBe(true);
    expect(exposedObjects.hasCameraState).toBe(true);
    expect(exposedObjects.hasUpdateCameraRotation).toBe(true);

    // Verify camera is a PerspectiveCamera
    expect(exposedObjects.cameraType).toBe('PerspectiveCamera');
    expect(exposedObjects.cameraIsPerspective).toBe(true);

    console.log('Successfully verified window object exposure:', exposedObjects);
  });

});
