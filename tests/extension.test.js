import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const profile = await mkdtemp(join(tmpdir(), 'qr-snap-'));
const dist = resolve('dist');
const locales = await Promise.all(['zh_CN', 'en'].map(async (locale) => {
  const data = await readFile(resolve('dist', '_locales', locale, 'messages.json'), 'utf8');
  return JSON.parse(data);
}));
assert.deepEqual(Object.keys(locales[0]).sort(), Object.keys(locales[1]).sort());
for (const messages of locales) {
  assert.ok(Object.values(messages).every(({ message }) => typeof message === 'string' && message.length));
}
const browser = await chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true,
  args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
});

try {
  const worker = browser.serviceWorkers()[0] || await browser.waitForEvent('serviceworker');
  const base = worker.url().replace(/\/background\.js$/, '');
  const page = await browser.newPage();
  await page.goto(`${base}/popup.html`);
  const language = await page.evaluate(() => chrome.i18n.getUILanguage());
  const messages = locales[language.startsWith('zh') ? 0 : 1];
  assert.equal(await page.locator('h1').innerText(), messages.shortName.message);
  assert.equal(await page.locator('#capture').innerText(), messages.captureButton.message);
  assert.equal(await worker.evaluate(() => chrome.runtime.getManifest().name), messages.appName.message);
  const dataId = 'test-generate';
  await worker.evaluate(([id, payload]) => chrome.storage.session.set({ [id]: payload }),
    [dataId, { kind: 'generate', content: 'https://example.com/qr-snap-test' }]);
  await page.goto(`${base}/result.html?id=${dataId}`);
  await page.getByText(messages.qrGenerated.message).waitFor();
  const qr = await page.locator('#qr-canvas').evaluate((canvas) => canvas.toDataURL());
  assert.ok(qr.startsWith('data:image/png;base64,'));

  const scanId = 'test-scan';
  await worker.evaluate(([id, payload]) => chrome.storage.session.set({ [id]: payload }),
    [scanId, { kind: 'scan', screenshot: qr, rects: [], source: 'upload' }]);
  await page.goto(`${base}/result.html?id=${scanId}`);
  await page.getByText(messages.scanSuccess.message).waitFor();
  assert.equal(await page.locator('#decoded pre').innerText(), 'https://example.com/qr-snap-test');
  assert.equal(await page.getByRole('button', { name: messages.openLink.message }).count(), 1);

  const textId = 'test-text';
  await worker.evaluate(([id, payload]) => chrome.storage.session.set({ [id]: payload }),
    [textId, { kind: 'generate', content: '普通文字' }]);
  await page.goto(`${base}/result.html?id=${textId}`);
  await page.getByText(messages.qrGenerated.message).waitFor();
  const textQr = await page.locator('#qr-canvas').evaluate((canvas) => canvas.toDataURL());
  await worker.evaluate(([id, payload]) => chrome.storage.session.set({ [id]: payload }),
    ['test-text-scan', { kind: 'scan', screenshot: textQr, rects: [], source: 'upload' }]);
  await page.goto(`${base}/result.html?id=test-text-scan`);
  await page.getByText(messages.scanSuccess.message).waitFor();
  assert.equal(await page.locator('#decoded pre').innerText(), '普通文字');
  assert.equal(await page.getByRole('button', { name: messages.openLink.message }).count(), 0);
  const screenshot = await page.evaluate(async (qrData) => {
    const source = new Image(); source.src = qrData; await source.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 420;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 600, 420);
    ctx.drawImage(source, 140, 50, 240, 240);
    return canvas.toDataURL();
  }, qr);
  await worker.evaluate(([id, payload]) => chrome.storage.session.set({ [id]: payload }),
    ['test-area', { kind: 'scan', screenshot, rects: [], select: true, source: 'screen' }]);
  await page.goto(`${base}/result.html?id=test-area`);
  await page.locator('#source-image').waitFor();
  const bounds = await page.locator('#source-image').boundingBox();
  await page.mouse.move(bounds.x + 130, bounds.y + 40);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 390, bounds.y + 300);
  await page.mouse.up();
  await page.getByText(messages.scanSuccess.message).waitFor();
  assert.equal(await page.locator('#decoded pre').innerText(), 'https://example.com/qr-snap-test');

  // Override only the page's i18n API to exercise English rendering on a
  // machine whose Chrome UI language is not English.
  const englishPage = await browser.newPage();
  await englishPage.addInitScript((english) => {
    chrome.i18n.getMessage = (key) => english[key]?.message || '';
    chrome.i18n.getUILanguage = () => 'en-US';
  }, locales[1]);
  await englishPage.goto(`${base}/popup.html`);
  assert.equal(await englishPage.locator('h1').innerText(), locales[1].shortName.message);
  assert.equal(await englishPage.locator('#capture').innerText(), locales[1].captureButton.message);
  assert.equal(await englishPage.locator('#content').getAttribute('placeholder'), locales[1].contentPlaceholder.message);
  await worker.evaluate(([operationId, payload]) => chrome.storage.session.set({ [operationId]: payload }),
    ['test-english', { kind: 'generate', content: 'https://example.com/english' }]);
  await englishPage.goto(`${base}/result.html?id=test-english`);
  await englishPage.getByText(locales[1].qrGenerated.message).waitFor();
  assert.equal(await englishPage.locator('h1').innerText(), locales[1].shortName.message);
  console.log('Extension integration tests passed: localization, generation, decoding, URL handling, area selection.');
} finally {
  await browser.close();
  await rm(profile, { recursive: true, force: true });
}
