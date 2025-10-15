/* =====  FIREBASE CONFIG  ===== */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "YOUR-KEY",
  authDomain: "YOUR-PROJECT.firebaseapp.com",
  projectId: "YOUR-PROJECT",
  storageBucket: "YOUR-PROJECT.appspot.com",
  messagingSenderId: "XXXX",
  appId: "YYYY"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* =====  DOM HELPERS  ===== */
const $ = q => document.querySelector(q);
const storage = (k,v) => v===undefined ? JSON.parse(localStorage.getItem(k)||'null') : localStorage.setItem(k,JSON.stringify(v));

/* =====  THEME  ===== */
$('#darkToggle').addEventListener('change',e=>{
  document.body.classList.toggle('dark',e.target.checked);
  storage('dark',e.target.checked);
});
if(storage('dark')){document.body.classList.add('dark'); $('#darkToggle').checked=true;}

/* =====  AUTH UI  ===== */
$('#googleBtn').onclick = () => signInWithPopup(auth,provider).catch(console.error);
$('#mailBtn').onclick = () => {
  const email = prompt('Enter your e-mail:');
  if(!email) return;
  const action = {url: location.href, handleCodeInApp:true};
  sendSignInLinkToEmail(auth, email, action).then(()=>{
    alert('Check your inbox & click the link!');
    storage('emailForSignIn', email);
  }).catch(console.error);
};
$('#outBtn').onclick = () => signOut(auth);

/* auto-sign-in if user arrived via e-mail link */
if(isSignInWithEmailLink(auth, location.href)){
  const email = storage('emailForSignIn');
  if(email){
    signInWithEmailLink(auth, email, location.href).then(()=>history.replaceState(null,null,'/')).catch(console.error);
  }
}

onAuthStateChanged(auth, user=>{
  if(user){
    $('#authSection').style.display='none';
    $('#nav').classList.remove('hidden');
    $('#main').classList.remove('hidden');
    storage('userName', user.displayName||user.email.split('@')[0]);
    initApp();
  }else{
    $('#authSection').style.display='block';
    $('#nav').classList.add('hidden');
    $('#main').classList.add('hidden');
  }
});

/* =====  APP LOGIC  ===== */
const courses = [
  "MS 6","MS 7","MS 8",
  "HS Alg 1","HS Geo","HS Alg 2","HS Pre-Calc","HS Calc AB","HS Calc BC","HS Stats",
  "Hon Geo","Hon Alg 2","Hon Pre-Calc","Hon Calc AB","Hon Calc BC",
  "AP Calc AB","AP Calc BC","AP Stats","AP Phys 1","AP Phys 2","AP Phys C","AP Chem","AP Bio","AP Enviro","APUSH","AP World","AP Euro","AP Gov","AP Micro","AP Macro","AP CS A","AP CSP",
  "IB SL Math","IB HL Math","IB SL Phys","IB HL Phys","IB SL Chem","IB HL Chem","IB SL Bio","IB HL Bio",
  "College 1","College 2","College 3","College 4","Grad"
];
[$('#soloCourse'),$('#compCourse')].forEach(sel=> courses.forEach(c=> sel.innerHTML+=`<option>${c}</option>`));

let soloInterval, soloSecs=25*60, compInterval, myBar=0, rivalBar=0;

/* solo timer */
$('#startSolo').onclick=()=>{
  if(soloInterval)return;
  soloSecs=25*60;
  $('#startSolo').disabled=true;
  soloInterval = setInterval(()=>{
    soloSecs--;
    const m=String(Math.floor(soloSecs/60)).padStart(2,0), s=String(soloSecs%60).padStart(2,0);
    $('#soloTimer').textContent=`${m}:${s}`;
    $('#soloProgress').style.width=`${(1-soloSecs/(25*60))*100}%`;
    if(soloSecs<=0){ finishSolo(); }
  },1000);
};
function finishSolo(){
  clearInterval(soloInterval); soloInterval=null;
  $('#startSolo').disabled=false;
  award(25);
  confetti();
}

/* 1v1 battle */
$('#findMatch').onclick=()=>{
  $('#matchArea').innerHTML='<p>Matching…</p>';
  setTimeout(()=>{
    $('#matchArea').innerHTML=`
      <div class="room">
        <div><p><strong>You</strong></p><div class="progress-bar"><div id="myBar"></div></div></div>
        <div><p><strong>Anonymous 🔥</strong></p><div class="progress-bar"><div id="rivalBar"></div></div></div>
      </div>
      <button class="cta" id="startBattle">Start 10-min battle</button>`;
    $('#startBattle').onclick=startBattle;
  },1200);
};
function startBattle(){
  let secs=10*60;
  myBar=0; rivalBar=0;
  compInterval=setInterval(()=>{
    secs--;
    myBar+=Math.random()*2.2; rivalBar+=Math.random()*2;
    $('#myBar').style.width=`${Math.min(myBar,100)}%`;
    $('#rivalBar').style.width=`${Math.min(rivalBar,100)}%`;
    if(myBar>=100||rivalBar>=100||secs<=0){
      clearInterval(compInterval);
      const won=myBar>=rivalBar;
      alert(won?'You win! +50':'Close! +10');
      award(won?50:10); storage('wins', (storage('wins')||0)+(won?1:0));
      $('#matchArea').innerHTML=''; myBar=0; rivalBar=0;
    }
  },1000);
}

/* points & leaders */
function award(pts){
  const today=new Date().toISOString().slice(0,10);
  const board=storage('board')||{};
  if(!board[today])board[today]={};
  const name=storage('userName');
  board[today][name]=(board[today][name]||0)+pts;
  storage('board',board);
  storage('totalMin', (storage('totalMin')||0)+pts);
}
function renderLeaders(){
  const today=new Date().toISOString().slice(0,10);
  const b=storage('board')||{};
  const arr=Object.entries(b[today]||{}).sort((a,b)=>b[1]-a[1]).slice(0,10);
  $('#soloLeader').innerHTML= arr.length ? arr.map(([n,p],i)=>`<div class="leader-item">${i+1}. ${n}<span>${p} pts</span></div>`).join('')
                                        : '<div class="leader-item">No scores yet today.</div>';
  $('#compLeader').innerHTML= `<div class="leader-item">${storage('userName')} <span>${storage('wins')||0} wins</span></div>`;
}

/* nav */
document.querySelectorAll('nav button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    btn.classList.add('active'); $(`#${btn.dataset.view}`).classList.add('active');
    if(btn.dataset.view==='leader') renderLeaders();
    if(btn.dataset.view==='profile') renderProfile();
  });
});
function renderProfile(){
  $('#cardName').textContent=storage('userName');
  $('#cardMin').textContent=storage('totalMin')||0;
  $('#cardWins').textContent=storage('wins')||0;
  const lvlNames=['Rookie','Spark','Fire','Blaze','Inferno','Supernova'];
  const min=storage('totalMin')||0;
  const lvl=min<60?0:min<180?1:min<480?2:min<1200?3:min<2400?4:5;
  $('#cardLvl').textContent=lvlNames[lvl];
}
$('#resetProf').onclick=()=>{if(confirm('Erase ALL local data?')){localStorage.clear();location.reload();}};

/* midnight reset */
if(storage('lastReset')!==new Date().toISOString().slice(0,10)){
  storage('board',{});
  storage('lastReset',new Date().toISOString().slice(0,10));
}

/* confetti */
function confetti(){
  const canvas=$('#confetti'), ctx=canvas.getContext('2d'), W=innerWidth, H=innerHeight;
  canvas.width=W; canvas.height=H;
  const pcs=[], colors=['#f43f5e','#ec4899','#8b5cf6','#3b82f6'];
  for(let i=0;i<150;i++) pcs.push({x:W*Math.random(),y:H*Math.random(),r:Math.random()*4+2,color:colors[Math.floor(Math.random()*colors.length)],vy:Math.random()*3+2});
  function draw(){
    ctx.clearRect(0,0,W,H);
    pcs.forEach(p=>{p.y+=p.vy; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=p.color; ctx.fill();});
    if(pcs[0].y<H+20) requestAnimationFrame(draw); else ctx.clearRect(0,0,W,H);
  }
  draw();
}

function initApp(){
  renderProfile();
  renderLeaders();
}
