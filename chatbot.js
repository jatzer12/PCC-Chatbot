document.addEventListener("DOMContentLoaded", () => {
  const chatLauncher = document.getElementById("chatLauncher");
  const chatWidget = document.getElementById("chatWidget");
  const chatClose = document.getElementById("chatClose");
  const chatMinimize = document.getElementById("chatMinimize");
  const chatNew = document.getElementById("chatNew");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatBody = document.getElementById("chatBody");

  // Guard: don’t let the script fail silently
  const required = { chatLauncher, chatWidget, chatClose, chatMinimize, chatNew, chatForm, chatInput, chatBody };
  for (const [k, v] of Object.entries(required)) {
    if (!v) {
      console.error(`Chatbot init failed: missing element for "${k}". Check index.html IDs.`);
      return;
    }
  }

  /** ✅ Your API endpoint */
  const API_URL = "https://pcc-chatbot-api.vercel.app/api/chat";

  const SYSTEM_MESSAGE = {
    role: "system",
    content: 'You are "PCC Virtual Support".'
  };

  const STORAGE_KEY = "pcc_helpdesk_chat_history_v1";
  const MAX_NON_SYSTEM_MESSAGES = 24;

  let messages = loadHistory();
  if (!messages.length) messages = [SYSTEM_MESSAGE];

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

  chatNew.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    messages = [SYSTEM_MESSAGE];
    chatBody.innerHTML = greetingHTML();
    setTimeout(() => chatInput.focus(), 50);
  });

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userText = chatInput.value.trim();
    if (!userText) return;

    addMsg("user", userText);
    chatInput.value = "";

    messages.push({ role: "user", content: userText });
    messages = trimHistory(messages, MAX_NON_SYSTEM_MESSAGES);
    saveHistory(messages);

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

      messages.push({ role: "assistant", content: String(reply) });
      messages = trimHistory(messages, MAX_NON_SYSTEM_MESSAGES);
      saveHistory(messages);
    } catch (err) {
      console.error("Fetch failed:", err);
      removeTyping(typingEl);
      addMsg("assistant", "Sorry, I can’t connect right now. Please try again.");
    }
  });

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
          Aloha, I'm virtual assistant of Polynesian Cultural Center. How can I help you?
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
    } catch {}
  }

  function trimHistory(history, maxNonSystem) {
    const system = history.find(m => m.role === "system") || SYSTEM_MESSAGE;
    const nonSystem = history.filter(m => m.role !== "system");
    return [system, ...nonSystem.slice(-maxNonSystem)];
  }

  function renderHistoryToUI() {
    const ui = messages.filter(m => m.role !== "system");
    if (!ui.length) return;

    chatBody.innerHTML = "";
    for (const m of ui) {
      addMsg(m.role === "assistant" ? "assistant" : "user", m.content);
    }
  }
});
