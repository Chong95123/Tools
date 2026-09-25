// ====================== DATA ======================
const costData = {
  hacking: { name: "Hacking & Disposal", none:[0,0], light:[1500,3000], moderate:[3000,5500], extensive:[5500,9000],
    desc:{none:"", light:"Remove some tiles, cabinets or minor partitions only", moderate:"Hack kitchen + 1-2 bathrooms + some flooring", extensive:"Full unit hacking (most walls, all wet areas, old flooring)"} },
  masonry: { name: "Masonry / Tiling & Waterproofing", none:[0,0], light:[3000,6000], moderate:[6000,12000], extensive:[12000,20000],
    desc:{none:"", light:"Touch-up tiling or small area only", moderate:"Kitchen + bathrooms full tiling + waterproofing", extensive:"Whole house tiling + full waterproofing"} },
  carpentry: { name: "Carpentry (Kitchen + Wardrobes + Storage)", none:[0,0], light:[8000,15000], moderate:[15000,25000], extensive:[25000,40000],
    desc:{none:"", light:"Basic kitchen cabinets + 1 wardrobe only", moderate:"Full kitchen + 2-3 wardrobes + TV console", extensive:"Full custom carpentry throughout the house"} },
  electrical: { name: "Electrical & Lighting", none:[0,0], light:[2000,4000], moderate:[4000,7000], extensive:[7000,12000],
    desc:{none:"", light:"Add some power points & basic lighting", moderate:"Partial rewiring + new lighting points", extensive:"Full rewiring of the unit"} },
  plumbing: { name: "Plumbing", none:[0,0], light:[1500,3500], moderate:[3500,6000], extensive:[6000,10000],
    desc:{none:"", light:"Minor pipe changes", moderate:"Kitchen + bathroom plumbing overhaul", extensive:"Full unit re-piping"} },
  painting: { name: "Painting", none:[0,0], light:[1200,2500], moderate:[2500,4000], extensive:[4000,6500],
    desc:{none:"", light:"Touch-up or 1-2 rooms only", moderate:"Whole house standard paint", extensive:"Whole house + feature walls"} },
  ceiling: { name: "Ceiling / Partition / False Ceiling", none:[0,0], light:[1000,2500], moderate:[2500,5000], extensive:[5000,9000],
    desc:{none:"", light:"Simple cornice or small area", moderate:"False ceiling in living + some rooms", extensive:"Full false ceiling + partitions"} },
  windows: { name: "Windows / Doors / Grilles", none:[0,0], light:[1500,3500], moderate:[3500,6000], extensive:[6000,10000],
    desc:{none:"", light:"Replace 1-2 doors or add grilles", moderate:"New main door + several internal doors", extensive:"Full set of windows / doors / grilles"} },
  cleaning: { name: "Final Cleaning & Disposal", none:[0,0], light:[400,800], moderate:[800,1500], extensive:[1500,2500],
    desc:{none:"", light:"Basic post-reno cleaning", moderate:"Standard full cleaning", extensive:"Deep cleaning + extra disposal"} }
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

// ====================== HELPERS ======================
function formatMoney(num) {
  return "RM " + Math.round(num).toLocaleString("en-MY");
}

function getAreaInSqft() {
  let area = parseFloat(document.getElementById("floorArea").value) || 1000;
  if (document.getElementById("areaUnit").value === "sqm") area *= 10.7639;
  return area;
}

// ====================== RENOVATION CALCULATOR ======================
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
    select.addEventListener("change", () => updateDescription(key, select.value));
    updateDescription(key, "moderate");
  });
}

function updateDescription(key, intensity) {
  const el = document.getElementById(`desc-${key}`);
  if (!el) return;
  const text = costData[key].desc[intensity] || "";
  if (text) {
    el.textContent = text;
    el.classList.add("show");
  } else {
    el.classList.remove("show");
  }
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
      breakdown.push({
        name: costData[key].name,
        intensity: intensity.charAt(0).toUpperCase() + intensity.slice(1),
        low, high
      });
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

// ====================== CHECKLIST ======================
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

window.addEventListener("load", () => {
  const saved = localStorage.getItem("renoPlanImage");
  if (saved) {
    const img = document.getElementById("planImage");
    img.src = saved;
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
    const m = document.createElement("div");
    m.className = "marker" + (item.done ? " done" : "");
    m.style.left = item.x + "%";
    m.style.top = item.y + "%";
    m.innerHTML = `<div class="marker-label">${item.name}</div>`;
    container.appendChild(m);
  });
}

function renderChecklist() {
  const container = document.getElementById("checklistItems");
  if (!container) return;
  if (items.length === 0) {
    container.innerHTML = `<p class="hint">No items yet.</p>`;
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

// ====================== LOAN & DSR ======================
let commitments = [
  { id: 1, name: "Car Loan", amount: 0 },
  { id: 2, name: "Personal Loan", amount: 0 },
  { id: 3, name: "PTPTN", amount: 0 }
];

function renderCommitments() {
  const container = document.getElementById("commitmentsList");
  if (!container) return;
  container.innerHTML = "";
  commitments.forEach(c => {
    const row = document.createElement("div");
    row.className = "commitment-row";
    row.innerHTML = `
      <input type="text" value="${c.name}" class="commit-name" data-id="${c.id}">
      <input type="number" value="${c.amount}" class="commit-amount" data-id="${c.id}" min="0">
      <button type="button" class="remove-commit" data-id="${c.id}">×</button>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll(".commit-name").forEach(inp => {
    inp.addEventListener("change", function() {
      const item = commitments.find(c => c.id === Number(this.dataset.id));
      if (item) item.name = this.value;
    });
  });
  container.querySelectorAll(".commit-amount").forEach(inp => {
    inp.addEventListener("input", function() {
      const item = commitments.find(c => c.id === Number(this.dataset.id));
      if (item) item.amount = parseFloat(this.value) || 0;
    });
  });
  container.querySelectorAll(".remove-commit").forEach(btn => {
    btn.addEventListener("click", function() {
      commitments = commitments.filter(c => c.id !== Number(this.dataset.id));
      renderCommitments();
    });
  });
}

document.getElementById("addCommitBtn")?.addEventListener("click", () => {
  commitments.push({ id: Date.now(), name: "Other Loan", amount: 0 });
  renderCommitments();
});

document.getElementById("calcLoanBtn")?.addEventListener("click", function() {
  const salary = parseFloat(document.getElementById("monthlySalary").value) || 0;
  const other = parseFloat(document.getElementById("otherIncome").value) || 0;
  const totalIncome = salary + other;
  const totalCommit = commitments.reduce((s, c) => s + (c.amount || 0), 0);

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

  // DSR
  const dsr = totalIncome > 0 ? ((totalCommit + monthly) / totalIncome) * 100 : 0;

  // Display
  document.getElementById("monthlyPayment").textContent = formatMoney(monthly);
  document.getElementById("totalPayment").textContent = formatMoney(totalPay);
  document.getElementById("totalInterest").textContent = formatMoney(totalInterest);

  const dsrBox = document.getElementById("dsrBox");
  const dsrValue = document.getElementById("dsrValue");
  const dsrStatus = document.getElementById("dsrStatus");
  dsrValue.textContent = dsr.toFixed(1) + "%";

  dsrBox.classList.remove("excellent", "good", "risk");
  if (dsr <= 60) {
    dsrBox.classList.add("excellent");
    dsrStatus.textContent = "Excellent (High approval chance)";
  } else if (dsr <= 70) {
    dsrBox.classList.add("good");
    dsrStatus.textContent = "Acceptable / Borderline";
  } else {
    dsrBox.classList.add("risk");
    dsrStatus.textContent = "High Risk (May need joint applicant)";
  }

  // Your original multipliers
  document.getElementById("maxHousePrice").textContent = formatMoney(totalIncome * 60);
  document.getElementById("loanLimit").textContent = formatMoney(totalIncome * 0.30);
  document.getElementById("totalLimit").textContent = formatMoney(totalIncome * 0.35);
  document.getElementById("cashNeeded").textContent = formatMoney(P * 0.30);

  document.getElementById("loanResult").style.display = "block";
});

// ====================== ENTRY COST ======================
document.getElementById("calcEntryBtn")?.addEventListener("click", function() {
  const price = parseFloat(document.getElementById("entryPrice").value) || 0;
  const downPct = parseFloat(document.getElementById("downPercent").value) || 10;
  const loan = parseFloat(document.getElementById("entryLoan").value) || 0;

  const downPayment = price * (downPct / 100);

  // Stamp Duty (MOT) - Malaysian citizen/PR tiers
  let stampDuty = 0;
  if (price <= 100000) {
    stampDuty = price * 0.01;
  } else if (price <= 500000) {
    stampDuty = 1000 + (price - 100000) * 0.02;
  } else if (price <= 1000000) {
    stampDuty = 9000 + (price - 500000) * 0.03;
  } else {
    stampDuty = 24000 + (price - 1000000) * 0.04;
  }

  const loanStamp = loan * 0.005;               // 0.5%
  const legalFee = price * 0.012;               // rough 1.2%
  const valuation = Math.min(Math.max(price * 0.002, 800), 2500); // rough

  const total = downPayment + stampDuty + loanStamp + legalFee + valuation;

  document.getElementById("totalCash").textContent = formatMoney(total);

  const tbody = document.getElementById("entryBreakdown");
  tbody.innerHTML = `
    <tr><td>Down Payment (${downPct}%)</td><td>${formatMoney(downPayment)}</td></tr>
    <tr><td>Stamp Duty (MOT)</td><td>${formatMoney(stampDuty)}</td></tr>
    <tr><td>Loan Agreement Stamp Duty (0.5%)</td><td>${formatMoney(loanStamp)}</td></tr>
    <tr><td>Legal Fees (estimate)</td><td>${formatMoney(legalFee)}</td></tr>
    <tr><td>Valuation Fee (estimate)</td><td>${formatMoney(valuation)}</td></tr>
    <tr style="font-weight:700;"><td>Total Upfront Cash</td><td>${formatMoney(total)}</td></tr>
  `;

  document.getElementById("entryResult").style.display = "block";
});

// ====================== RENTAL YIELD ======================
document.getElementById("calcYieldBtn")?.addEventListener("click", function() {
  const price = parseFloat(document.getElementById("rentalPrice").value) || 0;
  const rent = parseFloat(document.getElementById("monthlyRent").value) || 0;
  const maint = parseFloat(document.getElementById("maintFee").value) || 0;
  const sinking = parseFloat(document.getElementById("sinkingFund").value) || 0;
  const assessment = parseFloat(document.getElementById("assessmentTax").value) || 0;
  const quit = parseFloat(document.getElementById("quitRent").value) || 0;
  const insurance = parseFloat(document.getElementById("insurance").value) || 0;
  const loanInst = parseFloat(document.getElementById("rentalLoan").value) || 0;

  const annualGross = rent * 12;
  const annualExpenses = (maint + sinking) * 12 + assessment + quit + insurance;
  const annualNet = annualGross - annualExpenses;
  const yieldPct = price > 0 ? (annualNet / price) * 100 : 0;
  const netCashFlow = rent - maint - sinking - loanInst;

  document.getElementById("grossRent").textContent = formatMoney(annualGross);
  document.getElementById("annualExpenses").textContent = formatMoney(annualExpenses);
  document.getElementById("netIncome").textContent = formatMoney(annualNet);
  document.getElementById("netYield").textContent = yieldPct.toFixed(2) + "%";
  document.getElementById("netCashFlow").textContent = formatMoney(netCashFlow);

  document.getElementById("yieldResult").style.display = "block";
});

// ====================== INIT ======================
document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderCommitments();
  document.getElementById("calculateBtn")?.addEventListener("click", calculate);
  renderMarkers();
  renderChecklist();
});