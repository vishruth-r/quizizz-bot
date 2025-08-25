// Options page script: save/remove OPENAI_API_KEY in chrome.storage.local

function maskKey(k) {
  if (!k) return '(not set)';
  if (k.length > 10) return k.slice(0,4) + '…' + k.slice(-4);
  return '••••••';
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const removeBtn = document.getElementById('removeBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const status = document.getElementById('status');
  const masked = document.getElementById('masked');

  // Load existing key
  try {
    chrome.storage.local.get(['OPENAI_API_KEY'], (res) => {
      const key = res && res.OPENAI_API_KEY ? res.OPENAI_API_KEY : null;
      input.value = key || '';
      masked.textContent = key ? maskKey(key) : '(not set)';
    });
  } catch (err) {
    masked.textContent = '(storage unavailable)';
    console.error('chrome.storage unavailable on options page', err);
  }

  saveBtn.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) {
      status.textContent = 'Enter a non-empty API key to save.';
      return;
    }
    chrome.storage.local.set({ OPENAI_API_KEY: val }, () => {
      status.textContent = 'API key saved.';
      masked.textContent = maskKey(val);
      setTimeout(() => (status.textContent = ''), 2000);
    });
  });

  removeBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['OPENAI_API_KEY'], () => {
      input.value = '';
      masked.textContent = '(not set)';
      status.textContent = 'API key removed.';
      setTimeout(() => (status.textContent = ''), 2000);
    });
  });

  // Paste from clipboard (user gesture required in most browsers)
  if (pasteBtn) {
    pasteBtn.addEventListener('click', async () => {
      status.textContent = '';
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text && text.trim()) {
            input.value = text.trim();
            masked.textContent = maskKey(input.value);
            status.textContent = 'Pasted from clipboard. Click Save to persist.';
            setTimeout(() => (status.textContent = ''), 2500);
          } else {
            status.textContent = 'Clipboard is empty.';
            setTimeout(() => (status.textContent = ''), 2000);
          }
        } else {
          status.textContent = 'Clipboard read not supported in this browser.';
          setTimeout(() => (status.textContent = ''), 2000);
        }
      } catch (err) {
        console.error('Failed to read clipboard:', err);
        status.textContent = 'Unable to read from clipboard. Try pasting manually.';
        setTimeout(() => (status.textContent = ''), 3000);
      }
    });
  }
});
