const form=document.getElementById("chatForm"), input=document.getElementById("messageInput"), messagesEl=document.getElementById("messages"), sendBtn=document.getElementById("sendBtn");
let history=[];
function addBubble(text,who){const el=document.createElement("div");el.className=`bubble ${who}`;el.textContent=text;messagesEl.appendChild(el);messagesEl.scrollTop=messagesEl.scrollHeight;return el}
async function send(text){text=text.trim();if(!text)return;addBubble(text,"user");history.push({role:"user",content:text});input.value="";sendBtn.disabled=true;const wait=addBubble("Thinking…","assistant typing");
try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:history})});const data=await r.json();wait.remove();if(!r.ok)throw new Error(data.error||"Request failed");addBubble(data.reply,"assistant");history.push({role:"assistant",content:data.reply});history=history.slice(-12)}
catch(e){wait.remove();addBubble(e.message+" (Check that the server and API key are configured.)","assistant")}
finally{sendBtn.disabled=false;input.focus()}}
form.addEventListener("submit",e=>{e.preventDefault();send(input.value)});
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
document.querySelectorAll(".tool").forEach(b=>b.addEventListener("click",()=>send(b.dataset.prompt)));
document.getElementById("clearBtn").addEventListener("click",()=>{history=[];messagesEl.innerHTML="";addBubble("Chat cleared. What are we building today? 🎮","assistant")});
let deferredPrompt;const installBtn=document.getElementById("installBtn");
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove("hidden")});
installBtn.addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.classList.add("hidden")});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
