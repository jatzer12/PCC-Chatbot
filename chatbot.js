const chatLauncher = document.getElementById("chatLauncher");
const chatWidget = document.getElementById("chatWidget");
const chatClose = document.getElementById("chatClose");
const chatMinimize = document.getElementById("chatMinimize");
const chatNew = document.getElementById("chatNew");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatBody = document.getElementById("chatBody");

/** ✅ Your API endpoint */
const API_URL = "https://pcc-chatbot-api.vercel.app/api/chat";

/**
 * Minimal system message for history tracking.
 * (The real behavior/tone/scope rules are enforced in your backend api/chat.js)
 */
const SYSTEM_MESSAGE = {
  role: "system",
  content: 'You are "PCC Virtual Support".'
};

const STORAGE_KEY = "pcc_helpdesk_chat_history_v1";
const MAX_NON_SYSTEM_MESSAGES = 24;

let messages = loadHistory();
if (!messages.length) messages = [SYSTEM_MESSAGE];

// If we have stored history, render it
renderHistoryToUI();

/* ---------------------------
   Open / Close Chat
--------------------------- */
function openChat() {
  chatWidget.classList.add("open");
  document.body.style.overflow = "hidden";
  chatLauncher.style.display = "none";
  setTimeout(() => chatInput.focus(), 50);
}

function closeChat() {
  chatWidget.classList.remove("open");
  document.body.style.overflow = "";
  chatLauncher.style.display = "inline-flex";
}

chatLauncher.addEventListener("click", openChat);
chatClose.addEventListener("click", closeChat);
chatMinimize.addEventListener("click", closeChat);

/* ---------------------------
   New Chat (↻)
--------------------------- */
chatNew.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  messages = [SYSTEM_MESSAGE];

  // Reset UI to greeting (no quick actions)
  chatBody.innerHTML = greetingHTML();

  setTimeout(() => chatInput.focus(), 50);
});

/* ---------------------------
   Send Message
--------------------------- */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userText = chatInput.value.trim();
  if (!userText) return;

  addMsg("user", userText);
  chatInput.value = "";

  // Update history
  messages.push({ role: "user", content: userText });
  messages = trimHistory(messages, MAX_NON_SYSTEM_MESSAGES);
  saveHistory(messages);

  // Show typing indicator
  const typingEl = showTyping();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("API error:", res.status, t);
      removeTyping(typingEl);
      addMsg("assistant", "Sorry—something went wrong. Please try again.");
      return;
    }

    const data = await res.json();

    const reply =
      data.reply ??
      data.answer ??
      data.message ??
      data.output ??
      data.choices?.[0]?.message?.content ??
      "Sorry—I didn’t receive a reply.";

    removeTyping(typingEl);
    addMsg("assistant", String(reply));

    // Update history
    messages.push({ role: "assistant", content: String(reply) });
    messages = trimHistory(messages, MAX_NON_SYSTEM_MESSAGES);
    saveHistory(messages);
  } catch (err) {
    console.error("Fetch failed:", err);
    removeTyping(typingEl);
    addMsg("assistant", "Sorry, I can’t connect right now. Please try again.");
  }
});

/* ---------------------------
   Typing Indicator
--------------------------- */
function showTyping() {
  const wrap = document.createElement("div");
  wrap.className = "msg assistant";

  const bubble = document.createElement("div");
  bubble.className = "typing";
  bubble.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;

  wrap.appendChild(bubble);
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
  return wrap;
}

function removeTyping(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

/* ---------------------------
   UI Helpers
--------------------------- */
function addMsg(role, text) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrap.appendChild(bubble);
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function greetingHTML() {
  return `
    <div class="msg assistant">
      <div class="bubble">
        Aloha, I'm virtual assistant of Polynesian Cultural Center. How can I help you?
      </div>
    </div>
  `;
}

/* ---------------------------
   History (localStorage)
--------------------------- */
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

function trimHistory(history, maxNonSystem) {
  const system = history.find(m => m.role === "system") || SYSTEM_MESSAGE;
  const nonSystem = history.filter(m => m.role !== "system");
  return [system, ...nonSystem.slice(-maxNonSystem)];
}

function renderHistoryToUI() {
  const ui = messages.filter(m => m.role !== "system");

  // If no stored history, leave the HTML greeting as-is
  if (!ui.length) return;

  // Replace content with stored history
  chatBody.innerHTML = "";
  for (const m of ui) {
    addMsg(m.role === "assistant" ? "assistant" : "user", m.content);
  }
}
