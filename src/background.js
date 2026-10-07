import { t } from './i18n.js';

const MENU = {
  parent: 'qr-snap',
  image: 'qr-snap-image',
  area: 'qr-snap-area',
  page: 'qr-snap-page',
  link: 'qr-snap-link',
  selection: 'qr-snap-selection',
};

async function createMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: MENU.parent, title: t('menuParent'), contexts: ['page', 'image', 'link', 'selection'] });
  chrome.contextMenus.create({ id: MENU.image, parentId: MENU.parent, title: t('menuImage'), contexts: ['image'] });
  chrome.contextMenus.create({ id: MENU.area, parentId: MENU.parent, title: t('menuArea'), contexts: ['page', 'image', 'link', 'selection'] });
  chrome.contextMenus.create({ id: MENU.page, parentId: MENU.parent, title: t('menuPage'), contexts: ['page'] });
  chrome.contextMenus.create({ id: MENU.link, parentId: MENU.parent, title: t('menuLink'), contexts: ['link'] });
  chrome.contextMenus.create({ id: MENU.selection, parentId: MENU.parent, title: t('menuSelection'), contexts: ['selection'] });
}

chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);

async function openResult(payload) {
  const id = crypto.randomUUID();
  await chrome.storage.session.set({ [id]: payload });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`result.html?id=${encodeURIComponent(id)}`) });
}

async function capture(tab) {
  if (!tab?.windowId) throw new Error(t('currentWindowUnavailable'));
  return chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
}

async function imageRects(tabId, srcUrl, frameId) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId ?? 0] },
      args: [srcUrl],
      func: (url) => Array.from(document.images)
        .filter((img) => img.src === url || img.currentSrc === url)
        .map((img) => {
          const r = img.getBoundingClientRect();
          return { x: r.left, y: r.top, width: r.width, height: r.height };
        })
        .filter((r) => r.width > 0 && r.height > 0 && r.x < innerWidth && r.y < innerHeight && r.x + r.width > 0 && r.y + r.height > 0),
    });
    // Coordinates inside an iframe are not relative to the captured top-level viewport.
    return frameId ? [] : result;
  } catch {
    return [];
  }
}

async function handleMenu(info, tab) {
  const id = info.menuItemId;
  if (id === MENU.image || id === MENU.area) {
    const rects = id === MENU.image && info.srcUrl && tab?.id
      ? await imageRects(tab.id, info.srcUrl, info.frameId)
      : [];
    const screenshot = await capture(tab);
    await openResult({ kind: 'scan', screenshot, rects, viewportWidth: tab.width, select: id === MENU.area, source: id === MENU.image ? 'image' : 'screen' });
    return;
  }
  const content = id === MENU.selection ? info.selectionText
    : id === MENU.link ? info.linkUrl
    : id === MENU.page ? info.pageUrl || tab?.url
    : null;
  if (content) await openResult({ kind: 'generate', content });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleMenu(info, tab).catch(async (error) => {
    await openResult({ kind: 'error', message: error.message || t('actionFailed') });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'capture') return;
  (async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const screenshot = await capture(tab);
    await openResult({ kind: 'scan', screenshot, rects: [], viewportWidth: tab.width, select: true, source: 'screen' });
    sendResponse({ ok: true });
  })().catch((error) => sendResponse({ ok: false, message: error.message }));
  return true;
});
