const chatLauncher = document.getElementById("chatLauncher");

// Simple decision-tree chatbot for PCC HelpDesk Support

const chatSection = document.getElementById("chatSection");
const chatWindow = document.getElementById("chatWindow");
const chatActions = document.getElementById("chatActions");

const openChatBtn = document.getElementById("openChat");
const closeChatBtn = document.getElementById("closeChat");
const resetChatBtn = document.getElementById("resetChat");

// ---- Helpers ----
function addMessage(text, who = "bot") {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setChoices(choices = []) {
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
  addMessage("Aloha! I am the virtual assistant for PCC HelpDesk Support.");
  addMessage("Are you having a problem with your:");

  setChoices([
    { label: "1. Computer", onClick: () => computerFlow() },
    { label: "2. Printer", onClick: () => printerFlow() },
    { label: "3. WiFi / Internet", onClick: () => wifiFlow() }
  ]);
}

function computerFlow() {
  addMessage("Computer", "user");
  addMessage("Got it. What issue are you experiencing with your computer?");

  setChoices([
    { label: "Won’t turn on", onClick: () => {
      addMessage("Won’t turn on", "user");
      addMessage("Please check: (1) power cable is plugged in, (2) power strip is ON, (3) try a different outlet.");
      addMessage("If still not working, please contact the HelpDesk for a hardware check.");
      endOrRestart();
    }},
    { label: "No Internet on computer", onClick: () => {
      addMessage("No Internet on computer", "user");
      addMessage("Try: (1) disconnect/reconnect WiFi, (2) restart the computer, (3) forget and rejoin PCC-Wireless.");
      addMessage("If it continues, select WiFi/Internet from the main menu.");
      endOrRestart();
    }},
    { label: "Software issue", onClick: () => {
      addMessage("Software issue", "user");
      addMessage("Please note the software name and any error message. Try closing and reopening the app.");
      addMessage("If it persists, submit a HelpDesk ticket with screenshots (if possible).");
      endOrRestart();
    }},
    { label: "Back to main menu", onClick: () => startConversation() }
  ]);
}

function printerFlow() {
  addMessage("Printer", "user");
  addMessage("Okay. What printer issue do you have?");

  setChoices([
    { label: "Paper jam", onClick: () => {
      addMessage("Paper jam", "user");
      addMessage("Remove paper gently. Check all access doors and the paper tray. Re-seat the tray and try again.");
      endOrRestart();
    }},
    { label: "Printer offline", onClick: () => {
      addMessage("Printer offline", "user");
      addMessage("Check power and network cable (if wired). Restart the printer.");
      addMessage("On your computer, remove and re-add the printer if needed.");
      endOrRestart();
    }},
    { label: "Poor print quality", onClick: () => {
      addMessage("Poor print quality", "user");
      addMessage("Try running printer cleaning from the printer menu. Check toner/ink levels.");
      endOrRestart();
    }},
    { label: "Back to main menu", onClick: () => startConversation() }
  ]);
}

function wifiFlow() {
  addMessage("WiFi / Internet", "user");
  addMessage("Understood. Which one describes your issue?");

  setChoices([
    { label: "Can’t connect to PCC-Wireless", onClick: () => {
      addMessage("Can’t connect to PCC-Wireless", "user");
      addMessage("Try: (1) forget the network, (2) reconnect, (3) restart your device.");
      addMessage("If it still fails, we may need to reset your credentials.");
      endOrRestart();
    }},
    { label: "Connected but no internet", onClick: () => {
      addMessage("Connected but no internet", "user");
      addMessage("Try turning WiFi off/on and restarting your device. If multiple users are affected, it may be an outage.");
      addMessage("Please contact the HelpDesk and share your location (building/area).");
      endOrRestart();
    }},
    { label: "Slow connection", onClick: () => {
      addMessage("Slow connection", "user");
      addMessage("If possible, move closer to an access point area. Disconnect/reconnect WiFi.");
      addMessage("If it’s still slow, report the location and time so we can check coverage.");
      endOrRestart();
    }},
    { label: "Back to main menu", onClick: () => startConversation() }
  ]);
}

function endOrRestart() {
  setChoices([
    { label: "Restart chat", onClick: () => startConversation() },
    { label: "Close", onClick: () => hideChat() }
  ]);
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

function hideChat() {
  chatSection.classList.remove("show");
  chatSection.setAttribute("aria-hidden", "true");
}
