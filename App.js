document.addEventListener('DOMContentLoaded', () => {
  const yearsContainer = document.getElementById('yearsContainer');
  const addYearButton = document.getElementById('addYear');
  const overallClassification = document.getElementById('overallClassification');

  let data = [];

  const classifications = [
    { min: 70, name: 'First' },
    { min: 60, name: '2:1' },
    { min: 50, name: '2:2' },
    { min: 40, name: 'Third' },
    { min: 0, name: 'Fail' },
  ];

  function calculateClassification(average) {
    return classifications.find(c => average >= c.min).name;
  }

  function saveData() {
    fetch('/.netlify/functions/saveGrades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  function loadData() {
    fetch('/.netlify/functions/getGrades')
      .then(res => res.json())
      .then(savedData => {
        data = savedData || [];
        render();
      });
  }

  function render() {
    yearsContainer.innerHTML = '';
    let totalCredits = 0;
    let totalWeightedAverage = 0;

    data.forEach((year, yearIndex) => {
      const yearDiv = document.createElement('div');
      yearDiv.className = 'year';

      const yearTitle = document.createElement('h2');
      yearTitle.textContent = year.name || `Year ${yearIndex + 1}`;
      yearDiv.appendChild(yearTitle);

      const addModuleButton = document.createElement('button');
      addModuleButton.textContent = 'Add Module';
      addModuleButton.onclick = () => {
        year.modules.push({ name: '', credits: 0, assessments: [] });
        saveData();
        render();
      };
      yearDiv.appendChild(addModuleButton);

      year.modules.forEach((module, moduleIndex) => {
        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'module';

        const moduleNameInput = document.createElement('input');
        moduleNameInput.placeholder = 'Module Name';
        moduleNameInput.value = module.name;
        moduleNameInput.oninput = (e) => {
          module.name = e.target.value;
          saveData();
        };
        moduleDiv.appendChild(moduleNameInput);

        const moduleCreditsInput = document.createElement('input');
        moduleCreditsInput.type = 'number';
        moduleCreditsInput.placeholder = 'Credits';
        moduleCreditsInput.value = module.credits;
        moduleCreditsInput.oninput = (e) => {
          module.credits = parseInt(e.target.value) || 0;
          saveData();
          render();
        };
        moduleDiv.appendChild(moduleCreditsInput);

        const addAssessmentButton = document.createElement('button');
        addAssessmentButton.textContent = 'Add Assessment';
        addAssessmentButton.onclick = () => {
          module.assessments.push({ mark: 0, weight: 0 });
          saveData();
          render();
        };
        moduleDiv.appendChild(addAssessmentButton);

        let moduleTotal = 0;
        let moduleWeight = 0;

        module.assessments.forEach((assessment, assessmentIndex) => {
          const assessmentDiv = document.create 
