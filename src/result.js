import './style.css';
import { decodeRegion, generate } from './qr.js';
import { localizeDocument, t } from './i18n.js';

const $ = (id) => document.getElementById(id);
localizeDocument();
const params = new URLSearchParams(location.search);
const id = params.get('id');
let image;
let selectionStart;
let selecting = false;

function status(message, isError = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', isError);
}

function decoded(content) {
  const container = $('decoded');
  container.replaceChildren();
  if (!content) return status(t('scanNotFound'), true);
  status(t('scanSuccess'));
  const heading = document.createElement('h3');
  heading.textContent = t('scanResult');
  const value = document.createElement('pre');
  value.textContent = content;
  const copy = document.createElement('button');
  copy.textContent = t('copyContent');
  copy.onclick = async () => { await navigator.clipboard.writeText(content); status(t('contentCopied')); };
  container.append(heading, value, copy);
  try {
    const url = new URL(content);
    if (['http:', 'https:'].includes(url.protocol)) {
      const open = document.createElement('button');
      open.textContent = t('openLink');
      open.onclick = () => chrome.tabs.create({ url: url.href });
      container.append(open);
    }
  } catch { /* Plain text is copied only. */ }
}

async function scan(rect) {
  try { decoded(await decodeRegion(image, rect)); }
  catch (error) { status(`${t('imageProcessFailed')}: ${error.message}`, true); }
}

async function loadImage(dataUrl) {
  image = $('source-image');
  image.src = dataUrl;
  try { await image.decode(); }
  catch { return status(t('imageReadFailed'), true); }
  await scan();
}

function regionFromPointer(event) {
  const bounds = image.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
    y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)),
  };
}

function drawSelection(a, b) {
  const box = $('selection');
  box.style.display = 'block';
  box.style.left = `${Math.min(a.x, b.x)}px`;
  box.style.top = `${Math.min(a.y, b.y)}px`;
  box.style.width = `${Math.abs(a.x - b.x)}px`;
  box.style.height = `${Math.abs(a.y - b.y)}px`;
}

function bindSelection() {
  const wrap = $('image-wrap');
  wrap.addEventListener('pointerdown', (event) => {
    if (!image?.naturalWidth) return;
    selecting = true;
    selectionStart = regionFromPointer(event);
    wrap.setPointerCapture(event.pointerId);
    drawSelection(selectionStart, selectionStart);
  });
  wrap.addEventListener('pointermove', (event) => {
    if (selecting) drawSelection(selectionStart, regionFromPointer(event));
  });
  wrap.addEventListener('pointerup', async (event) => {
    if (!selecting) return;
    selecting = false;
    const end = regionFromPointer(event);
    const scale = image.naturalWidth / image.getBoundingClientRect().width;
    const rect = {
      x: Math.min(selectionStart.x, end.x) * scale,
      y: Math.min(selectionStart.y, end.y) * scale,
      width: Math.abs(selectionStart.x - end.x) * scale,
      height: Math.abs(selectionStart.y - end.y) * scale,
    };
    if (rect.width < 8 || rect.height < 8) return;
    await scan(rect);
  });
}

async function scanImage(payload) {
  $('scan-section').hidden = false;
  $('scan-help').textContent = t(payload.source === 'image' ? 'scanImageHelp' : 'scanAreaHelp');
  bindSelection();
  await loadImage(payload.screenshot);
  if (payload.rects?.length) {
    const scale = image.naturalWidth / (payload.viewportWidth || image.naturalWidth);
    for (const rect of payload.rects) {
      const result = await decodeRegion(image, {
        x: rect.x * scale, y: rect.y * scale,
        width: rect.width * scale, height: rect.height * scale,
      });
      if (result) { decoded(result); break; }
    }
  }
  $('scan-all').onclick = () => scan();
  $('choose-file').onclick = () => $('file').click();
  $('file').onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) return status(t('imageUnder10Mb'), true);
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result);
    reader.readAsDataURL(file);
  };
}

async function renderQr() {
  const content = $('content').value.trim();
  if (!content) return status(t('enterContent'), true);
  try { await generate($('qr-canvas'), content); status(t('qrGenerated')); }
  catch (error) { status(`${t('generateFailed')}: ${error.message}`, true); }
}

async function generateQr(payload) {
  $('generate-section').hidden = false;
  $('content').value = payload.content;
  await renderQr();
  $('regenerate').onclick = renderQr;
  $('download').onclick = () => {
    const a = document.createElement('a');
    a.download = 'qr-code.png';
    a.href = $('qr-canvas').toDataURL('image/png');
    a.click();
  };
  $('copy-image').onclick = async () => {
    try {
      const blob = await new Promise((resolve) => $('qr-canvas').toBlob(resolve));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      status(t('imageCopied'));
    } catch (error) { status(`${t('copyFailed')}: ${error.message}`, true); }
  };
}

async function main() {
  if (!id) return status(t('missingOperation'), true);
  const stored = await chrome.storage.session.get(id);
  const payload = stored[id];
  await chrome.storage.session.remove(id);
  if (!payload) return status(t('operationExpired'), true);
  if (payload.kind === 'scan') await scanImage(payload);
  else if (payload.kind === 'generate') await generateQr(payload);
  else status(payload.message || t('actionFailed'), true);
}

main().catch((error) => status(error.message || t('actionFailed'), true));
