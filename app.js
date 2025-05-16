let data = {
  years: []
};

let user = null;

const supabase = window.supabase.createClient(
  "https://tgnhbmqgdupnzkbofotf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDEyNTYsImV4cCI6MjA2Mjk3NzI1Nn0.gNk-pqah8xdmYjkY0qq217xoezqSVjVWsnasiXRmd1o"
);

async function checkLogin() {
  const { data: session } = await supabase.auth.getSession();
  user = session.session?.user;
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
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert(error.message);
  else checkLogin();
}

async function signOut() {
  await supabase.auth.signOut();
  location.reload();
}

function addYear() {
  const yearNumber = data.years.length + 1;
  data.years.push({
    name: `Year ${yearNumber}`,
    modules: []
  });
  render();
}

function addModule(yearIndex) {
  data.years[yearIndex].modules.push({
    name: "Module",
    credits: 20,
    assessments: []
  });
  render();
}

function addAssessment(yearIndex, moduleIndex) {
  data.years[yearIndex].modules[moduleIndex].assessments.push({
    mark: 0,
    weight: 0
  });
  render();
}

function updateField(event, yearIndex, moduleIndex, assessIndex, field) {
  const value = event.target.value;
  if (assessIndex !== null) {
    data.years[yearIndex].modules[moduleIndex].assessments[assessIndex][field] = parseFloat(value);
  } else if (field === "credits") {
    data.years[yearIndex].modules[moduleIndex][field] = parseFloat(value);
  } else {
    data.years[yearIndex].modules[moduleIndex][field] = value;
  }
  render();
}

function calculateModuleGrade(assessments) {
  let total = 0;
  let weightSum = 0;
  for (let a of assessments) {
    total += (a.mark || 0) * (a.weight || 0) / 100;
    weightSum += a.weight || 0;
  }
  return weightSum === 100 ? total : `${total.toFixed(2)} (incomplete)`;
}

function calculateYearAverage(year) {
  let weightedSum = 0;
  let creditSum = 0;
  for (let mod of year.modules) {
    const grade = calculateModuleGrade(mod.assessments);
    if (typeof grade === "number") {
      weightedSum += grade * mod.credits;
      creditSum += mod.credits;
    }
  }
  return creditSum > 0 ? (weightedSum / creditSum).toFixed(2) : "-";
}

function calculateOverallClassification() {
  let totalCredits = 0;
  let totalWeighted = 0;
  for (let year of data.years) {
    for (let mod of year.modules) {
      const grade = calculateModuleGrade(mod.assessments);
      if (typeof grade === "number") {
        totalCredits += mod.credits;
        totalWeighted += grade * mod.credits;
      }
    }
  }

  if (totalCredits === 0) return "-";
  const avg = totalWeighted / totalCredits;
  if (avg >= 70) return "First";
  if (avg >= 60) return "2:1";
  if (avg >= 50) return "2:2";
  if (avg >= 40) return "Third";
  return "Fail";
}

function render() {
  const container = document.getElementById("years");
  container.innerHTML = "";
  data.years.forEach((year, yIdx) => {
    const yearDiv = document.createElement("div");
    yearDiv.className = "year";
    yearDiv.innerHTML = `<h2>${year.name}</h2>
      <button onclick="addModule(${yIdx})">Add Module</button>`;

    year.modules.forEach((mod, mIdx) => {
      const modDiv = document.createElement("div");
      modDiv.className = "module";
      modDiv.innerHTML = `
        <input value="${mod.name}" onchange="updateField(event, ${yIdx}, ${mIdx}, null, 'name')" />
        <input type="number" value="${mod.credits}" onchange="updateField(event, ${yIdx}, ${mIdx}, null, 'credits')" /> credits
        <button onclick="addAssessment(${yIdx}, ${mIdx})">Add Assessment</button>
      `;

      mod.assessments.forEach((a, aIdx) => {
        const assessDiv = document.createElement("div");
        assessDiv.className = "assessment";
        assessDiv.innerHTML = `
          Mark: <input type="number" value="${a.mark}" onchange="updateField(event, ${yIdx}, ${mIdx}, ${aIdx}, 'mark')" />
          Weighting: <input type="number" value="${a.weight}" onchange="updateField(event, ${yIdx}, ${mIdx}, ${aIdx}, 'weight')" />
        `;
        modDiv.appendChild(assessDiv);
      });

      const grade = calculateModuleGrade(mod.assessments);
      modDiv.innerHTML += `<div><strong>Grade:</strong> ${grade}</div>`;
      yearDiv.appendChild(modDiv);
    });

    const avg = calculateYearAverage(year);
    yearDiv.innerHTML += `<div><strong>Year Average:</strong> ${avg}</div>`;
    container.appendChild(yearDiv);
  });

  document.getElementById("classification").innerText = calculateOverallClassification();
}

async function loadGrades() {
  const res = await fetch("/.netlify/functions/getGrades", {
    headers: {
      Authorization: `Bearer ${await getToken()}`
    }
  });
  const result = await res.json();
  if (result.data) data = result.data;
  render();
}

async function saveGrades() {
  await fetch("/.netlify/functions/saveGrades", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ data })
  });
  showSaveMessage();
}

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session.access_token;
}

// ==========================
// New Features
// ==========================

function showSaveMessage() {
  const msg = document.getElementById("save-msg");
  msg.style.display = "inline";
  setTimeout(() => (msg.style.display = "none"), 2000);
}

function resetData() {
  if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
    data = { years: [] };
    render();
    saveGrades();
  }
}

function exportData() {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "grades.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      data = JSON.parse(e.target.result);
      render();
      saveGrades();
    } catch (err) {
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
}

// ==========================
// Init
// ==========================
checkLogin();
window.signIn = signIn;
window.signOut = signOut;
window.addYear = addYear;
window.addModule = addModule;
window.addAssessment = addAssessment;
window.updateField = updateField;
window.saveGrades = saveGrades;
window.resetData = resetData;
window.exportData = exportData;
window.importData = importData;
