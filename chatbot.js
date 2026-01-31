const chatLauncher = document.getElementById("chatLauncher");
const chatWidget = document.getElementById("chatWidget");
const chatClose = document.getElementById("chatClose");
const chatMinimize = document.getElementById("chatMinimize");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatBody = document.getElementById("chatBody");

/* CHANGE THIS ONLY */
const API_URL = "https://pcc-chatbot-api.vercel.app/api/chat";

function openChat(){
  chatWidget.classList.add("open");
  document.body.style.overflow = "hidden";
  chatLauncher.style.display = "none";
  setTimeout(()=>chatInput.focus(),50);
}

function closeChat(){
  chatWidget.classList.remove("open");
  document.body.style.overflow = "";
  chatLauncher.style.display = "flex";
}

chatLauncher.onclick = openChat;
chatClose.onclick = closeChat;
chatMinimize.onclick = closeChat;

chatForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const msg = chatInput.value.trim();
  if(!msg) return;

  addMsg("user", msg);
  chatInput.value = "";

  try{
    const res = await fetch(API_URL,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ message: msg })
    });
    const data = await res.json();
    addMsg("assistant", data.reply || "Thanks! A HelpDesk rep will assist you.");
  }catch{
    addMsg("assistant","Sorry, I can’t connect right now. Please contact the HelpDesk.");
  }
});

chatBody.addEventListener("click",e=>{
  const btn = e.target.closest("button[data-q]");
  if(btn){
    chatInput.value = btn.dataset.q;
    chatInput.focus();
  }
});

function addMsg(role,text){
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  wrap.appendChild(bubble);
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}
