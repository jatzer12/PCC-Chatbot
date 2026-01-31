const chatLauncher = document.getElementById("chatLauncher");
const chatWidget = document.getElementById("chatWidget");
const chatClose = document.getElementById("chatClose");
const chatMinimize = document.getElementById("chatMinimize");
const chatNew = document.getElementById("chatNew");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatBody = document.getElementById("chatBody");

/** ✅ API endpoint */
const API_URL = "https://pcc-chatbot-api.vercel.app/api/chat";

/** ✅ System message for memory object (backend also enforces behavior) */
const SYSTEM_MESSAGE = {
  role: "system",
  content:
    'You are "PCC Virtual Support", the official virtual assistant for the Polynesian Cultural Center (PCC) HelpDesk.'
};

const STORAGE_KEY = "pcc_helpdesk_chat_history_v1";

/** Load history from localStorage */
let messages = loadHistory();
if (!messages.length) {
  messages = [SYSTEM_MESSAGE];
}

/** Render saved history into UI (excluding system) */
renderHistoryToUI();

/* ---------- UI Open/Close ---------- */
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

/* ---------- New Chat / Refresh ---------- */
chatNew.addEventListener("click", () => {
  // Clear stored history
  localStorage.removeItem(STORAGE_KEY);

  // Reset memory
  messages = [SYSTEM_MESSAGE];

  // Reset UI back to greeting
  chatBody.innerHTML = greetingHTML();

  // Optional: focus input
  setTimeout(() => chatInput.focus(), 50);
});

/* ---------- Quick Buttons ---------- */
chatBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-q]");
  if (!btn) return;
  chatInput.value = btn.dataset.q;
  chatInput.focus();
});

/* ---------- Send Message ---------- */
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
      body: JSON.stringify({ messages }) // ✅ send full history
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("API error:", res.status, t);
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

    addMsg("assistant", String(reply));

    messages.push({ role: "assistant", content: String(reply) });
    messages = trimHistory(messages, 24);
    saveHistory(messages);
  } catch (err) {
    console.error("Fetch failed:", err);
    addMsg("assistant", "Sorry, I can’t connect right now. Please try again.");
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

function greetingHTML() {
  return `
    <div class="msg assistant">
      <div class="bubble">
        Aloha, I'm virtual assistant of Polynesian Cultural Center. How can I help you?
        <div class="quick-actions">
          <button type="button" data-q="I need help with my computer.">Computer</button>
          <button type="button" data-q="I need help with a printer issue.">Printer</button>
          <button type="button" data-q="I need help with WiFi / Internet.">WiFi / Internet</button>
        </div>
      </div>
    </div>
  `;
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
  const system = history.find((m) => m.role === "system") || SYSTEM_MESSAGE;
  const nonSystem = history.filter((m) => m.role !== "system");
  const trimmed = nonSystem.slice(-maxNonSystem);
  return [system, ...trimmed];
}

function renderHistoryToUI() {
  const ui = messages.filter((m) => m.role !== "system");

  // If no prior messages, ensure greeting exists (already in HTML)
  if (!ui.length) return;

  // If there is history, replace greeting with the history for consistency
  chatBody.innerHTML = "";
  for (const m of ui) {
    addMsg(m.role === "assistant" ? "assistant" : "user", m.content);
  }
}
