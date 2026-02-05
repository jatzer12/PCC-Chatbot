document.addEventListener("DOMContentLoaded", () => {
  const chatLauncher = document.getElementById("chatLauncher");
  const chatWidget = document.getElementById("chatWidget");
  const chatClose = document.getElementById("chatClose");
  const chatMinimize = document.getElementById("chatMinimize");
  const chatNew = document.getElementById("chatNew");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatBody = document.getElementById("chatBody");

  const required = { chatLauncher, chatWidget, chatClose, chatMinimize, chatNew, chatForm, chatInput, chatBody };
  for (const [k, v] of Object.entries(required)) {
    if (!v) {
      console.error(`Chatbot init failed: missing element for "${k}". Check index.html IDs.`);
      return;
    }
  }

  const API_URL = "https://pcc-chatbot-api.vercel.app/api/chat";

  const STORAGE_KEY = "pcc_helpdesk_chat_history_v2";
  const MAX_TURNS = 12; // 12 turns = 24 messages (user+assistant)
  const FETCH_TIMEOUT_MS = 20000;

  let isSending = false;
  let previousBodyOverflow = "";

  // We do NOT store system messages in localStorage.
  let turns = loadTurns(); // [{role, content}, ...] user/assistant only

  renderTurnsToUI();

  function openChat() {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    chatWidget.classList.add("open");
    chatLauncher.style.display = "none";
    chatLauncher.setAttribute("aria-expanded", "true");
    setTimeout(() => chatInput.focus(), 50);
  }

  function closeChat() {
    chatWidget.classList.remove("open");
    document.body.style.overflow = previousBodyOverflow;

    chatLauncher.style.display = "inline-flex";
    chatLauncher.setAttribute("aria-expanded", "false");
    setTimeout(() => chatLauncher.focus(), 0);
  }

  chatLauncher.addEventListener("click", openChat);
  chatClose.addEventListener("click", closeChat);
  chatMinimize.addEventListener("click", closeChat);

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && chatWidget.classList.contains("open")) {
      closeChat();
    }
  });

  chatNew.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    turns = [];
    chatBody.innerHTML = greetingHTML();
    setTimeout(() => chatInput.focus(), 50);
  });

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSending) return;

    const userText = chatInput.value.trim();
    if (!userText) return;

    isSending = true;
    setSendingUI(true);

    addMsg("user", userText);
    chatInput.value = "";

    // store turn
    turns.push({ role: "user", content: userText });
    turns = trimTurns(turns, MAX_TURNS);
    saveTurns(turns);

    const typingEl = showTyping();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      // Build messages for API: include ONLY recent turns (no system in localStorage)
      const messagesForAPI = turns.map(t => ({ role: t.role, content: t.content }));

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesForAPI }),
        signal: controller.signal
      });

      clearTimeout(timeout);

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

      turns.push({ role: "assistant", content: String(reply) });
      turns = trimTurns(turns, MAX_TURNS);
      saveTurns(turns);
    } catch (err) {
      console.error("Fetch failed:", err);
      removeTyping(typingEl);

      const msg =
        err?.name === "AbortError"
          ? "Sorry—this is taking too long. Please try again."
          : "Sorry, I can’t connect right now. Please try again.";

      addMsg("assistant", msg);
    } finally {
      isSending = false;
      setSendingUI(false);
      setTimeout(() => chatInput.focus(), 50);
    }
  });

  function setSendingUI(sending) {
    const btn = chatForm.querySelector("button[type='submit']");
    if (btn) btn.disabled = sending;
    chatInput.disabled = sending;
  }

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
          Aloha, I'm PCC Virtual Support. How can I help you today?
        </div>
      </div>
    `;
  }

  function loadTurns() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
    } catch {
      return [];
    }
  }

  function saveTurns(history) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {}
  }

  function trimTurns(history, maxTurns) {
    // Keep last N turns; each turn = user+assistant, but we’ll be tolerant if it’s not perfectly paired.
    const maxMessages = maxTurns * 2;
    return history.slice(-maxMessages);
  }

  function renderTurnsToUI() {
    chatBody.innerHTML = greetingHTML();
    if (!turns.length) return;

    for (const m of turns) addMsg(m.role, m.content);
  }
});
