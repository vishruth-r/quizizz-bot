// Popup script: quick save/remove for OPENAI_API_KEY

function maskKey(k) {
  if (!k) return '(not set)';
  if (k.length > 10) return k.slice(0,4) + '…' + k.slice(-4);
  return '••••••';
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const status = document.getElementById('status');

  chrome.storage.local.get(['OPENAI_API_KEY'], (res) => {
    const key = res && res.OPENAI_API_KEY ? res.OPENAI_API_KEY : null;
    input.value = key || '';
  });

  saveBtn.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) {
      status.textContent = 'Enter a non-empty API key.';
      return;
    }
    chrome.storage.local.set({ OPENAI_API_KEY: val }, () => {
      status.textContent = 'Saved.';
      setTimeout(() => (status.textContent = ''), 1800);
    });
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          input.value = text.trim();
          status.textContent = 'Pasted. Click Save.';
          setTimeout(() => (status.textContent = ''), 2000);
        } else {
          status.textContent = 'Clipboard empty.';
          setTimeout(() => (status.textContent = ''), 1500);
        }
      } else {
        status.textContent = 'Clipboard not available.';
        setTimeout(() => (status.textContent = ''), 1500);
      }
    } catch (err) {
      console.error('Clipboard read failed', err);
      status.textContent = 'Failed to read clipboard.';
      setTimeout(() => (status.textContent = ''), 2000);
    }
  });

  optionsBtn.addEventListener('click', () => {
    if (chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });
});
