import './style.css';
import { localizeDocument, t } from './i18n.js';

const $ = (id) => document.getElementById(id);
localizeDocument();

function showError(message) {
  const hint = document.querySelector('.hint');
  hint.textContent = message;
  hint.classList.add('error');
}

async function openWithFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) return showError(t('chooseImageFile'));
  // storage.session has a 10 MB quota; base64 expands the file by about a third.
  if (file.size > 5 * 1024 * 1024) return showError(t('imageUnder5Mb'));
  const reader = new FileReader();
  reader.onload = async () => {
    const id = crypto.randomUUID();
    try {
      await chrome.storage.session.set({ [id]: { kind: 'scan', screenshot: reader.result, rects: [], select: false, source: 'upload' } });
      await chrome.tabs.create({ url: chrome.runtime.getURL(`result.html?id=${id}`) });
      window.close();
    } catch (error) { showError(error.message); }
  };
  reader.readAsDataURL(file);
}

$('capture').addEventListener('click', async () => {
  const response = await chrome.runtime.sendMessage({ type: 'capture' });
  if (!response?.ok) showError(response?.message || t('captureFailed'));
  else window.close();
});
$('upload').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', (event) => openWithFile(event.target.files[0]));
$('current').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  $('content').value = tab?.url || '';
  if (!$('content').value) showError(t('currentUrlUnavailable'));
});
$('generate').addEventListener('click', async () => {
  const content = $('content').value.trim();
  if (!content) return showError(t('enterContentFirst'));
  const id = crypto.randomUUID();
  await chrome.storage.session.set({ [id]: { kind: 'generate', content } });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`result.html?id=${id}`) });
  window.close();
});
