import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// === Supabase Setup ===
const supabaseUrl = "https://tgnhbmqgdupnzkbofotf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDEyNTYsImV4cCI6MjA2Mjk3NzI1Nn0.gNk-pqah8xdmYjkY0qq217xoezqSVjVWsnasiXRmd1o";
const supabase = createClient(supabaseUrl, supabaseKey);

// === DOM Elements ===
const authDiv = document.getElementById("auth");
const appDiv = document.getElementById("app");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authError = document.getElementById("auth-error");
const saveBtn = document.getElementById("save-btn");
const clearBtn = document.getElementById("clear-btn");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importFile = document.getElementById("import-file");
const yearsContainer = document.getElementById("years-container");
const classificationSpan = document.getElementById("classification");
const saveMsg = document.getElementById("save-msg");
const addYearBtn = document.getElementById("add-year-btn");

// === AUTH HANDLERS ===
loginBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value,
  });

  if (error) {
    authError.textContent = error.message;
  } else {
    authError.textContent = "";
    await checkSession();
  }
});

signupBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value,
  });

  if (error) {
    authError.textContent = error.message;
  } else {
    authError.textContent = "Check your email to confirm sign-up.";
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  showAuth();
});

// === SESSION HANDLING ===
async function checkSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Session check failed:", error.message);
    return;
  }

  if (session) {
    showApp();
    await loadGrades();
  } else {
    showAuth();
  }
}

function showApp() {
  authDiv.style.display = "none";
  appDiv.style.display = "block";
}

function showAuth() {
  authDiv.style.display = "block";
  appDiv.style.display = "none";
  yearsContainer.innerHTML = "";
}

// === GRADE DATA LOGIC ===

async function loadGrades() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("Error loading user:", error?.message);
    return;
  }

  const { data, error: gradeError } = await supabase
    .from("grades")
    .select("data")
    .eq("user_id", user.id)
    .single();

  if (gradeError && gradeError.code !== "PGRST116") {
    console.error("Error loading grades:", gradeError.message);
    return;
  }

  if (data) renderGrades(data.data);
}

async function saveGrades() {
  const gradeData = getCurrentGrades();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("Error saving: user not found.");
    return;
  }

  const { error: saveError } = await supabase
    .from("grades")
    .upsert({ user_id: user.id, data: gradeData }, { onConflict: ["user_id"] });

  if (saveError) {
    console.error("Save failed:", saveError.message);
  } else {
    saveMsg.style.display = "block";
    setTimeout(() => (saveMsg.style.display = "none"), 2000);
  }
}

function getCurrentGrades() {
  const years = [...document.querySelectorAll(".year")].map((year) => {
    const yearName = year.querySelector(".year-name").textContent;
    const modules = [...year.querySelectorAll(".module")].map((module) => {
      const name = module.querySelector(".module-name").value;
      const grade = parseFloat(module.querySelector(".module-grade").value) || 0;
      const credits = parseFloat(module.querySelector(".module-credits").value) || 0;
      return { name, grade, credits };
    });
    return { yearName, modules };
  });

  return years;
}

function renderGrades(data) {
  yearsContainer.innerHTML = "";
  if (!data) return;

  data.forEach((year, index) => {
    const yearDiv = createYear(index, year.yearName);
    year.modules.forEach((mod) => addModule(yearDiv, mod));
    yearsContainer.appendChild(yearDiv);
  });

  updateClassification();
}

// === UI BUILDING ===

function createYear(index, name = `Year ${index + 1}`) {
  const yearDiv = document.createElement("div");
  yearDiv.classList.add("year");

  const title = document.createElement("h2");
  title.classList.add("year-name");
  title.contentEditable = true;
  title.textContent = name;

  const moduleList = document.createElement("div");
  moduleList.classList.add("module-list");

  const addModuleBtn = document.createElement("button");
  addModuleBtn.textContent = "+ Add Module";
  addModuleBtn.classList.add("btn", "secondary");
  addModuleBtn.addEventListener("click", () => addModule(yearDiv));

  yearDiv.appendChild(title);
  yearDiv.appendChild(moduleList);
  yearDiv.appendChild(addModuleBtn);

  return yearDiv;
}

function addModule(yearDiv, data = { name: "", grade: 0, credits: 0 }) {
  const module = document.createElement("div");
  module.classList.add("module");

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Module Name";
  nameInput.value = data.name;
  nameInput.classList.add("module-name");

  const gradeInput = document.createElement("input");
  gradeInput.type = "number";
  gradeInput.placeholder = "Grade";
  gradeInput.value = data.grade;
  gradeInput.classList.add("module-grade");

  const creditsInput = document.createElement("input");
  creditsInput.type = "number";
  creditsInput.placeholder = "Credits";
  creditsInput.value = data.credits;
  creditsInput.classList.add("module-credits");

  module.append(nameInput, gradeInput, creditsInput);
  yearDiv.querySelector(".module-list").appendChild(module);

  gradeInput.addEventListener("input", updateClassification);
  creditsInput.addEventListener("input", updateClassification);
}

// === DEGREE CLASSIFICATION ===

function updateClassification() {
  const grades = getCurrentGrades();
  let total = 0,
    weighted = 0;

  grades.forEach((year) => {
    year.modules.forEach((mod) => {
      weighted += mod.grade * mod.credits;
      total += mod.credits;
    });
  });

  if (total === 0) {
    classificationSpan.textContent = "N/A";
    return;
  }

  const avg = weighted / total;
  let classif = "Fail";
  if (avg >= 70) classif = "First";
  else if (avg >= 60) classif = "2:1";
  else if (avg >= 50) classif = "2:2";
  else if (avg >= 40) classif = "Third";

  classificationSpan.textContent = `${classif} (${avg.toFixed(2)}%)`;
}

// === CONTROLS ===

addYearBtn.addEventListener("click", () => {
  const index = document.querySelectorAll(".year").length;
  const year = createYear(index);
  yearsContainer.appendChild(year);
});

saveBtn.addEventListener("click", saveGrades);

clearBtn.addEventListener("click", () => {
  yearsContainer.innerHTML = "";
  classificationSpan.textContent = "N/A";
});

exportBtn.addEventListener("click", () => {
  const data = JSON.stringify(getCurrentGrades(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "grades.json";
  link.click();
});

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  try {
    const data = JSON.parse(text);
    renderGrades(data);
    await saveGrades();
  } catch (err) {
    alert("Invalid JSON file.");
  }
});

// === INITIAL LOAD ===
checkSession();
