// ✅ Normalize strings (remove punctuation, lowercase, trim)
function normalize(str) {
  return str.toLowerCase().replace(/[^\w\s]/gi, '').trim();
}

// ✅ Utility to wait for an element
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (Date.now() - start > timeout) return reject("Timeout waiting for " + selector);
      requestAnimationFrame(check);
    }
    check();
  });
}

// ✅ Main logic for processing a question
async function processQuestion() {
  console.log("🔁 Looking for question...");

  try {
    const questionEl = await waitForElement('[data-testid="question-container-text"] p');
    const question = questionEl.innerText.trim();
    console.log("❓ Question found:", question);

    const allOptions = document.querySelectorAll('[data-cy^="option-"]');
    if (!allOptions.length) {
      console.warn("⚠️ No options found.");
      return;
    }

    const options = Array.from(allOptions).map((btn, i) => {
      const textEl = btn.querySelector("p");
      const text = textEl ? textEl.innerText.trim() : '';
      console.log(`🔘 Option ${i + 1}: ${text}`);
      return text;
    });

    const correctAnswer = await fetchCorrectAnswerFromChatGPT(question, options);
    console.log("✅ Correct Answer (GPT):", correctAnswer);

    if (!correctAnswer) return;

    // Strip prefix (e.g., "A. ") if present
    const normalizedCorrect = normalize(correctAnswer);
    const strippedAnswer = correctAnswer.replace(/^[A-Da-d]\.\s*/, '').trim();
    const normalizedStripped = normalize(strippedAnswer);

    let matched = false;

    // Remove previous highlights
    allOptions.forEach(btn => btn.classList.remove("highlight-correct"));

allOptions.forEach((btn, i) => {
  const textEl = btn.querySelector("p");
  if (!textEl) return;

  const optionText = textEl.innerText.trim();
  const normalizedOption = normalize(optionText);

  if (
    normalizedOption === normalizedCorrect ||
    normalizedOption === normalizedStripped
  ) {
    btn.classList.add("highlight-correct");
    matched = true;
    console.log(`🎯 Highlighted Option ${i + 1}: ${optionText}`);

    // ⏳ Auto-click after 3 seconds
    setTimeout(() => {
      btn.click();
      console.log("🖱 Auto-clicked correct option");
    }, 3000);
  }
});

if (!matched) {
  console.warn("⚠️ No exact match found. GPT may have returned formatted/ambiguous output.");
}

  } catch (error) {
    console.error("❌ Error processing question:", error);
  }
}

// ✅ Function to fetch answer from GPT
async function fetchCorrectAnswerFromChatGPT(question, options) {
  const prompt = `Question: ${question}\nOptions:\n${options
    .map((opt, i) => String.fromCharCode(65 + i) + `. ${opt}`)
    .join('\n')}\n\nWhich option is correct? Just return the full text of the correct option.`;

  // Avoid flooding the API with concurrent requests
  if (window._isFetchingAnswer) {
    console.log('[QuizAnswerFinder] Fetch already in progress - skipping');
    return null;
  }
  window._isFetchingAnswer = true;

  console.log('[QuizAnswerFinder] Sending prompt to ChatGPT');

  // Retrieve API key from chrome.storage.local to avoid hardcoding secrets in the repo.
  const apiKey = await new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['OPENAI_API_KEY'], (res) => {
          resolve(res && res.OPENAI_API_KEY ? res.OPENAI_API_KEY : null);
        });
      } else {
        resolve(null);
      }
    } catch (err) {
      console.error('Error accessing chrome.storage:', err);
      resolve(null);
    }
  });

  if (!apiKey) {
    console.error('OpenAI API key not found. Set OPENAI_API_KEY in chrome.storage.local before using this extension.');
    try {
      if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
        // Open the options page so the user can enter the API key.
        chrome.runtime.openOptionsPage();
      }
    } catch (err) {
      // ignore failures (e.g., in non-extension contexts)
    }
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [{ role: "user", content: prompt }],
      })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '<no body>');
      console.error('[QuizAnswerFinder] OpenAI API error', response.status, text);
      return null;
    }

    const data = await response.json();
    console.log('[QuizAnswerFinder] GPT response:', data);
    return data?.choices?.[0]?.message?.content.trim() || null;
  } catch (err) {
    console.error('[QuizAnswerFinder] Fetch error:', err);
    return null;
  } finally {
    // allow subsequent requests
    window._isFetchingAnswer = false;
  }
}

// ✅ Observe page for new questions
const observer = new MutationObserver(() => {
  const newQuestion = document.querySelector('[data-testid="question-container-text"] p');
  if (newQuestion && newQuestion.innerText.trim() !== window._lastSeenQuestion) {
    window._lastSeenQuestion = newQuestion.innerText.trim();
    processQuestion();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log("🧠 Extension loaded and watching for new questions...");
