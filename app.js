const supabaseClient = supabase.createClient(
  'https://tgnhbmqgdupnzkbofotf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDEyNTYsImV4cCI6MjA2Mjk3NzI1Nn0.gNk-pqah8xdmYjkY0qq217xoezqSVjVWsnasiXRmd1o'
);

let currentSession = null;

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return alert('Login error: ' + error.message);

  currentSession = data.session;
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'inline-block';
  await loadGrades();
}

async function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return alert('Signup error: ' + error.message);

  alert('Check your email to confirm the signup.');
}

async function logout() {
  await supabaseClient.auth.signOut();
  currentSession = null;
  document.getElementById('auth-container').style.display = 'block';
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('yearContainer').innerHTML = '';
}

supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) {
    currentSession = data.session;
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    loadGrades();
  }
});

// Grade logic
document.getElementById("addYearBtn").addEventListener("click", () => {
  const yearContainer = document.getElementById("yearContainer");
  const yearDiv = document.createElement("div");
  yearDiv.className = "year";
  yearDiv.innerHTML = `
    <h2 contenteditable="true">Year</h2>
    <button class="addModuleBtn">Add Module</button>
    <div class="modules"></div>
  `;
  yearDiv.querySelector(".addModuleBtn").addEventListener("click", () => {
    const moduleDiv = document.createElement("div");
    moduleDiv.className = "module";
    moduleDiv.innerHTML = `
      <input placeholder="Module Name">
      <input placeholder="Credits" type="number">
      <button class="addAssessmentBtn">Add Assessment</button>
      <div class="assessments"></div>
    `;
    moduleDiv.querySelector(".addAssessmentBtn").addEventListener("click", () => {
      const aDiv = document.createElement("div");
      aDiv.className = "assessment";
      aDiv.innerHTML = `
        <input placeholder="Mark" type="number">
        <input placeholder="Weight %" type="number">
      `;
      moduleDiv.querySelector(".assessments").appendChild(aDiv);
    });
    yearDiv.querySelector(".modules").appendChild(moduleDiv);
  });
  yearContainer.appendChild(yearDiv);
});

function extractData() {
  const years = [];
  document.querySelectorAll(".year").forEach(y => {
    const modules = [];
    y.querySelectorAll(".module").forEach(m => {
      const assessments = [];
      m.querySelectorAll(".assessment").forEach(a => {
        assessments.push({
          mark: parseFloat(a.children[0].value),
          weight: parseFloat(a.children[1].value),
        });
      });
      modules.push({
        name: m.children[0].value,
        credits: parseFloat(m.children[1].value),
        assessments
      });
    });
    years.push({
      year: y.querySelector("h2").innerText,
      modules
    });
  });
  return years;
}

function restoreFromData(data) {
  document.getElementById("yearContainer").innerHTML = "";
  data.forEach(yr => {
    const yearDiv = document.createElement("div");
    yearDiv.className = "year";
    yearDiv.innerHTML = `
      <h2 contenteditable="true">${yr.year}</h2>
      <button class="addModuleBtn">Add Module</button>
      <div class="modules"></div>
    `;
    yearDiv.querySelector(".addModuleBtn").addEventListener("click", () => {
      const moduleDiv = document.createElement("div");
      moduleDiv.className = "module";
      moduleDiv.innerHTML = `
        <input placeholder="Module Name">
        <input placeholder="Credits" type="number">
        <button class="addAssessmentBtn">Add Assessment</button>
        <div class="assessments"></div>
      `;
      moduleDiv.querySelector(".addAssessmentBtn").addEventListener("click", () => {
        const aDiv = document.createElement("div");
        aDiv.className = "assessment";
        aDiv.innerHTML = `
          <input placeholder="Mark" type="number">
          <input placeholder="Weight %" type="number">
        `;
        moduleDiv.querySelector(".assessments").appendChild(aDiv);
      });
      yearDiv.querySelector(".modules").appendChild(moduleDiv);
    });
    const moduleContainer = yearDiv.querySelector(".modules");
    yr.modules.forEach(m => {
      const moduleDiv = document.createElement("div");
      moduleDiv.className = "module";
      moduleDiv.innerHTML = `
        <input placeholder="Module Name" value="${m.name}">
        <input placeholder="Credits" type="number" value="${m.credits}">
        <button class="addAssessmentBtn">Add Assessment</button>
        <div class="assessments"></div>
      `;
      const aContainer = moduleDiv.querySelector(".assessments");
      m.assessments.forEach(a => {
        const aDiv = document.createElement("div");
        aDiv.className = "assessment";
        aDiv.innerHTML = `
          <input placeholder="Mark" type="number" value="${a.mark}">
          <input placeholder="Weight %" type="number" value="${a.weight}">
        `;
        aContainer.appendChild(aDiv);
      });
      moduleContainer.appendChild(moduleDiv);
    });
    document.getElementById("yearContainer").appendChild(yearDiv);
  });
}

async function loadGrades() {
  if (!currentSession) return;
  const res = await fetch('/.netlify/functions/getGrades', {
    headers: {
      'Authorization': 'Bearer ' + currentSession.access_token
    }
  });
  const data = await res.json();
  if (data) restoreFromData(data);
}

async function saveGrades() {
  if (!currentSession) return;
  const data = extractData();
  await fetch('/.netlify/functions/saveGrades', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + currentSession.access_token
    },
    body: JSON.stringify(data)
  });
}
