## Quiz Answer Finder

A small Chrome/Edge extension that attempts to highlight the correct answer on quiz pages by sending the question and options to the OpenAI API and marking the returned answer in-page.

Works by injecting a content script (`content.js`) on all pages. A popup (`popup.html` / `popup.js`) and an options page (`options.html` / `options.js`) are included to store an OpenAI API key in extension storage.

---

## Features
- Watches for question elements on the page and extracts the question text and multiple-choice options.
- Sends a concise prompt to the OpenAI Chat Completions endpoint and expects a single option as the reply.
- Highlights the matching option visually using CSS in `styles.css` and automatically clicks it after a short delay.

## Files of interest
- `manifest.json` — extension manifest (MV3). Declares permissions, content scripts, popup and options pages.
- `content.js` — main runtime logic: finds questions/options, sends prompt to OpenAI, highlights and auto-clicks the returned answer.
- `popup.html`, `popup.js`, `popup.css` — small UI to paste/save an API key and open the options page.
- `options.html`, `options.js`, `options.css` — options page to securely store/remove the OpenAI API key in extension storage.
- `styles.css` — styles injected into pages (includes `.highlight-correct` used to mark the returned answer).

## Quick install (Developer / Unpacked extension)
1. Build or open the repository folder in your browser file system or in your file manager.
2. Open Chrome/Edge and go to the Extensions page (chrome://extensions).
3. Enable "Developer mode".
4. Click "Load unpacked" and select this repository folder.
5. Click the extension action (toolbar icon) to open the popup and set your OpenAI API key.

Notes:
- The extension stores your OpenAI API key in the browser extension storage (`chrome.storage.local`). Do not commit any keys to source control.
- The extension uses the network to call the OpenAI API; you are responsible for the API key and associated costs.

## How it works (brief)
- `content.js` waits for an element matching `[data-testid="question-container-text"] p` and reads the question text.
- It collects option elements matching `[data-cy^="option-"]`, builds a prompt listing each option as `A. ...`, `B. ...`, etc., and sends it to the OpenAI Chat Completions endpoint.
- If the model returns an answer text that matches one of the page options (after normalization), that option receives the `.highlight-correct` class from `styles.css` and is auto-clicked after 3 seconds.
- The code reads the API key from `chrome.storage.local` under the key `OPENAI_API_KEY`. If no key is set, the extension opens the options page for the user.

## Configuration
- Set your OpenAI API key via the popup or the options page. The storage key is `OPENAI_API_KEY`.
- The model is currently set in `content.js` as `gpt-5-nano` and the request goes to `https://api.openai.com/v1/chat/completions`.

## Security & privacy
- The extension sends the question and options to the OpenAI API—this will transmit page content to OpenAI. Do not use with sensitive/private content unless you accept that.
- The API key is stored locally in browser extension storage. Keep your key private and rotate it if it becomes exposed.

## Limitations & Known issues
- The matching logic expects close text equality after a simple normalization step (lowercasing, punctuation removal). If the model returns formatted output ("A. ...", explanations, or multiple lines), the extension may fail to match.
- The extension monitors all pages (`<all_urls>`) because quiz platforms vary. That increases the extension's visibility surface; consider narrowing `host_permissions` in `manifest.json` if you target a specific site.
- Rate limiting, API errors, or invalid API keys will prevent answer lookup. The extension logs errors to the page console.

## Development notes
- Manifest version: 3
- Storage key: `OPENAI_API_KEY`
- Main content script entry: `content.js` (runs at `document_end`)
- Styling for highlights: `.highlight-correct` in `styles.css`
- To change model or endpoint, edit `fetch` parameters inside `content.js`.

## Troubleshooting
- If answers are not highlighted:
  - Check DevTools console for logs from `[QuizAnswerFinder]` or other console messages.
  - Ensure the API key is set in the extension popup or options.
  - Confirm the page has elements matching the selectors used in `content.js` (quiz platforms differ).

## License
This repository does not include a formal license. If you want to permit reuse, add a license file (for example `LICENSE` with the MIT text).

