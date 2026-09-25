// ====================== CALCULATOR DATA ======================
const costData = {
  hacking: { name: "Hacking & Disposal", none: [0,0], light: [1500,3000], moderate: [3000,5500], extensive: [5500,9000],
    desc: { none:"", light:"Remove some tiles, cabinets or minor partitions only", moderate:"Hack kitchen + 1-2 bathrooms + some flooring", extensive:"Full unit hacking (most walls, all wet areas, old flooring)" } },
  masonry: { name: "Masonry / Tiling & Waterproofing", none: [0,0], light: [3000,6000], moderate: [6000,12000], extensive: [12000,20000],
    desc: { none:"", light:"Touch-up tiling or small area only", moderate:"Kitchen + bathrooms full tiling + waterproofing", extensive:"Whole house tiling + full waterproofing" } },
  carpentry: { name: "Carpentry (Kitchen + Wardrobes + Storage)", none: [0,0], light: [8000,15000], moderate: [15000,25000], extensive: [25000,40000],
    desc: { none:"", light:"Basic kitchen cabinets + 1 wardrobe only", moderate:"Full kitchen + 2-3 wardrobes + TV console", extensive:"Full custom carpentry throughout the house" } },
  electrical: { name: "Electrical & Lighting", none: [0,0], light: [2000,4000], moderate: [4000,7000], extensive: [7000,12000],
    desc: { none:"", light:"Add some power points & basic lighting changes", moderate:"Partial rewiring + new lighting points", extensive:"Full rewiring of the unit" } },
  plumbing: { name: "Plumbing", none: [0,0], light: [1500,3500], moderate: [3500,6000], extensive: [6000,10000],
    desc: { none:"", light:"Minor pipe changes", moderate:"Kitchen + bathroom plumbing overhaul", extensive:"Full unit re-piping" } },
  painting: { name: "Painting", none: [0,0], light: [1200,2500], moderate: [2500,4000], extensive: [4000,6500],
    desc: { none:"", light:"Touch-up or 1-2 rooms only", moderate:"Whole house standard paint", extensive:"Whole house + feature walls" } },
  ceiling: { name: "Ceiling / Partition / False Ceiling", none: [0,0], light: [1000,2500], moderate: [2500,5000], extensive: [5000,9000],
    desc: { none:"", light:"Simple cornice or small area", moderate:"False ceiling in living + some rooms", extensive:"Full false ceiling + partitions" } },
  windows: { name: "Windows / Doors / Grilles", none: [0,0], light: [1500,3500], moderate: [3500,6000], extensive: [6000,10000],
    desc: { none:"", light:"Replace 1-2 doors or add grilles", moderate:"New main door + several internal doors", extensive:"Full set of windows / doors / grilles" } },
  cleaning: { name: "Final Cleaning & Disposal", none: [0,0], light: [400,800], moderate: [800,1500], extensive: [1500,2500],
    desc: { none:"", light:"Basic post-reno cleaning", moderate:"Standard full cleaning", extensive:"Deep cleaning + extra disposal" } }
};

const propertyMultiplier = {
  "apartment-new": 0.85,
  "apartment-resale": 1.0,
  "condo-new": 0.90,
  "condo-resale": 1.15
};

// ====================== MENU ======================
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

// ====================== CALCULATOR ======================
function renderCategories() {
  const container = document.getElementById("categories");
  if (!container) return;
  container.innerHTML = "";
  Object.keys(costData).forEach(key => {
    const item = costData[key];
    const div = document.createElement("div");
    div.className = "category-item";
    div.innerHTML = `
      <div class="category-top">
        <div class="category-name">${item.name}</div>
        <select id="${key}">
          <option value="none">None</option>
          <option value="light">Light</option>
          <option value="moderate" selected>Moderate</option>
          <option value="extensive">Extensive</option>
        </select>
      </div>
      <div class="intensity-desc" id="desc-${key}"></div>
    `;
    container.appendChild(div);
    const select = div.querySelector("select");
    select.addEventListener("change", function() { updateDescription(key, this.value); });
    updateDescription(key, "moderate");
  });
}

function updateDescription(key, intensity) {
  const descEl = document.getElementById(`desc-${key}`);
  if (!descEl) return;
  const text = costData[key].desc[intensity] || "";
  if (text) {
    descEl.textContent = text;
    descEl.classList.add("show");
  } else {
    descEl.classList.remove("show");
  }
}

function formatMoney(num) {
  return "RM " + Math.round(num).toLocaleString("en-MY");
}

function getAreaInSqft() {
  let area = parseFloat(document.getElementById("floorArea").value) || 1000;
  if (document.getElementById("areaUnit").value === "sqm") area *= 10.7639;
  return area;
}

function calculate() {
  const propMult = propertyMultiplier[document.getElementById("propertyType").value] || 1;
  const sizeMult = Math.pow(getAreaInSqft() / 1000, 0.85);
  const finalMult = propMult * sizeMult;

  let totalLow = 0, totalHigh = 0;
  const breakdown = [];

  Object.keys(costData).forEach(key => {
    const intensity = document.getElementById(key).value;
    const costs = costData[key][intensity];
    const low = costs[0] * finalMult;
    const high = costs[1] * finalMult;
    totalLow += low;
    totalHigh += high;
    if (intensity !== "none") {
      breakdown.push({ name: costData[key].name, intensity: intensity.charAt(0).toUpperCase() + intensity.slice(1), low, high });
    }
  });

  totalLow *= 1.10;
  totalHigh *= 1.10;

  document.getElementById("totalRange").textContent = `${formatMoney(totalLow)} – ${formatMoney(totalHigh)}`;
  document.getElementById("areaInfo").textContent = 
    `${document.getElementById("floorArea").value} ${document.getElementById("areaUnit").value} • ${document.getElementById("bedrooms").value} Bed • ${document.getElementById("bathrooms").value} Bath`;

  const tbody = document.getElementById("breakdownBody");
  tbody.innerHTML = "";
  breakdown.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.name}</td><td>${item.intensity}</td><td>${formatMoney(item.low)} – ${formatMoney(item.high)}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById("resultSection").style.display = "block";
}

// ====================== CHECKLIST + LOCAL STORAGE ======================
let items = JSON.parse(localStorage.getItem("renoChecklist") || "[]");
let waitingForClick = false;
let tempItem = null;

function saveItems() {
  localStorage.setItem("renoChecklist", JSON.stringify(items));
}

document.getElementById("planUpload")?.addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = document.getElementById("planImage");
    img.src = event.target.result;
    img.style.display = "block";
    localStorage.setItem("renoPlanImage", event.target.result);
  };
  reader.readAsDataURL(file);
});

// Load saved image
window.addEventListener("load", () => {
  const savedImage = localStorage.getItem("renoPlanImage");
  if (savedImage) {
    const img = document.getElementById("planImage");
    img.src = savedImage;
    img.style.display = "block";
  }
  renderMarkers();
  renderChecklist();
});

document.getElementById("addItemBtn")?.addEventListener("click", function() {
  const area = document.getElementById("itemArea").value;
  const name = document.getElementById("itemName").value.trim();
  if (!name) return alert("Please enter item name");
  tempItem = { area, name, done: false, x: 0, y: 0 };
  waitingForClick = true;
  alert("Now click on the floor plan to place the marker");
});

document.getElementById("planContainer")?.addEventListener("click", function(e) {
  if (!waitingForClick || !tempItem) return;
  const rect = document.getElementById("planImage").getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  tempItem.x = x;
  tempItem.y = y;
  items.push({ ...tempItem, id: Date.now() });
  waitingForClick = false;
  tempItem = null;
  document.getElementById("itemName").value = "";
  saveItems();
  renderMarkers();
  renderChecklist();
});

function renderMarkers() {
  const container = document.getElementById("markers");
  if (!container) return;
  container.innerHTML = "";
  items.forEach(item => {
    const marker = document.createElement("div");
    marker.className = "marker" + (item.done ? " done" : "");
    marker.style.left = item.x + "%";
    marker.style.top = item.y + "%";
    marker.innerHTML = `<div class="marker-label">${item.name}</div>`;
    container.appendChild(marker);
  });
}

function renderChecklist() {
  const container = document.getElementById("checklistItems");
  if (!container) return;
  if (items.length === 0) {
    container.innerHTML = `<p class="hint">No items yet. Add your first item above.</p>`;
    return;
  }
  container.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "checklist-item";
    div.innerHTML = `
      <input type="checkbox" id="check-${item.id}" ${item.done ? "checked" : ""}>
      <label for="check-${item.id}">${item.name}</label>
      <span class="item-area">${item.area}</span>
      <button class="delete-btn" data-id="${item.id}">Delete</button>
    `;
    container.appendChild(div);

    div.querySelector("input").addEventListener("change", function() {
      item.done = this.checked;
      saveItems();
      renderMarkers();
    });

    div.querySelector(".delete-btn").addEventListener("click", function() {
      items = items.filter(i => i.id !== Number(this.dataset.id));
      saveItems();
      renderMarkers();
      renderChecklist();
    });
  });
}

// ====================== LOAN CALCULATOR ======================
document.getElementById("calcLoanBtn")?.addEventListener("click", function() {
  const P = parseFloat(document.getElementById("loanAmount").value);
  const annualRate = parseFloat(document.getElementById("interestRate").value) / 100;
  const years = parseFloat(document.getElementById("loanYears").value);
  const r = annualRate / 12;
  const n = years * 12;

  const monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const totalPay = monthly * n;
  const totalInterest = totalPay - P;

  document.getElementById("monthlyPayment").textContent = formatMoney(monthly);
  document.getElementById("totalPayment").textContent = formatMoney(totalPay);
  document.getElementById("totalInterest").textContent = formatMoney(totalInterest);
  document.getElementById("loanResult").style.display = "block";
});

// ====================== RENTAL YIELD ======================
document.getElementById("calcYieldBtn")?.addEventListener("click", function() {
  const price = parseFloat(document.getElementById("propertyPrice").value);
  const rent = parseFloat(document.getElementById("monthlyRent").value);
  const maint = parseFloat(document.getElementById("maintenanceFee").value);
  const sinking = parseFloat(document.getElementById("sinkingFund").value);

  const annualGross = rent * 12;
  const annualCost = (maint + sinking) * 12;
  const annualNet = annualGross - annualCost;
  const yieldPercent = (annualNet / price) * 100;

  document.getElementById("grossRent").textContent = formatMoney(annualGross);
  document.getElementById("annualCost").textContent = formatMoney(annualCost);
  document.getElementById("netIncome").textContent = formatMoney(annualNet);
  document.getElementById("netYield").textContent = yieldPercent.toFixed(2) + "%";
  document.getElementById("yieldResult").style.display = "block";
});

// ====================== INIT ======================
document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  document.getElementById("calculateBtn")?.addEventListener("click", calculate);
  renderMarkers();
  renderChecklist();
});
// ====================== COMMITMENTS ======================
let commitments = [
  { id: 1, name: "Car Loan", amount: 0 },
  { id: 2, name: "Personal Loan", amount: 0 },
  { id: 3, name: "PTPTN / Education", amount: 0 }
];

function renderCommitments() {
  const container = document.getElementById("commitmentsList");
  if (!container) return;
  container.innerHTML = "";

  commitments.forEach(c => {
    const row = document.createElement("div");
    row.className = "commitment-row";
    row.innerHTML = `
      <input type="text" value="${c.name}" data-id="${c.id}" class="commit-name" placeholder="e.g. Car Loan">
      <input type="number" value="${c.amount}" data-id="${c.id}" class="commit-amount" placeholder="RM" min="0">
      <button type="button" class="remove-commit" data-id="${c.id}">×</button>
    `;
    container.appendChild(row);
  });

  // Name change
  container.querySelectorAll(".commit-name").forEach(input => {
    input.addEventListener("change", function() {
      const item = commitments.find(c => c.id === Number(this.dataset.id));
      if (item) item.name = this.value;
    });
  });

  // Amount change
  container.querySelectorAll(".commit-amount").forEach(input => {
    input.addEventListener("input", function() {
      const item = commitments.find(c => c.id === Number(this.dataset.id));
      if (item) item.amount = parseFloat(this.value) || 0;
    });
  });

  // Remove
  container.querySelectorAll(".remove-commit").forEach(btn => {
    btn.addEventListener("click", function() {
      commitments = commitments.filter(c => c.id !== Number(this.dataset.id));
      renderCommitments();
    });
  });
}

document.getElementById("addCommitBtn")?.addEventListener("click", () => {
  commitments.push({
    id: Date.now(),
    name: "Other Loan",
    amount: 0
  });
  renderCommitments();
});

// ====================== LOAN + AFFORDABILITY ======================
document.getElementById("calcLoanBtn")?.addEventListener("click", function() {
  const salary = parseFloat(document.getElementById("monthlySalary").value) || 0;
  const otherIncome = parseFloat(document.getElementById("otherIncome").value) || 0;
  const totalIncome = salary + otherIncome;

  const totalCommitment = commitments.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Loan calculation
  const P = parseFloat(document.getElementById("loanAmount").value) || 0;
  const annualRate = parseFloat(document.getElementById("interestRate").value) / 100 || 0;
  const years = parseFloat(document.getElementById("loanYears").value) || 30;
  const r = annualRate / 12;
  const n = years * 12;

  let monthly = 0;
  if (r > 0) {
    monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  } else {
    monthly = P / n;
  }

  const totalPay = monthly * n;
  const totalInterest = totalPay - P;

  // Affordability (based on your rules)
  const maxHousePrice = totalIncome * 0.60 * 200;          // rough annualised feel, or adjust
  // Better interpretation of your rules:
  const suggestedLoanLimit = totalIncome * 0.30 * 200;     // common bank DSR style rough estimate
  const totalAffordable = totalIncome * 0.35 * 200;
  const cashNeeded = (suggestedLoanLimit / 0.7) * 0.30;    // assume 70% loan, 30% cash

  // Cleaner version matching your description more closely
  const capabilityBuy = totalIncome * 60;                  // monthly × 60 (rough yearly capacity feel)
  const houseLoanLimit = totalIncome * 0.30;               // monthly loan limit
  const totalLimit = totalIncome * 0.35;                   // monthly total obligation limit
  const advisedCash = (document.getElementById("loanAmount").value * 0.30) || 0;

  // Display
  document.getElementById("monthlyPayment").textContent = formatMoney(monthly);
  document.getElementById("totalPayment").textContent = formatMoney(totalPay);
  document.getElementById("totalInterest").textContent = formatMoney(totalInterest);

  document.getElementById("AdvisedHousePrice").textContent = formatMoney(totalIncome * 60);      // salary × 60
  document.getElementById("loanLimit").textContent = formatMoney(totalIncome * 0.30);       // salary × 0.3 (monthly)
  document.getElementById("totalLimit").textContent = formatMoney(totalIncome * 0.35);      // salary × 0.35
  document.getElementById("cashNeeded").textContent = formatMoney(P * 0.30);                // 30% of loan/house price

  document.getElementById("loanResult").style.display = "block";
  document.getElementById("loanResult").scrollIntoView({ behavior: "smooth" });
});

// Init commitments when page loads
document.addEventListener("DOMContentLoaded", () => {
  renderCommitments();
});