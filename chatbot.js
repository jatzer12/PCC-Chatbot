const chatLauncher = document.getElementById("chatLauncher");

// UI Elements
const chatSection = document.getElementById("chatSection");
const chatWindow = document.getElementById("chatWindow");
const chatActions = document.getElementById("chatActions");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const openChatBtn = document.getElementById("openChat");
const closeChatBtn = document.getElementById("closeChat");
const resetChatBtn = document.getElementById("resetChat");

// ---- AI Backend Config ----
const CHATBOT_API_URL = "https://pcc-chatbot-api.vercel.app/api/chat";

// Stores conversation for the API (memory)
let chatHistory = []; // array of { role: "user"|"assistant", content: "..." }

async function askAI(message) {
  // Add user message to memory BEFORE calling API
  chatHistory.push({ role: "user", content: message });

  addMessage("Thinking...", "bot");

  try {
    const response = await fetch(CHATBOT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Keep your backend format: message + history
      body: JSON.stringify({ message, history: chatHistory })
    });

    const data = await response.json();

    // Remove "Thinking..."
    if (chatWindow.lastChild) chatWindow.lastChild.remove();

    if (data.text) {
      addMessage(data.text, "bot");

      // Add assistant reply to memory
      chatHistory.push({ role: "assistant", content: data.text });
    } else {
      addMessage(
        "I’m having trouble answering that. Please contact the PCC Helpdesk at 808-293-3160.",
        "bot"
      );
    }
  } catch (err) {
    console.error(err);
    if (chatWindow.lastChild) chatWindow.lastChild.remove();

    addMessage(
      "I’m unable to reach the helpdesk system right now. Please call 808-293-3160.",
      "bot"
    );
  }
}

// ---- Helpers ----
function addMessage(text, who = "bot") {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setChoices(choices = []) {
  // We are removing quick buttons, so we’ll just keep this to clear the area
  chatActions.innerHTML = "";
  choices.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = c.label;
    btn.addEventListener("click", () => c.onClick());
    chatActions.appendChild(btn);
  });
}

function showChat() {
  chatSection.classList.add("show");
  chatSection.setAttribute("aria-hidden", "false");
}

function hideChat() {
  chatSection.classList.remove("show");
  chatSection.setAttribute("aria-hidden", "true");
}

// ---- Conversation Flow ----
function startConversation() {
  chatWindow.innerHTML = "";
  chatHistory = []; // reset memory

  addMessage("Aloha! I am the virtual assistant for PCC HelpDesk Support.");
  addMessage("Tell me what’s going on (computer, printer, Wi-Fi/internet, or account access).");

  // No quick buttons
  setChoices([]);
}

// ---- User Sending ----
async function handleUserSend() {
  const text = (userInput.value || "").trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  await askAI(text);
}

// ---- UI Events ----
openChatBtn.addEventListener("click", () => {
  showChat();
  startConversation();
});

closeChatBtn.addEventListener("click", () => hideChat());

resetChatBtn.addEventListener("click", () => {
  showChat();
  startConversation();
});

chatLauncher.addEventListener("click", () => {
  if (chatSection.classList.contains("show")) {
    hideChat();
  } else {
    showChat();
    startConversation();
  }
});

sendBtn.addEventListener("click", handleUserSend);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleUserSend();
});
