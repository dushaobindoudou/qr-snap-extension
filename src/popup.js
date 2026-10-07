import './style.css';

const $ = (id) => document.getElementById(id);

function showError(message) {
  const hint = document.querySelector('.hint');
  hint.textContent = message;
  hint.classList.add('error');
}

async function openWithFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) return showError('请选择图片文件');
  // storage.session has a 10 MB quota; base64 expands the file by about a third.
  if (file.size > 5 * 1024 * 1024) return showError('图片请小于 5 MB');
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
  if (!response?.ok) showError(response?.message || '截图失败');
  else window.close();
});
$('upload').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', (event) => openWithFile(event.target.files[0]));
$('current').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  $('content').value = tab?.url || '';
  if (!$('content').value) showError('无法读取当前页面网址');
});
$('generate').addEventListener('click', async () => {
  const content = $('content').value.trim();
  if (!content) return showError('请先输入网址或文字');
  const id = crypto.randomUUID();
  await chrome.storage.session.set({ [id]: { kind: 'generate', content } });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`result.html?id=${id}`) });
  window.close();
});
