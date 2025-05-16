// ─── Supabase Client ─────────────────────────────────────────────────────────
const SUPABASE_URL = "https://tgnhbmqgdupnzkbofotf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDEyNTYsImV4cCI6MjA2Mjk3NzI1Nn0.gNk-pqah8xdmYjkY0qq217xoezqSVjVWsnasiXRmd1o";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let data = { years: [] };
let user = null;

// ─── AUTH ────────────────────────────────────────────────────────────────────
async function checkLogin() {
  const { data: { session } } = await supabase.auth.getSession();
  user = session?.user || null;
  if (!user) {
    document.getElementById("login").style.display = "block";
    document.getElementById("app").style.display = "none";
  } else {
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadGrades();
  }
}
async function signIn() {
  const email = emailEl.value, password = passwordEl.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert(error.message); else checkLogin();
}
async function signUp() {
  const email = emailEl.value, password = passwordEl.value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert(error.message);
  else alert("Please check your email to confirm.");
}
async function signOut() {
  await supabase.auth.signOut();
  location.reload();
}

// ─── UTIL ────────────────────────────────────────────────────────────────────
async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session.access_token;
}

// ─── DATA OPERATIONS ──────────────────────────────────────────────────────────
async function loadGrades() {
  const token = await getToken();
  const res = await fetch("/.netlify/functions/getGrades", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();
  if (json) data = json;
  render();
}
async function saveGrades() {
  const token = await getToken();
  await fetch("/.netlify/functions/saveGrades", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  showSaveMessage();
}

// ─── RENDER & CALCULATIONS ────────────────────────────────────────────────────
function addYear() {
  const idx = data.years.length + 1;
  data.years.push({ name: `Year ${idx}`, modules: [] });
  render();
}
function addModule(y) {
  data.years[y].modules.push({ name: "Module", credits: 20, assessments: [] });
  render();
}
function addAssessment(y, m) {
  data.years[y].modules[m].assessments.push({ mark: 0, weight: 0 });
  render();
}
function updateField(evt, y, m, a, field) {
  const val = evt.target.value;
  if (a != null) data.years[y].modules[m].assessments[a][field] = parseFloat(val);
  else if (field==="credits") data.years[y].modules[m][field] = parseFloat(val);
  else data.years[y].modules[m][field] = val;
  render();
}
function calculateModuleGrade(ass) {
  let t=0,w=0;
  ass.forEach(a=>{ t += (a.mark||0)*(a.weight||0)/100; w+=a.weight||0 });
  return w===100 ? t : `${t.toFixed(1)} (incomplete)`;
}
function calculateYearAvg(year) {
  let sum=0, cred=0;
  year.modules.forEach(m=>{
    const g = calculateModuleGrade(m.assessments);
    if(typeof g==="number"){ sum+=g*m.credits; cred+=m.credits; }
  });
  return cred? (sum/cred).toFixed(1) : "-";
}
function calculateOverall() {
  let sum=0, cred=0;
  data.years.forEach(y=> y.modules.forEach(m=>{
    const g = calculateModuleGrade(m.assessments);
    if(typeof g==="number"){ sum+=g*m.credits; cred+=m.credits; }
  }));
  if(!cred) return "-";
  const avg = sum/cred;
  if(avg>=70) return "First";
  if(avg>=60) return "2:1";
  if(avg>=50) return "2:2";
  if(avg>=40) return "Third";
  return "Fail";
}
function render() {
  const container = document.getElementById("years");
  container.innerHTML = "";
  data.years.forEach((yr, yi)=>{
    const yDiv=document.createElement("div"); yDiv.className="year";
    yDiv.innerHTML = `<h2>${yr.name}</h2>
      <button onclick="addModule(${yi})">+ Add Module</button>`;
    yr.modules.forEach((mod, mi)=>{
      const mDiv=document.createElement("div"); mDiv.className="module";
      mDiv.innerHTML=`
        <input value="${mod.name}" onchange="updateField(event,${yi},${mi},null,'name')" />
        <input type="number" value="${mod.credits}" onchange="updateField(event,${yi},${mi},null,'credits')" /> credits
        <button onclick="addAssessment(${yi},${mi})">+ Add Assessment</button>`;
      mod.assessments.forEach((a, ai)=>{
        const aDiv=document.createElement("div"); aDiv.className="assessment";
        aDiv.innerHTML=`
          Mark:<input type="number" value="${a.mark}" onchange="updateField(event,${yi},${mi},${ai},'mark')" />
          Wt:<input type="number" value="${a.weight}" onchange="updateField(event,${yi},${mi},${ai},'weight')" />`;
        mDiv.appendChild(aDiv);
      });
      const grade = calculateModuleGrade(mod.assessments);
      mDiv.innerHTML += `<div><strong>Grade:</strong> ${grade}</div>`;
      yDiv.appendChild(mDiv);
    });
    const ya=calculateYearAvg(yr);
    yDiv.innerHTML += `<div><strong>Year avg:</strong> ${ya}</div>`;
    container.appendChild(yDiv);
  });
  document.getElementById("classification").innerText = calculateOverall();
}

// ─── SAVE MESSAGE / RESET / EXPORT / IMPORT ──────────────────────────────────
function showSaveMessage() {
  const msg = document.getElementById("save-msg");
  msg.style.display = "inline";
  setTimeout(()=> msg.style.display="none", 2000);
}
function resetData() {
  if(confirm("Reset all data?")){ data={years:[]}; render(); saveGrades(); }
}
function exportData() {
  const blob = new Blob([JSON.stringify(data)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="grades.json"; a.click();
  URL.revokeObjectURL(url);
}
function importData(evt) {
  const f=evt.target.files[0], r=new FileReader();
  r.onload=e=>{ try{data=JSON.parse(e.target.result); render(); saveGrades();}
    catch{alert("Invalid JSON");}
  };
  r.readAsText(f);
}

// ─── INIT ────────────────────────────────────────────────────────────────────
checkLogin();
window.signIn=signIn; window.signUp=signUp; window.signOut=signOut;
window.addYear=addYear; window.addModule=addModule; window.addAssessment=addAssessment;
window.updateField=updateField; window.saveGrades=saveGrades;
window.resetData=resetData; window.exportData=exportData; window.importData=importData;
