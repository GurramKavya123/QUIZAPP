const API_BASE="https://opentdb.com/api.php";
let questions=[],currentIndex=0,score=0,chosenAnswers=[],timer=null;
const TIME_PER_Q=20;

// Elements
const startBtn=document.getElementById("startBtn");
const categorySel=document.getElementById("category");
const difficultySel=document.getElementById("difficulty");
const amountSel=document.getElementById("amount");

const landing=document.getElementById("landing");
const quizPage=document.getElementById("quizPage");

const progressEl=document.getElementById("progress");
const totalEl=document.getElementById("total");
const scoreEl=document.getElementById("score");
const card=document.getElementById("card");
const questionEl=document.getElementById("question");
const optionsEl=document.getElementById("options");
const backBtn=document.getElementById("backBtn");
const nextBtn=document.getElementById("nextBtn");
const skipBtn=document.getElementById("skipBtn");
const resultEl=document.getElementById("result");
const timerPath=document.getElementById("timerPath");
const timerText=document.getElementById("timerText");

function decodeHTMLEntities(str){const txt=document.createElement("textarea");txt.innerHTML=str;return txt.value;}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function buildApiUrl(){const params=new URLSearchParams();params.set("amount",amountSel.value||"10");params.set("type","multiple");if(categorySel.value)params.set("category",categorySel.value);if(difficultySel.value)params.set("difficulty",difficultySel.value);return `${API_BASE}?${params.toString()}`;}

async function fetchQuestions(){
  if(categorySel.value==="indiaHistory"){return offlineIndiaHistoryQuestions();}
  try{const res=await fetch(buildApiUrl());const data=await res.json();if(data.response_code!==0||!data.results?.length)throw new Error("No questions");return data.results.map(q=>{const all=shuffle([...q.incorrect_answers,q.correct_answer]);return{question:decodeHTMLEntities(q.question),options:all.map(decodeHTMLEntities),correct:decodeHTMLEntities(q.correct_answer)};});}catch(e){return offlineQuestions();}
}

function offlineQuestions(){return shuffle([{question:"Which language runs in a web browser?",options:["Java","C","Python","JavaScript"],correct:"JavaScript"}]).slice(0,Number(amountSel?.value||5));}

function offlineIndiaHistoryQuestions(){
  return shuffle([
    {question:"Who was the first Governor-General of India?",options:["Warren Hastings","Lord Canning","Lord Mountbatten","Robert Clive"],correct:"Warren Hastings"},
    {question:"In which year did the Revolt of 1857 take place?",options:["1856","1857","1858","1859"],correct:"1857"},
    {question:"Who was known as the Iron Man of India?",options:["Mahatma Gandhi","Subhas Chandra Bose","Sardar Vallabhbhai Patel","Jawaharlal Nehru"],correct:"Sardar Vallabhbhai Patel"},
    {question:"Who founded the Maurya Empire?",options:["Ashoka","Chandragupta Maurya","Bindusara","Chanakya"],correct:"Chandragupta Maurya"},
    {question:"The Jallianwala Bagh massacre happened in which year?",options:["1917","1919","1921","1923"],correct:"1919"},
    {question:"Who was the last Mughal emperor of India?",options:["Bahadur Shah II","Aurangzeb","Shah Jahan","Akbar II"],correct:"Bahadur Shah II"},
    {question:"The Quit India Movement was launched in which year?",options:["1940","1942","1944","1945"],correct:"1942"},
    {question:"Who was the first President of India?",options:["Dr. B.R. Ambedkar","Rajendra Prasad","Jawaharlal Nehru","S. Radhakrishnan"],correct:"Rajendra Prasad"},
    {question:"Who was the founder of the Gupta dynasty?",options:["Chandragupta I","Samudragupta","Skandagupta","Chandragupta II"],correct:"Chandragupta I"},
    {question:"In which year did India gain Independence?",options:["1945","1946","1947","1948"],correct:"1947"}
  ]).slice(0,Number(amountSel?.value||5));
}

function startTimer(){let t=TIME_PER_Q;timerText.textContent=t;updateCircle(100);clearInterval(timer);timer=setInterval(()=>{t--;updateCircle(Math.max(0,Math.round((t/TIME_PER_Q)*100)));timerText.textContent=Math.max(0,t);if(t<=0){clearInterval(timer);lockQuestion(null);nextQuestion();}},1000);}
function updateCircle(p){timerPath.setAttribute("stroke-dasharray",`${p},100`);}

function renderQuestion(){const q=questions[currentIndex];progressEl.textContent=currentIndex+1;totalEl.textContent=questions.length;questionEl.textContent=q.question;optionsEl.innerHTML="";q.options.forEach(opt=>{const btn=document.createElement("button");btn.className="option-btn";btn.textContent=opt;btn.addEventListener("click",()=>onSelect(opt,btn));optionsEl.appendChild(btn);});startTimer();restorePreviousAnswer();}

function onSelect(sel,btn){if([...optionsEl.children].some(b=>b.classList.contains("correct")||b.classList.contains("wrong")))return;lockQuestion(sel,btn);}
function lockQuestion(sel,btn){clearInterval(timer);const correct=questions[currentIndex].correct;[...optionsEl.children].forEach(b=>{if(b.textContent===correct)b.classList.add("correct");else if(sel&&b===btn)b.classList.add("wrong");});if(sel===correct)score++;chosenAnswers[currentIndex]={selected:sel||null,correct};scoreEl.textContent=score;}

function nextQuestion(){currentIndex++;if(currentIndex<questions.length)renderQuestion();else showResult();}
function prevQuestion(){if(currentIndex>0){currentIndex--;renderQuestion();}}

function restorePreviousAnswer(){const prev=chosenAnswers[currentIndex];if(prev){Array.from(optionsEl.children).forEach((btn)=>{if(btn.textContent===prev.correct)btn.classList.add("correct");if(prev.selected&&btn.textContent===prev.selected&&prev.selected!==prev.correct){btn.classList.add("wrong");}});}}

function showQuiz(){landing.classList.add("hidden");quizPage.classList.remove("hidden");resultEl.classList.add("hidden");card.classList.remove("hidden");}
function showResult(){card.classList.add("hidden");resultEl.classList.remove("hidden");resultEl.className="result fullscreen";resultEl.innerHTML=`<h2>🎉 Congrats! 🎉</h2><p>Your Score: <strong>${score}</strong> / ${questions.length}</p><canvas id="confetti"></canvas>`;startConfetti();}

startBtn.addEventListener("click",async()=>{score=0;currentIndex=0;chosenAnswers=[];scoreEl.textContent="0";questions=await fetchQuestions();totalEl.textContent=questions.length;showQuiz();renderQuestion();});
nextBtn.addEventListener("click",()=>{if(!chosenAnswers[currentIndex])lockQuestion(null);nextQuestion();});
skipBtn.addEventListener("click",()=>{lockQuestion(null);nextQuestion();});
backBtn.addEventListener("click",()=>{prevQuestion();});

// Confetti animation
function startConfetti(){const canvas=document.getElementById("confetti");const ctx=canvas.getContext("2d");canvas.width=window.innerWidth;canvas.height=window.innerHeight;const pieces=new Array(200).fill().map(()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*6+4,d:Math.random()*0.5+0.5,color:`hsl(${Math.random()*360},100%,50%)`}));function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);pieces.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();p.y+=p.d*4;if(p.y>canvas.height){p.y=0;p.x=Math.random()*canvas.width;}});}function loop(){draw();requestAnimationFrame(loop);}loop();}
