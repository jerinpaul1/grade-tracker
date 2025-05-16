let data = [];

const app = document.getElementById("app");
const addYearBtn = document.getElementById("addYearBtn");
const classificationEl = document.getElementById("classification");

addYearBtn.onclick = () => {
  const year = {
    name: `Year ${data.length + 1}`,
    modules: []
  };
  data.push(year);
  render();
  saveData();
};

function render() {
  app.innerHTML = '';
  data.forEach((year, yIndex) => {
    const yearDiv = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = year.name;
    yearDiv.appendChild(title);

    const addModuleBtn = document.createElement("button");
    addModuleBtn.textContent = "+ Add Module";
    addModuleBtn.onclick = () => {
      year.modules.push({
        name: `Module ${year.modules.length + 1}`,
        credits: 0,
        assessments: []
      });
      render();
      saveData();
    };
    yearDiv.appendChild(addModuleBtn);

    year.modules.forEach((mod, mIndex) => {
      const modDiv = document.createElement("div");
      const modTitle = document.createElement("input");
      modTitle.value = mod.name;
      modTitle.oninput = (e) => {
        mod.name = e.target.value;
        saveData();
      };
      const creditInput = document.createElement("input");
      creditInput.type = "number";
      creditInput.value = mod.credits;
      creditInput.placeholder = "Credits";
      creditInput.oninput = (e) => {
        mod.credits = +e.target.value;
        saveData();
      };
      modDiv.appendChild(modTitle);
      modDiv.appendChild(creditInput);

      const addAssessmentBtn = document.createElement("button");
      addAssessmentBtn.textContent = "+ Add Assessment";
      addAssessmentBtn.onclick = () => {
        mod.assessments.push({ mark: 0, weight: 0 });
        render();
        saveData();
      };
      modDiv.appendChild(addAssessmentBtn);

      let totalWeight = 0;
      let weightedMark = 0;

      mod.assessments.forEach((a, aIndex) => {
        const markInput = document.createElement("input");
        markInput.type = "number";
        markInput.value = a.mark;
        markInput.placeholder = "Mark";
        markInput.oninput = (e) => {
          a.mark = +e.target.value;
          render();
          saveData();
        };

        const weightInput = document.createElement("input");
        weightInput.type = "number";
        weightInput.value = a.weight;
        weightInput.placeholder = "Weight %";
        weightInput.oninput = (e) => {
          a.weight = +e.target.value;
          render();
          saveData();
        };

        modDiv.appendChild(markInput);
        modDiv.appendChild(weightInput);

        totalWeight += a.weight;
        weightedMark += (a.mark * a.weight) / 100;
      });

      if (totalWeight <= 100) {
        const remaining = 100 - totalWeight;
        const requiredForFirst = Math.max(0, (70 * 100 - weightedMark * 100) / remaining);
        const predictedText = remaining > 0
          ? `Remaining: ${remaining}%. To get 70%, need ${requiredForFirst.toFixed(1)}%.`
          : `Module grade: ${weightedMark.toFixed(1)}%`;

        const pred = document.createElement("p");
        pred.textContent = predictedText;
        modDiv.appendChild(pred);
      }

      yearDiv.appendChild(modDiv);
    });

    app.appendChild(yearDiv);
  });

  showClassification();
}

function showClassification() {
  let totalWeighted = 0;
  let totalCredits = 0;

  data.forEach(year => {
    year.modules.forEach(mod => {
      let mark = 0;
      let weight = 0;
      mod.assessments.forEach(a => {
        mark += a.mark * a.weight / 100;
        weight += a.weight;
      });
      if (weight > 0) {
        totalWeighted += (mark * mod.credits);
        totalCredits += mod.credits;
      }
    });
  });

  const avg = totalCredits > 0 ? totalWeighted / totalCredits : 0;
  let grade = "Fail";
  if (avg >= 70) grade = "First";
  else if (avg >= 60) grade = "2:1";
  else if (avg >= 50) grade = "2:2";
  else if (avg >= 40) grade = "Third";

  classificationEl.textContent = `Overall Average: ${avg.toFixed(1)}% → ${grade}`;
}

async function saveData() {
  await fetch("/.netlify/functions/saveGrades", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

async function loadData() {
  const res = await fetch("/.netlify/functions/getGrades");
  data = await res.json();
  render();
}

loadData();
