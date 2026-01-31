const chatLauncher = document.getElementById("chatLauncher");
const chatWidget = document.getElementById("chatWidget");
const chatClose = document.getElementById("chatClose");
const chatMinimize = document.getElementById("chatMinimize");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatBody = document.getElementById("chatBody");

/** ✅ Your deployed API endpoint */
const API_URL = "https://pcc-chatbot-api.vercel.app/api/chat";

/** ✅ System instructions for the bot */
const SYSTEM_MESSAGE = {
  role: "system",
  content:
    "You are the Polynesian Cultural Center (PCC) HelpDesk Assistant. " +
    "You only assist with PCC IT issues: computers, printers, Wi-Fi/internet, email/account access, and basic Microsoft 365 apps. " +
    "Ask 1–2 clarifying questions when needed. Provide step-by-step instructions. " +
    "If the user still cannot resolve it, advise contacting PCC HelpDesk at 808-293-3160."
};

const STORAGE_KEY = "pcc_helpdesk_chat_history_v1";

/** Load history (keep across refresh) */
let messages = loadHistory();
if (!messages.length) messages = [SYSTEM_MESSAGE];

/** Show old history in the UI (excluding system) */
renderHistoryToUI();

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

chatBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-q]");
  if (!btn) return;
  chatInput.value = btn.dataset.q;
  chatInput.focus();
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userText = chatInput.value.trim();
  if (!userText) return;

  addMsg("user", userText);
  chatInput.value = "";

  messages.push({ role: "user", content: userText });
  messages = trimHistory(messages, 24);
  saveHistory(messages);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })   // ✅ SEND FULL HISTORY (memory fix)
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("API error:", res.status, t);
      addMsg("assistant", `Sorry—API error (${res.status}). Please call PCC HelpDesk at 808-293-3160.`);
      return;
    }

    const data = await res.json();

    const reply =
      data.reply ??
      data.answer ??
      data.message ??
      data.output ??
      data.choices?.[0]?.message?.content ??
      "I received your message, but the API did not return a reply field.";

    addMsg("assistant", String(reply));

    messages.push({ role: "assistant", content: String(reply) });
    messages = trimHistory(messages, 24);
    saveHistory(messages);
  } catch (err) {
    console.error("Fetch failed:", err);
    addMsg("assistant", "Sorry, I can’t connect right now. Please contact PCC HelpDesk at 808-293-3160.");
  }
});

/* ---------- Helpers ---------- */

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
  const trimmed = nonSystem.slice(-maxNonSystem);
  return [system, ...trimmed];
}

function renderHistoryToUI() {
  const ui = messages.filter(m => m.role !== "system");
  for (const m of ui) {
    addMsg(m.role === "assistant" ? "assistant" : "user", m.content);
  }
}
