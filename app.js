import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase setup
const supabaseUrl = "https://tgnhbmqgdupnzkbofotf.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDEyNTYsImV4cCI6MjA2Mjk3NzI1Nn0.gNk-pqah8xdmYjkY0qq217xoezqSVjVWsnasiXRmd1o";
const supabase = createClient(supabaseUrl, supabaseKey);

// UI elements
const authDiv = document.getElementById("auth");
const appDiv = document.getElementById("app");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authError = document.getElementById("auth-error");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtn = document.getElementById("logout-btn");
const saveMsg = document.getElementById("save-msg");

// Show/hide UI
function showApp() {
  authDiv.style.display = "none";
  appDiv.style.display = "block";
}

function showAuth() {
  authDiv.style.display = "block";
  appDiv.style.display = "none";
}

// Auth functions
async function checkAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session && session.user) {
    showApp();
    loadGrades(); // Load user data
  } else {
    showAuth();
  }
}

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    authError.textContent = error.message;
  } else {
    authError.textContent = "";
    checkAuth(); // Re-check and show app
  }
});

signupBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    authError.textContent = error.message;
  } else {
    authError.textContent = "Signup successful. Check your email.";
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  showAuth();
});

// Auto-check auth on load
checkAuth();

////////////////////////////////////////////////////////////////////////////////
// Grade Tracker Logic
////////////////////////////////////////////////////////////////////////////////

const yearsDiv = document.getElementById("years");
const classificationSpan = document.getElementById("classification");

window.addYear = function () {
  const yearDiv = document.createElement("div");
  yearDiv.className = "year";
  yearDiv.innerHTML = `
    <h2 contenteditable="true">Year</h2>
    <div class="modules"></div>
    <button class="btn small" onclick="addModule(this)">+ Add Module</button>
  `;
  yearsDiv.appendChild(yearDiv);
};

window.addModule = function (btn) {
  const modulesDiv = btn.previousElementSibling;
  const moduleDiv = document.createElement("div");
  moduleDiv.className = "module";
  moduleDiv.innerHTML = `
    <input type="text" placeholder="Module Name" />
    <input type="number" placeholder="Grade (%)" />
    <input type="number" placeholder="Credits" />
    <button class="btn small" onclick="removeModule(this)">❌</button>
  `;
  modulesDiv.appendChild(moduleDiv);
};

window.removeModule = function (btn) {
  btn.parentElement.remove();
};

window.saveGrades = async function () {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const grades = getGrades();
  await supabase
    .from("grades")
    .upsert({ user_id: user.id, data: grades });

  saveMsg.style.display = "block";
  setTimeout(() => (saveMsg.style.display = "none"), 2000);
};

function getGrades() {
  const years = [];
  document.querySelectorAll(".year").forEach((yearDiv) => {
    const yearName = yearDiv.querySelector("h2").textContent.trim();
    const modules = [];

    yearDiv.querySelectorAll(".module").forEach((mod) => {
      const [name, grade, credits] = mod.querySelectorAll("input");
      if (name.value && grade.value && credits.value) {
        modules.push({
          name: name.value,
          grade: parseFloat(grade.value),
          credits: parseFloat(credits.value),
        });
      }
    });

    if (modules.length > 0) {
      years.push({ year: yearName, modules });
    }
  });

  return years;
}

async function loadGrades() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from("grades")
    .select("data")
    .eq("user_id", user.id)
    .single();

  if (data && data.data) {
    renderGrades(data.data);
  }
}

function renderGrades(years) {
  yearsDiv.innerHTML = "";
  years.forEach((y) => {
    const yearDiv = document.createElement("div");
    yearDiv.className = "year";
    yearDiv.innerHTML = `
      <h2 contenteditable="true">${y.year}</h2>
      <div class="modules"></div>
      <button class="btn small" onclick="addModule(this)">+ Add Module</button>
    `;

    const modulesDiv = yearDiv.querySelector(".modules");

    y.modules.forEach((m) => {
      const moduleDiv = document.createElement("div");
      moduleDiv.className = "module";
      moduleDiv.innerHTML = `
        <input type="text" placeholder="Module Name" value="${m.name}" />
        <input type="number" placeholder="Grade (%)" value="${m.grade}" />
        <input type="number" placeholder="Credits" value="${m.credits}" />
        <button class="btn small" onclick="removeModule(this)">❌</button>
      `;
      modulesDiv.appendChild(moduleDiv);
    });

    yearsDiv.appendChild(yearDiv);
  });
  calculateClassification();
}

window.resetData = function () {
  if (confirm("Are you sure you want to clear all data?")) {
    yearsDiv.innerHTML = "";
    classificationSpan.textContent = "";
  }
};

window.exportData = function () {
  const data = JSON.stringify(getGrades(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "grades.json";
  a.click();
};

window.importData = function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = JSON.parse(e.target.result);
    renderGrades(data);
  };
  reader.readAsText(file);
};

function calculateClassification() {
  const grades = getGrades();
  let totalCredits = 0;
  let weightedSum = 0;

  grades.forEach((year) => {
    year.modules.forEach((m) => {
      totalCredits += m.credits;
      weightedSum += m.grade * m.credits;
    });
  });

  if (totalCredits === 0) return;

  const avg = weightedSum / totalCredits;
  let classification = "";

  if (avg >= 70) classification = "First Class";
  else if (avg >= 60) classification = "Upper Second (2:1)";
  else if (avg >= 50) classification = "Lower Second (2:2)";
  else if (avg >= 40) classification = "Third Class";
  else classification = "Fail";

  classificationSpan.textContent = classification;
}

// Auto-update classification on changes
document.addEventListener("input", () => calculateClassification());
