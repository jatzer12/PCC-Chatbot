const chatLauncher = document.getElementById("chatLauncher");
const chatWidget = document.getElementById("chatWidget");
const chatClose = document.getElementById("chatClose");
const chatMinimize = document.getElementById("chatMinimize");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatBody = document.getElementById("chatBody");

/** ✅ Your Vercel API endpoint (most likely correct) */
const API_URL = "https://pcc-chatbot-api.vercel.app/api/chat";

function openChat() {
  chatWidget.classList.add("open");
  document.body.style.overflow = "hidden";
  chatLauncher.style.display = "none";
  setTimeout(() => chatInput.focus(), 50);
}

function closeChat() {
  chatWidget.classList.remove("open");
  document.body.style.overflow = "";
  chatLauncher.style.display = "flex";
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
  const msg = chatInput.value.trim();
  if (!msg) return;

  addMsg("user", msg);
  chatInput.value = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });

    const contentType = res.headers.get("content-type") || "";
    const rawText = await res.text();

    // Log everything for debugging
    console.log("API status:", res.status);
    console.log("API raw response:", rawText);

    if (!res.ok) {
      addMsg("assistant", `Sorry—API error (${res.status}). Check Console (F12) for details.`);
      return;
    }

    // Parse JSON if possible
    let data = null;
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(rawText);
      } catch (err) {
        console.error("JSON parse failed:", err);
      }
    }

    // If API returned non-JSON, show it
    if (!data) {
      addMsg("assistant", rawText || "API returned an empty response.");
      return;
    }

    // Try common reply keys / formats
    const reply =
      data.reply ??
      data.answer ??
      data.text ??
      data.result ??
      data.output ??
      data.message ??
      data.data?.reply ??
      data.data?.answer ??
      data.choices?.[0]?.message?.content ??     // OpenAI-like
      data.choices?.[0]?.text ??                 // older completion-like
      null;

    if (reply) {
      addMsg("assistant", String(reply));
    } else {
      // ✅ If we still can't find a reply field, show the entire JSON.
      addMsg(
        "assistant",
        "I connected to the API, but I didn't find a reply field. Here is what the API returned:\n\n" +
          JSON.stringify(data, null, 2)
      );
    }
  } catch (err) {
    console.error("Fetch failed:", err);
    addMsg("assistant", "Sorry, I can’t connect right now. Please contact the HelpDesk.");
  }
});

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
