const socket=io();
const $=id=>document.getElementById(id);
let roomState=null, mySeat=null, myName="بازیکن";
function note(msg){$("notice").textContent=msg;$("notice").classList.remove("hidden");setTimeout(()=>$("notice").classList.add("hidden"),3000)}
function showGame(){ $("lobby").classList.add("hidden");$("game").classList.remove("hidden"); }
function cardNode(card,clickable=false,owner=""){
 const el=document.createElement("div");el.className="playing-card "+(["♥","♦"].includes(card.suit)?"red":"");
 el.innerHTML=`<span class="rank">${card.rank}</span><span class="suit">${card.suit}</span>${owner?`<span class="owner">${owner}</span>`:""}`;
 if(clickable)el.onclick=()=>socket.emit("game:play",card.id);
 return el;
}
function render(s){
 roomState=s;mySeat=s.mySeat;showGame();$("codeLabel").textContent=s.code;$("scores").textContent=`${s.scores[0]} — ${s.scores[1]}`;
 const phases={lobby:"لابی", "choose-trump":"انتخاب حکم",playing:"در حال بازی","hand-over":"پایان دست"};
 $("phaseLabel").textContent=phases[s.phase]||s.phase;
 s.players.forEach((p,i)=>{const el=$("seat"+i);if(!el)return;el.textContent=`${p.name}${i===s.hakim?" · حاکم":""}${p.ready?" · آماده":""}${!p.connected?" · خالی":""}`;el.classList.toggle("active",s.turn===i);});
 $("turnLabel").textContent=s.phase==="choose-trump"?(mySeat===s.hakim?"شما حاکم هستید؛ حکم را انتخاب کنید":"منتظر انتخاب حکم توسط حاکم") : s.phase==="playing"?(s.turn===mySeat?"نوبت شماست":"منتظر نوبت بازیکن بعدی") : s.phase==="hand-over"?"این دست تمام شد":"چهار بازیکن وارد شوند و آماده شوند";
 $("trick").replaceChildren();s.trick.forEach(t=>$("trick").append(cardNode(t.card,false,s.players[t.seat].name)));
 $("hand").replaceChildren();(s.hand||[]).forEach(c=>$("hand").append(cardNode(c,s.phase==="playing"&&s.turn===mySeat)));
 $("readyBtn").classList.toggle("hidden",s.phase!=="lobby");$("trumpButtons").classList.toggle("hidden",s.phase!=="choose-trump"||mySeat!==s.hakim);$("nextBtn").classList.toggle("hidden",s.phase!=="hand-over"||mySeat!==s.hakim);
}
$("createBtn").onclick=()=>{myName=$("playerName").value.trim()||"بازیکن";socket.emit("room:create",{name:myName})};
$("joinBtn").onclick=()=>{myName=$("playerName").value.trim()||"بازیکن";socket.emit("room:join",{code:$("roomCode").value,name:myName})};
$("readyBtn").onclick=()=>socket.emit("player:ready");
document.querySelectorAll("[data-suit]").forEach(b=>b.onclick=()=>socket.emit("game:trump",b.dataset.suit));
$("nextBtn").onclick=()=>socket.emit("game:next");
$("copyBtn").onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+"?room="+roomState.code);note("لینک دعوت کپی شد.");}catch{note("کد اتاق: "+roomState.code)}};
$("chatForm").onsubmit=e=>{e.preventDefault();const input=$("chatInput");if(input.value.trim())socket.emit("chat:send",input.value);input.value=""};
socket.on("room:created",({code})=>{showGame();$("roomCode").value=code;note("اتاق ساخته شد؛ کد را برای دوستانت بفرست.")});
socket.on("room:joined",({code})=>{showGame();note("به اتاق "+code+" وارد شدی.")});
socket.on("room:state",render);
socket.on("notice",n=>note(n.message));
socket.on("chat:message",m=>{const el=document.createElement("div");el.className="msg";const b=document.createElement("b");b.textContent=m.name;const t=document.createElement("span");t.textContent=m.text;el.append(b,t);$("messages").append(el);$("messages").scrollTop=$("messages").scrollHeight});
const invite=new URLSearchParams(location.search).get("room");if(invite)$("roomCode").value=invite;