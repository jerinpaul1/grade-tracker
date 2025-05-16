// ─── Supabase Client ─────────────────────────────────────────────────────────
const SUPABASE_URL     = "https://tgnhbmqgdupnzkbofotf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDEyNTYsImV4cCI6MjA2Mjk3NzI1Nn0.gNk-pqah8xdmYjkY0qq217xoezqSVjVWsnasiXRmd1o";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── App State ───────────────────────────────────────────────────────────────
let data = { years: [] };
let user = null;

// ─── AUTH ────────────────────────────────────────────────────────────────────
async function checkLogin() {
  const { data: { session } } = await supabase.auth.getSession();
  user = session?.user || null;
  document.getElementById("login").style.display = user ? "none" : "block";
  document.getElementById("app").style.display   = user ? "block" : "none";
  if (user) loadGrades();
}
async function signIn() {
  const email    = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert("Login error: " + error.message);
  checkLogin();
}
async function signUp() {
  const email    = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return alert("Signup error: " + error.message);
  alert("Signup successful! Check your email to confirm.");
}
async function signOut() {
  await supabase.auth.signOut();
  location.reload();
}

// ─── UTIL ────────────────────────────────────────────────────────────────────
async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

// ─── DATA OPERATIONS ──────────────────────────────────────────────────────────
async function loadGrades() {
  const token = await getToken();
  const res   = await fetch("/.netlify/functions/getGrades", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await res.json();
  data = json || { years: [] };

  // ensure collapsed property exists
  data.years.forEach(y => {
    y.modules.forEach(m => {
      if (m.collapsed === undefined) m.collapsed = false;
    });
  });

  render();
}

async function saveGrades() {
  const token = await getToken();
  await fetch("/.netlify/functions/saveGrades", {
    method:  "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  showSaveMessage();
}

// ─── CALCULATIONS ─────────────────────────────────────────────────────────────
function calculateModuleGrade(ass) {
  let total = 0, wsum = 0;
  ass.forEach(a => {
    total += (a.mark||0) * (a.weight||0) / 100;
    wsum  += a.weight||0;
  });
  return wsum === 100 ? total.toFixed(1) + "%" : `${total.toFixed(1)}% (incomplete)`;
}
function calculateYearAvg(year) {
  let sum = 0, cred = 0;
  year.modules.forEach(m => {
    const g = parseFloat(calculateModuleGrade(m.assessments));
    if (!isNaN(g)) { sum += g * m.credits; cred += m.credits; }
  });
  return cred ? (sum/cred).toFixed(1) + "%" : "-";
}
function calculateOverall() {
  let sum = 0, cred = 0;
  data.years.forEach(y => y.modules.forEach(m => {
    const g = parseFloat(calculateModuleGrade(m.assessments));
    if (!isNaN(g)) { sum += g*m.credits; cred += m.credits; }
  }));
  if (!cred) return "-";
  const avg = sum/cred;
  if (avg >= 70) return "First";
  if (avg >= 60) return "2:1";
  if (avg >= 50) return "2:2";
  if (avg >= 40) return "Third";
  return "Fail";
}

// ─── UI ACTIONS ───────────────────────────────────────────────────────────────
function toggleModule(yearIdx, modIdx) {
  const m = data.years[yearIdx].modules[modIdx];
  m.collapsed = !m.collapsed;
  render();
}
function addYear() {
  data.years.push({ name: `Year ${data.years.length+1}`, modules: [] });
  render();
}
function addModule(y) {
  data.years[y].modules.push({
    name: "Module",
    credits: 20,
    assessments: [],
    collapsed: false
  });
  render();
}
function addAssessment(y,m) {
  data.years[y].modules[m].assessments.push({ mark:0, weight:0 });
  render();
}
function updateField(evt, y, m, a, field) {
  const v = evt.target.value;
  if (a!==null) data.years[y].modules[m].assessments[a][field] = parseFloat(v);
  else if (field==="credits") data.years[y].modules[m][field] = parseFloat(v);
  else data.years[y].modules[m][field] = v;
  render();
}

// ─── RENDER ──────────────────────────────────────────────────────────────────
function render() {
  const yearsEl = document.getElementById("years");
  yearsEl.innerHTML = "";

  data.years.forEach((yr, yi) => {
    const yDiv = document.createElement("div");
    yDiv.className = "year";
    yDiv.innerHTML = `<h2>${yr.name}</h2>
      <button onclick="addModule(${yi})">+ Add Module</button>`;
    yearsEl.appendChild(yDiv);

    yr.modules.forEach((m, mi) => {
      const modDiv = document.createElement("div");
      modDiv.className = "module";

      if (m.collapsed) {
        // Collapsed view: name + grade + Edit button
        const grade = calculateModuleGrade(m.assessments);
        modDiv.innerHTML = `
          <strong>${m.name}</strong> — <em>${grade}</em>
          <button onclick="toggleModule(${yi},${mi})">✏️ Edit</button>
        `;
      } else {
        // Expanded view: full inputs + Collapse button
        let html = `
          <button onclick="toggleModule(${yi},${mi})">⬆️ Collapse</button><br/>
          <input value="${m.name}" onchange="updateField(event,${yi},${mi},null,'name')" />
          <input type="number" value="${m.credits}" onchange="updateField(event,${yi},${mi},null,'credits')" /> credits
          <button onclick="addAssessment(${yi},${mi})">+ Add Assessment</button><br/>
        `;
        m.assessments.forEach((a, ai) => {
          html += `
            Mark:<input type="number" value="${a.mark}" onchange="updateField(event,${yi},${mi},${ai},'mark')" />
            Wt:<input type="number" value="${a.weight}" onchange="updateField(event,${yi},${mi},${ai},'weight')" /><br/>
          `;
        });
        const grade = calculateModuleGrade(m.assessments);
        html += `<div><strong>Grade:</strong> ${grade}</div>`;
        modDiv.innerHTML = html;
      }

      yDiv.appendChild(modDiv);
    });

    // Year average
    const ya = calculateYearAvg(yr);
    const avgDiv = document.createElement("div");
    avgDiv.innerHTML = `<strong>Year Average:</strong> ${ya}`;
    yDiv.appendChild(avgDiv);
  });

  document.getElementById("classification").innerText = calculateOverall();
}

// ─── SAVE MSG / RESET / EXPORT / IMPORT ──────────────────────────────────────
function showSaveMessage() {
  const msg = document.getElementById("save-msg");
  msg.style.display = "inline";
  setTimeout(() => msg.style.display = "none", 2000);
}
function resetData() {
  if (!confirm("Reset all data?")) return;
  data = { years: [] };
  render();
  saveGrades();
}
function exportData() {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "grades.json";
  a.click();
  URL.revokeObjectURL(url);
}
function importData(evt) {
  const file = evt.target.files[0], reader = new FileReader();
  reader.onload = e => {
    try {
      data = JSON.parse(e.target.result);
      render();
      saveGrades();
    } catch {
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
}

// ─── INIT ────────────────────────────────────────────────────────────────────
checkLogin();

// Expose to HTML
window.signIn        = signIn;
window.signUp        = signUp;
window.signOut       = signOut;
window.addYear       = addYear;
window.toggleModule  = toggleModule;
window.addModule     = addModule;
window.addAssessment = addAssessment;
window.updateField   = updateField;
window.saveGrades    = saveGrades;
window.resetData     = resetData;
window.exportData    = exportData;
window.importData    = importData;
