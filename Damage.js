// ===============================
// Damage.js
// ===============================

// Class tính toán sát thương
class DamageCalculator {
  constructor(baseValue, attackCount, attacks, defenses) {
    this.baseValue = parseFloat(baseValue) || 0;
    this.attackCount = parseInt(attackCount) || 0;
    this.attacks = attacks || [];
    this.defenses = defenses || {};
  }

  calculateDamage() {
    const results = [];

    for (let i = 0; i < this.attackCount; i++) {
      const attackValue = parseFloat(document.getElementById(`attackValue${i}`)?.value) || 0;
      const damageType = document.getElementById(`damageType${i}`)?.value || "None";
      const trueDamageChecked = document.getElementById(`trueDamage${i}`)?.checked || false;
      const pierceDamageChecked = document.getElementById(`pierceDamage${i}`)?.checked || false;
      const antiTrue = document.getElementById(`antiTrue${i}`)?.checked || false;
      const antiPierce = document.getElementById(`antiPierce${i}`)?.checked || false;
      const resistance = parseFloat(document.getElementById(`resistance${i}`)?.value) || 1;

      // Collect defense values
      const defenseFields = document.getElementById(`defenseFields${i}`);
      const percentResistances = [];
      const fixedResistances = [];

      if (defenseFields && defenseFields.children.length > 0) {
        let count = 1;
        for (let field of defenseFields.children) {
          const percentRes = parseFloat(field.querySelector(`#percentRes${i}_${count}`)?.value) || 0;
          const fixedRes = parseFloat(field.querySelector(`#fixedRes${i}_${count}`)?.value) || 0;
          percentResistances.push(percentRes);
          fixedResistances.push(fixedRes);
          count++;
        }
      }

      // Flags
      const hasTrueDamage = trueDamageChecked && !antiTrue;
      const hasPierceDamage = pierceDamageChecked && !antiPierce;

      let damageTaken = attackValue;
      let formula = "";

      if (hasTrueDamage) {
        // True Damage: bỏ qua %Res, nhưng vẫn trừ FixedRes và nhân hệ kháng
        const totalFixed = fixedResistances.reduce((a, b) => a + b, 0);
        damageTaken = (attackValue - totalFixed) * Math.max(resistance, 1);
        formula = `(${attackValue} - ${totalFixed}) * ${Math.max(resistance, 1)}`;
      } else if (hasPierceDamage) {
        // Pierce Damage: áp dụng %Res, bỏ qua FixedRes
        const percentFactor = percentResistances.reduce((acc, res) => acc * (100 - res) / 100, 1);
        damageTaken = attackValue * percentFactor * resistance;
        formula = `${attackValue} * ${percentResistances.map(r => `(100-${r})%`).join(" * ") || "1"} * ${resistance}`;
      } else {
        // Normal Damage: %Res → FixedRes → Hệ kháng
        const percentFactor = percentResistances.reduce((acc, res) => acc * (100 - res) / 100, 1);
        const totalFixed = fixedResistances.reduce((a, b) => a + b, 0);
        damageTaken = (attackValue * percentFactor - totalFixed) * resistance;
        formula = `(${attackValue} * ${percentResistances.map(r => `(100-${r})%`).join(" * ") || "1"} - ${totalFixed}) * ${resistance}`;
      }

      damageTaken = Math.round(damageTaken * 100) / 100;

      results.push({
        damage: damageTaken,
        message: `Công thức: ${formula} <br> ➜ Sát thương nhận vào: ${damageTaken}`
      });
    }

    return results;
  }
}

// ===============================
// UI Manager
// ===============================
class DamageUIManager {
  constructor() {
    this.container = document.getElementById("damageCalculator");
    this.addAttackBtn = document.getElementById("addAttackBtn");
    this.clearBtn = document.createElement("button");
    this.clearBtn.textContent = "Xóa tất cả";
    this.clearBtn.className = "btn clear";
    this.container.parentNode.insertBefore(this.clearBtn, this.addAttackBtn.nextSibling);
  }

  renderAttackInputs(count, attacks = []) {
    this.container.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const attack = attacks[i] || {};
      const group = document.createElement("div");
      group.className = "attack-group";
      group.innerHTML = `
        <h3>Đòn tấn công ${i + 1}</h3>
        <div class="form-group">
          <label>Sát thương:</label>
          <input type="number" id="attackValue${i}" value="${attack.value || 0}">
        </div>
        <div class="form-group">
          <label>Hệ sát thương:</label>
          <select id="damageType${i}">
            <option value="None">None</option>
            <option value="Kinetic">Kinetic</option>
            <option value="Pressure">Pressure</option>
            <option value="Force">Force</option>
          </select>
        </div>
        <div class="form-group">
          <label>Hiệu ứng sát thương:</label>
          <label><input type="checkbox" id="trueDamage${i}"> True Damage</label>
          <label><input type="checkbox" id="pierceDamage${i}"> Pierce Damage</label>
        </div>
        <div class="form-group">
          <label>Phòng thủ:</label>
          <button onclick="addDefense(${i})">Thêm % hoặc Cố định</button>
          <div id="defenseFields${i}"></div>
        </div>
        <div class="form-group">
          <label>Hệ kháng:</label>
          <input type="number" id="resistance${i}" step="0.1" value="1">
        </div>
        <div class="form-group">
          <label>Anti True Damage:</label>
          <input type="checkbox" id="antiTrue${i}">
        </div>
        <div class="form-group">
          <label>Anti Pierce Damage:</label>
          <input type="checkbox" id="antiPierce${i}">
        </div>
        <div id="damageResult${i}" class="result"></div>
      `;
      this.container.appendChild(group);
    }
    this.triggerCalculation();
  }

  triggerCalculation() {
    const controller = window.damageController;
    if (controller) controller.calculateDamage();
  }

  updateDamageResult(index, result) {
    const div = document.getElementById(`damageResult${index}`);
    div.innerHTML = `<p>${result.message}</p>`;
    div.style.display = "block";
  }
}

// ===============================
// Local Storage
// ===============================
class LocalStorage {
  save(data) {
    localStorage.setItem("damageData", JSON.stringify(data));
  }

  load() {
    const raw = localStorage.getItem("damageData");
    return raw ? JSON.parse(raw) : { attackCount: 1, attacks: [], defenses: {} };
  }

  clear() {
    localStorage.removeItem("damageData");
  }
}

// ===============================
// Damage Controller
// ===============================
class DamageController {
  constructor(storage, uiManager) {
    this.storage = storage;
    this.uiManager = uiManager;
    this.attackCount = 1;
    this.loadData();
    this.setupEventListeners();
    this.calculateDamage();
  }

  loadData() {
    const data = this.storage.load();
    this.attackCount = data.attackCount || 1;
    this.uiManager.renderAttackInputs(this.attackCount, data.attacks);
  }

  saveData() {
    const data = { attackCount: this.attackCount, attacks: [], defenses: {} };
    for (let i = 0; i < this.attackCount; i++) {
      const effect = [];
      if (document.getElementById(`trueDamage${i}`).checked) effect.push("True Damage");
      if (document.getElementById(`pierceDamage${i}`).checked) effect.push("Pierce Damage");
      data.attacks.push({
        value: document.getElementById(`attackValue${i}`).value || 0,
        damageType: document.getElementById(`damageType${i}`).value || "None",
        effect,
        defense: {
          antiTrue: document.getElementById(`antiTrue${i}`).checked || false,
          antiPierce: document.getElementById(`antiPierce${i}`).checked || false
        }
      });
    }
    this.storage.save(data);
  }

  calculateDamage() {
    const calculator = new DamageCalculator(0, this.attackCount, [], []);
    const results = calculator.calculateDamage();
    results.forEach((res, i) => this.uiManager.updateDamageResult(i, res));
    this.saveData();
  }

  addAttack() {
    this.attackCount++;
    this.uiManager.renderAttackInputs(this.attackCount, this.storage.load().attacks || []);
  }

  clearData() {
    this.storage.clear();
    this.attackCount = 1;
    this.uiManager.renderAttackInputs(this.attackCount, []);
  }

  setupEventListeners() {
    this.uiManager.addAttackBtn.addEventListener("click", () => this.addAttack());
    this.uiManager.clearBtn.addEventListener("click", () => this.clearData());
    this.uiManager.container.addEventListener("input", () => this.calculateDamage());
    this.uiManager.container.addEventListener("change", () => this.calculateDamage());
  }
}

// ===============================
// Hàm quản lý phòng thủ
// ===============================
function addDefense(index) {
  const defenseFields = document.getElementById(`defenseFields${index}`);
  const count = defenseFields.children.length + 1;
  const group = document.createElement("div");
  group.className = "form-group";
  group.innerHTML = `
    <label>Phòng thủ ${count}:</label>
    <input type="number" id="percentRes${index}_${count}" placeholder="% giảm">
    <input type="number" id="fixedRes${index}_${count}" placeholder="Giảm cố định">
    <button onclick="removeDefense(${index}, ${count})">Xóa</button>
  `;
  defenseFields.appendChild(group);

  const controller = window.damageController;
  if (controller) controller.calculateDamage();
}

function removeDefense(index, count) {
  const defenseFields = document.getElementById(`defenseFields${index}`);
  const fieldToRemove = defenseFields.querySelector(`#percentRes${index}_${count}`).parentElement;
  if (fieldToRemove) {
    defenseFields.removeChild(fieldToRemove);
    const controller = window.damageController;
    if (controller) controller.calculateDamage();
  }
}

// ===============================
// Khởi tạo
// ===============================
window.damageStorage = new LocalStorage();
window.damageUIManager = new DamageUIManager();
window.damageController = new DamageController(window.damageStorage, window.damageUIManager);
