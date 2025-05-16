import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ─── Supabase Client ─────────────────────────────────────────────────────────
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
const supabase    = createClient(supabaseUrl, supabaseKey);

// ─── DOM ELEMENTS ────────────────────────────────────────────────────────────
const authDiv        = document.getElementById("auth");
const appDiv         = document.getElementById("app");
const emailIn        = document.getElementById("email");
const passIn         = document.getElementById("password");
const authError      = document.getElementById("auth-error");
const loginBtn       = document.getElementById("login-btn");
const signupBtn      = document.getElementById("signup-btn");
const logoutBtn      = document.getElementById("logout-btn");
const addYearBtn     = document.getElementById("add-year-btn");
const saveBtn        = document.getElementById("save-btn");
const clearBtn       = document.getElementById("clear-btn");
const exportBtn      = document.getElementById("export-btn");
const importBtn      = document.getElementById("import-btn");
const importFile     = document.getElementById("import-file");
const yearsContainer = document.getElementById("years-container");
const classification = document.getElementById("classification");
const saveMsg        = document.getElementById("save-msg");

// ─── AUTH HANDLERS ───────────────────────────────────────────────────────────
loginBtn.onclick = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: emailIn.value,
    password: passIn.value,
  });
  authError.textContent = error ? error.message : "";
  if (!error) await checkSession();
};

signupBtn.onclick = async () => {
  const { error } = await supabase.auth.signUp({
    email: emailIn.value,
    password: passIn.value,
  });
  authError.textContent = error
    ? error.message
    : "Check your email to confirm your account.";
};

logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  showAuth();
};

// ─── SESSION MANAGEMENT ──────────────────────────────────────────────────────
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showApp();
    await loadGrades();
  } else {
    showAuth();
  }
}

function showApp() {
  authDiv.style.display = "none";
  appDiv.style.display  = "block";
}

function showAuth() {
  authDiv.style.display = "flex";
  appDiv.style.display  = "none";
  yearsContainer.innerHTML = "";
}

// ─── LOAD & SAVE VIA NETLIFY FUNCTIONS ───────────────────────────────────────
async function loadGrades() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const token = session.access_token;
  const res = await fetch("/.netlify/functions/getGrades", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await res.json();       // { years: [...] }

  renderGrades(payload.years || []);
}

async function saveGrades() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const token = session.access_token;
  await fetch("/.netlify/functions/saveGrades", {
    method:  "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ years: getCurrentGrades() })
  });

  // Show save confirmation
  saveMsg.style.display = "inline";
  setTimeout(() => (saveMsg.style.display = "none"), 2000);
}

// ─── DATA COLLECTION & CALCULATION ────────────────────────────────────────────
function getCurrentGrades() {
  return [...document.querySelectorAll(".year")].map((year) => {
    const name    = year.querySelector(".year-name").textContent;
    const modules = [...year.querySelectorAll(".module")].map((mod) => {
      const mName   = mod.querySelector(".module-name").value;
      const credits = parseFloat(mod.querySelector(".module-credits").value) || 0;
      const assessments = [...mod.querySelectorAll(".assessment")].map((a) => ({
        mark:   parseFloat(a.querySelector(".mark").value)   || 0,
        weight: parseFloat(a.querySelector(".weight").value) || 0
      }));
      return { name: mName, credits, assessments };
    });
    return { name, modules };
  });
}

function calculateClassification(years) {
  let totalCred = 0, sumWeighted = 0;
  years.forEach((yr) =>
    yr.modules.forEach((mod) => {
      const wsum = mod.assessments.reduce((s,a) => s + a.weight, 0) || 1;
      const avg  = mod.assessments.reduce((s,a) => s + a.mark * a.weight, 0) / wsum;
      totalCred  += mod.credits;
      sumWeighted += avg * mod.credits;
    })
  );
  const overall = totalCred ? sumWeighted / totalCred : 0;
  let cls = "Fail";
  if (overall >= 70) cls = "First";
  else if (overall >= 60) cls = "2:1";
  else if (overall >= 50) cls = "2:2";
  else if (overall >= 40) cls = "Third";
  return `${cls} (${overall.toFixed(1)}%)`;
}

// ─── RENDERING UI ────────────────────────────────────────────────────────────
function renderGrades(years) {
  yearsContainer.innerHTML = "";
  years.forEach((yr, yi) => {
    const yearDiv = createYearDiv(yi, yr.name);
    yr.modules.forEach((mod) => addModuleDiv(yearDiv, mod));
    yearsContainer.appendChild(yearDiv);
  });
  classification.textContent = calculateClassification(years);
}

function createYearDiv(idx, name) {
  const div = document.createElement("div");
  div.className = "year";

  const title = document.createElement("h3");
  title.className = "year-name";
  title.contentEditable = true;
  title.textContent = name;

  const modList = document.createElement("div");
  modList.className = "module-list";

  const btn = document.createElement("button");
  btn.textContent = "+ Add Module";
  btn.onclick = () => addModuleDiv(div);

  div.append(title, modList, btn);
  return div;
}

function addModuleDiv(yearDiv, data = { name: "", credits: 0, assessments: [] }) {
  const mDiv = document.createElement("div");
  mDiv.className = "module";

  const nameIn = document.createElement("input");
  nameIn.className = "module-name";
  nameIn.placeholder = "Module Name";
  nameIn.value = data.name;

  const credIn = document.createElement("input");
  credIn.className = "module-credits";
  credIn.type = "number";
  credIn.placeholder = "Credits";
  credIn.value = data.credits;

  const assessList = document.createElement("div");
  assessList.className = "assessment-list";

  // render existing assessments or one empty row
  (data.assessments.length ? data.assessments : [{}]).forEach((a) =>
    addAssessmentRow(assessList, a)
  );

  const addA = document.createElement("button");
  addA.textContent = "+ Add Assessment";
  addA.onclick = () => addAssessmentRow(assessList);

  mDiv.append(nameIn, credIn, assessList, addA);
  yearDiv.querySelector(".module-list").appendChild(mDiv);
}

function addAssessmentRow(container, a = {}) {
  const row = document.createElement("div");
  row.className = "assessment";

  const markIn = document.createElement("input");
  markIn.className = "mark";
  markIn.type = "number";
  markIn.placeholder = "Mark";
  markIn.value = a.mark ?? "";

  const wtIn = document.createElement("input");
  wtIn.className = "weight";
  wtIn.type = "number";
  wtIn.placeholder = "Weight";
  wtIn.value = a.weight ?? "";

  // re‑calc on change
  [markIn, wtIn].forEach((el) => el.addEventListener("input", () =>
    classification.textContent = calculateClassification(getCurrentGrades())
  ));

  row.append(markIn, wtIn);
  container.appendChild(row);
}

// ─── IMPORT / EXPORT / CLEAR ─────────────────────────────────────────────────
clearBtn.onclick = () => {
  yearsContainer.innerHTML = "";
  classification.textContent = "N/A";
};
exportBtn.onclick = () => {
  const blob = new Blob([JSON.stringify({ years: getCurrentGrades() },null,2)], { type:"application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "grades.json";
  a.click();
};
importBtn.onclick = () => importFile.click();
importFile.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  const { years } = JSON.parse(text);
  renderGrades(years);
  await saveGrades();
};

// ─── BOOTSTRAP ───────────────────────────────────────────────────────────────
checkSession();
