document.addEventListener("DOMContentLoaded", () => {
  // Constants for Sekai calendar starting date
  const START_YEAR = 979;
  const START_MONTH = 7;
  const START_DAY = 15;

  // Storage Class (Single Responsibility: Handle data persistence)
  class Storage {
    save(data) {
      localStorage.setItem("profile", JSON.stringify(data));
    }

    load() {
      const raw = localStorage.getItem("profile");
      return raw ? JSON.parse(raw) : null;
    }

    clear() {
      localStorage.removeItem("profile");
    }
  }

  // Validator Class (Single Responsibility: Validate form data)
  class Validator {
    constructor(fields, unusedStatsBox, validationResult, resistanceDifference) {
      this.fields = fields;
      this.unusedStatsBox = unusedStatsBox;
      this.validationResult = validationResult;
      this.resistanceDifference = resistanceDifference;
    }

    msgBox(input, message, type = "warning") {
      let warn = input.parentElement.querySelector(".warning");
      if (!warn) {
        warn = document.createElement("small");
        warn.classList.add("warning");
        input.parentElement.appendChild(warn);
      }
      warn.style.color = type === "error" ? "red" : "orange";
      warn.textContent = message;
    }

    clearMsg(input) {
      const warn = input.parentElement.querySelector(".warning");
      if (warn) warn.remove();
    }

    validate() {
      let valid = true;

      const total = parseInt(this.fields.total.value) || 0;
      const hp = parseInt(this.fields.hp.value) || 0;
      const hpMin = Math.floor(total * 0.2);
      if (hp < hpMin) { this.msgBox(this.fields.hp, `HP ≥ ${hpMin}`, "error"); valid = false; }
      else this.clearMsg(this.fields.hp);

      const spd = parseInt(this.fields.spd.value) || 0;
      const spdMin = Math.floor(total * 0.1);
      const spdMax = Math.floor(total * 0.6);
      if (spd < spdMin || spd > spdMax) { this.msgBox(this.fields.spd, `SPD ${spdMin}-${spdMax}`, "error"); valid = false; }
      else this.clearMsg(this.fields.spd);

      const ref = parseInt(this.fields.ref.value) || 0;
      const refMin = Math.floor(total * 0.1);
      if (ref < refMin) { this.msgBox(this.fields.ref, `REF ≥ ${refMin}`, "error"); valid = false; }
      else this.clearMsg(this.fields.ref);

      let used = hp + spd + ref +
        (parseInt(this.fields.pow.value) || 0) +
        (parseInt(this.fields.def.value) || 0) +
        (parseInt(this.fields.grd.value) || 0) +
        (parseInt(this.fields.vit.value) || 0) +
        (parseInt(this.fields.inf.value) || 0);
      let unused = total - used;

      if (unused < 0) { this.unusedStatsBox.textContent = `Còn lại: ${unused} (Âm!)`; this.unusedStatsBox.style.color = "red"; valid = false; }
      else if (unused > 0) { this.unusedStatsBox.textContent = `Còn lại: ${unused}`; this.unusedStatsBox.style.color = "orange"; valid = false; }
      else { this.unusedStatsBox.textContent = "Đã dùng hết chỉ số."; this.unusedStatsBox.style.color = "lightgreen"; }

      const k = parseFloat(this.fields.kinetic.value) || 0;
      const p = parseFloat(this.fields.pressure.value) || 0;
      const f = parseFloat(this.fields.force.value) || 0;
      const totalResistance = (k + p + f).toFixed(2);
      if (totalResistance > "3.00") {
        this.msgBox(this.fields.force, "Cảnh báo: Tổng kháng > 3", "warning");
        this.resistanceDifference.textContent = `Tổng: ${totalResistance} điểm`;
        this.resistanceDifference.style.color = "orange";
      } else if (totalResistance < "3.00") {
        this.msgBox(this.fields.force, "Không hợp lệ: Tổng kháng < 3", "error");
        this.resistanceDifference.textContent = `Tổng: ${totalResistance} điểm`;
        this.resistanceDifference.style.color = "red";
        valid = false;
      } else {
        this.clearMsg(this.fields.force);
        this.resistanceDifference.textContent = `Tổng: ${totalResistance} điểm`;
        this.resistanceDifference.style.color = "lightgreen";
      }

      const year = parseInt(this.fields.year.value) || 0;
      const month = parseInt(this.fields.month.value) || 0;
      const day = parseInt(this.fields.day.value) || 0;
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) daysInMonth[1] = 29;
      const maxDays = daysInMonth[month - 1] || 0;

      if (day > maxDays || day < 1) {
        this.msgBox(this.fields.day, `Ngày không hợp lệ, tháng ${month} chỉ có ${maxDays} ngày`, "error");
        valid = false;
      } else {
        this.clearMsg(this.fields.day);
      }
      if (year > 979 || (year === 979 && (month > 7 || (month === 7 && day >= 15)))) {
        this.msgBox(this.fields.year, "Ngày sinh phải trước 15/7/979", "error");
        valid = false;
      } else {
        this.clearMsg(this.fields.year);
      }

      this.validationResult.textContent = valid ? "✔️ Thông tin hợp lệ" : "❌ Thông tin không hợp lệ";
      this.validationResult.style.color = valid ? "lightgreen" : "red";

      return valid;
    }
  }

  // Resistance Explanation Class (Single Responsibility: Handle resistance explanations)
  class ResistanceExplainer {
    constructor(fields) {
      this.fields = fields;
      this.explanationElements = {
        kinetic: document.getElementById("kinetic-explanation"),
        pressure: document.getElementById("pressure-explanation"),
        force: document.getElementById("force-explanation")
      };
    }

    getExplanation(type, value) {
      const x = parseFloat(value) || 0;
      if (x === 1) return "Không thay đổi";
      if (x > 1) return `Sát thương nhận từ ${type} tăng ${Math.round(x * 100) / 100} lần`;
      if (x > 0 && x < 1) return `Giảm ${Math.round((1 - x) * 10000) / 100}% sát thương nhận từ ${type}`;
      if (x === 0) return `Miễn nhiễm sát thương từ ${type}`;
      if (x < 0) return `Hấp thụ sát thương từ ${type} thành HP, tỉ lệ: 1 Dmg thành ${Math.round(Math.abs(x) * 100) / 100} HP`;
      return "Giá trị không hợp lệ";
    }

    update() {
      this.explanationElements.kinetic.textContent = this.getExplanation("Kinetic", this.fields.kinetic.value);
      this.explanationElements.pressure.textContent = this.getExplanation("Pressure", this.fields.pressure.value);
      this.explanationElements.force.textContent = this.getExplanation("Force", this.fields.force.value);
    }
  }

  // Summary Generator Class (Single Responsibility: Generate summary HTML)
  class SummaryGenerator {
    constructor(fields, summaryBox) {
      this.fields = fields;
      this.summaryBox = summaryBox;
    }

    calculateAge(year, month, day) {
      let age = START_YEAR - year;
      if ((month > START_MONTH) || (month === START_MONTH && day > START_DAY)) {
        age -= 1;
      }
      return age >= 0 ? age : 0;
    }
    
    getSelectText(selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        return selectedOption ? selectedOption.text : "(chưa nhập)";
    }

    getExplanation(type, value) {
      const x = parseFloat(value) || 0;
      if (x === 1) return "Không thay đổi";
      if (x > 1) return `Sát thương nhận từ ${type} tăng ${Math.round(x * 100) / 100} lần`;
      if (x > 0 && x < 1) return `Giảm ${Math.round((1 - x) * 10000) / 100}% sát thương nhận từ ${type}`;
      if (x === 0) return `Miễn nhiễm sát thương từ ${type}`;
      if (x < 0) return `Hấp thụ sát thương từ ${type} thành HP, tỉ lệ: 1 Dmg thành ${Math.round(Math.abs(x) * 100) / 100} HP`;
      return "Giá trị không hợp lệ";
    }

    getExplanationColor(value) {
      const x = parseFloat(value) || 0;
      if (x < 0) return "lightgreen";
      if (x === 0) return "lightgreen";
      if (x > 0 && x < 1) return "#4a90e2";
      if (x === 1) return "#e0e0e0";
      if (x > 1) return "#ff9900";
      return "#e0e0e0";
    }

    getSummaryData() {
        const total = parseInt(this.fields.total.value) || 0;
        const hp = parseInt(this.fields.hp.value) || 0;
        const spd = parseInt(this.fields.spd.value) || 0;
        const ref = parseInt(this.fields.ref.value) || 0;
        const pow = parseInt(this.fields.pow.value) || 0;
        const def = parseInt(this.fields.def.value) || 0;
        const grd = parseInt(this.fields.grd.value) || 0;
        const vit = parseInt(this.fields.vit.value) || 0;
        const inf = parseInt(this.fields.inf.value) || 0;

        const hpReal = hp * 8;
        const hpTurn = hp * 2;
        const skillRange = Math.round(total * 0.5 * 10) / 10;
        const carryWeight = (pow + 2) * 5;
        const moveSpeed = spd * 1;
        const reactSpeed = ref * 2;

        const day = this.fields.day.value || "(chưa nhập)";
        const month = this.fields.month.value || "(chưa nhập)";
        const year = this.fields.year.value || "(chưa nhập)";
        const age = (year !== "(chưa nhập)" && month !== "(chưa nhập)" && day !== "(chưa nhập)") 
          ? this.calculateAge(parseInt(year), parseInt(month), parseInt(day)) 
          : "(chưa nhập)";

        const kinetic = parseFloat(this.fields.kinetic.value) || 1;
        const pressure = parseFloat(this.fields.pressure.value) || 1;
        const force = parseFloat(this.fields.force.value) || 1;

        const genderDisplay = this.getSelectText(this.fields.gender);
        const raceDisplay = this.getSelectText(this.fields.race);
        const classDisplay = this.getSelectText(this.fields.class);

        return {
          total, hp, spd, ref, pow, def, grd, vit, inf,
          hpReal, hpTurn, skillRange, carryWeight, moveSpeed, reactSpeed,
          day, month, year, age,
          kinetic, pressure, force,
          kineticExplanation: this.getExplanation("Kinetic", kinetic),
          pressureExplanation: this.getExplanation("Pressure", pressure),
          forceExplanation: this.getExplanation("Force", force),
          kineticColor: this.getExplanationColor(kinetic),
          pressureColor: this.getExplanationColor(pressure),
          forceColor: this.getExplanationColor(force),
          genderDisplay, raceDisplay, classDisplay
        };
    }

    update() {
      const data = this.getSummaryData();
      let html = `<h3>Thông tin cơ bản</h3>
        <p>Tên: ${this.fields.name.value || "(chưa nhập)"}</p>
        <p>Ngày sinh: ${data.day}/${data.month}/${data.year} (Tuổi: ${data.age})</p>
        <p>Giới tính: ${data.genderDisplay}</p>
        <p>Chủng tộc: ${data.raceDisplay}</p>
        <p>Class: ${data.classDisplay}</p>
        <p>Tiểu sử: ${this.fields.bio.value || "(chưa nhập)"}</p>
        <hr>
        <h3>Thông tin chỉ số</h3>
        <p>Tổng stat: ${data.total}</p>
        <p>HP thực: ${data.hpReal}</p>
        <p>SPD: ${data.spd}</p>
        <p>REF: ${data.ref}</p>`;

      if (data.pow > 0) html += `<p>POW: ${data.pow}</p>`;
      if (data.def > 0) html += `<p>DEF: ${data.def}</p>`;
      if (data.grd > 0) html += `<p>GRD: ${data.grd}</p>`;
      if (data.vit > 0) html += `<p>VIT: ${data.vit}</p>`;
      if (data.inf > 0) html += `<p>INF: ${data.inf}</p>`;

      html += `<hr>
        <h3>Thông tin thêm</h3>
        <p>Phạm vi kỹ năng và tấn công tối đa: <span style="color:#4a90e2">${data.skillRange} m</span></p>
        <p>Giới hạn hồi HP tối đa mỗi turn: <span style="color:#4a90e2">${data.hpTurn} HP/ turn</span></p>
        <p>Giới hạn mang vác vật nặng: <span style="color:#4a90e2">${data.carryWeight} kg</span></p>
        <p>Tốc độ di chuyển tối đa: <span style="color:#4a90e2">${data.moveSpeed} m/s</span></p>
        <p>Tốc độ phản xạ: <span style="color:#4a90e2">${data.reactSpeed} m/s (${data.reactSpeed} SPD)</span></p>`;

      // Add new DEF and GRD based info
      if (data.def > 0) {
        html += `<p>Năng lượng chống lại lực kéo đẩy tối đa tương đương: <span style="color:#4a90e2">${data.def * 5} kg hoặc ${data.def} POW</span></p>`;
      }
      if (data.grd > 0) {
        html += `<p>Khiên có thể chống lại lực đẩy tối đa tương đương: <span style="color:#4a90e2">${data.grd * 5} kg hoặc ${data.grd} POW</span></p>`;
      }

      html += `<hr>
        <h3>Hệ số kháng</h3>
        <p>Kinetic: ${data.kinetic.toFixed(2)} - <span style="color: ${data.kineticColor}">${data.kineticExplanation}</span></p>
        <p>Pressure: ${data.pressure.toFixed(2)} - <span style="color: ${data.pressureColor}">${data.pressureExplanation}</span></p>
        <p>Force: ${data.force.toFixed(2)} - <span style="color: ${data.forceColor}">${data.forceExplanation}</span></p>`;

      this.summaryBox.innerHTML = html;
    }

    generateSummaryText() {
        const data = this.getSummaryData();
        let text = `Thông tin cơ bản
Tên: ${this.fields.name.value || "(chưa nhập)"}
Ngày sinh: ${data.day}/${data.month}/${data.year} (Tuổi: ${data.age})
Giới tính: ${data.genderDisplay}
Chủng tộc: ${data.raceDisplay}
Class: ${data.classDisplay}
Tiểu sử: ${this.fields.bio.value || "(chưa nhập)"}

Thông tin chỉ số
Tổng stat: ${data.total}
HP thực: ${data.hpReal}
SPD: ${data.spd}
REF: ${data.ref}`;

      if (data.pow > 0) text += `\nPOW: ${data.pow}`;
      if (data.def > 0) text += `\nDEF: ${data.def}`;
      if (data.grd > 0) text += `\nGRD: ${data.grd}`;
      if (data.vit > 0) text += `\nVIT: ${data.vit}`;
      if (data.inf > 0) text += `\nINF: ${data.inf}`;

      text += `\n
Thông tin thêm
Phạm vi kỹ năng và tấn công tối đa: ${data.skillRange} m
Giới hạn hồi HP tối đa mỗi turn: ${data.hpTurn} HP/ turn
Giới hạn mang vác vật nặng: ${data.carryWeight} kg
Tốc độ di chuyển tối đa: ${data.moveSpeed} m/s
Tốc độ phản xạ: ${data.reactSpeed} m/s (${data.reactSpeed} SPD)`;

      // Add new DEF and GRD based text
      if (data.def > 0) {
        text += `\nNăng lượng chống lại lực kéo đẩy: ${data.def * 5} kg`;
      }
      if (data.grd > 0) {
        text += `\nNăng lượng chống lại lực đẩy: ${data.grd * 5} kg`;
      }

      text += `\n
Hệ số kháng
Kinetic: ${data.kinetic.toFixed(2)} - ${data.kineticExplanation}
Pressure: ${data.pressure.toFixed(2)} - ${data.pressureExplanation}
Force: ${data.force.toFixed(2)} - ${data.forceExplanation}`;
        
        return text;
    }
  }

  // Form Handler Class (Coordinates other classes, Dependency Inversion via injections)
  class FormHandler {
    constructor(fields, storage, validator, summaryGenerator, resistanceExplainer) {
      this.fields = fields;
      this.storage = storage;
      this.validator = validator;
      this.summaryGenerator = summaryGenerator;
      this.resistanceExplainer = resistanceExplainer;
      this.historyStack = [];
      this.summaryBox = document.getElementById("summary");
      this.copyBtn = document.getElementById("copyBtn");
      this.resetBtn = document.getElementById("resetBtn");
      this.undoBtn = document.getElementById("undoBtn");
      this.saveBtn = document.getElementById("saveBtn");
      this.backToHomeBtn = document.getElementById("backToHomeBtn");
      this.buildProfileBtn = document.getElementById("buildProfileBtn");

      // New properties for help text elements
      this.hpHelpText = document.getElementById("hp-help");
      this.spdHelpText = document.getElementById("spd-help");
      this.refHelpText = document.getElementById("ref-help");
    }

    getFormData() {
      const data = {};
      for (let key in this.fields) data[key] = this.fields[key].value;
      return data;
    }

    setFormData(data) {
      for (let key in data) if (this.fields[key]) this.fields[key].value = data[key];
    }

    autoSave() {
      this.storage.save(this.getFormData());
    }

    loadProfile() {
      const data = this.storage.load();
      if (data) this.setFormData(data);
    }

    copySummary() {
      const summaryText = this.summaryGenerator.generateSummaryText();
      navigator.clipboard.writeText(summaryText);
      alert("Đã copy thông tin!");
    }

    resetProfile() {
      this.historyStack.push(this.getFormData());
      for (let key in this.fields) this.fields[key].value = "";
      this.storage.clear();
      this.summaryGenerator.update();
      this.validator.validate();
      this.resistanceExplainer.update();
      this.updateStatHelpTexts();
    }

    undo() {
      if (this.historyStack.length === 0) return;
      this.setFormData(this.historyStack.pop());
      this.summaryGenerator.update();
      this.validator.validate();
      this.resistanceExplainer.update();
      this.updateStatHelpTexts();
    }

    manualSave() {
      this.autoSave();
      alert("Đã lưu thông tin!");
    }

    backToHome() {
      window.location.href = "../Home.html";
    }

    buildProfile() {
      // Random profile generation with strict validation
      const names = ["Kael", "Liora", "Zephyr", "Sylvara", "Darius"];
      const genders = ["male", "female"];
      const races = ["human", "spirit", "angel"];
      const classes = ["attacker", "tanker", "healer", "supporter", "scouter"];
      const bio = "A brave adventurer seeking glory in the land of Sekai.";

      this.fields.name.value = names[Math.floor(Math.random() * names.length)];
      this.fields.gender.value = genders[Math.floor(Math.random() * genders.length)];
      this.fields.race.value = races[Math.floor(Math.random() * races.length)];
      this.fields.bio.value = bio;
      this.fields.class.value = classes[Math.floor(Math.random() * classes.length)];

      // Random valid birth date before 15/7/979
      const year = Math.floor(Math.random() * 979);
      const month = Math.floor(Math.random() * 12) + 1;
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) daysInMonth[1] = 29;
      const day = Math.floor(Math.random() * daysInMonth[month - 1]) + 1;
      this.fields.year.value = year;
      this.fields.month.value = month;
      this.fields.day.value = day;

      // Random total stat (100-400)
      let total = Math.floor(Math.random() * 301) + 100;
      this.fields.total.value = total;

      // Distribute stats to use exactly total (no unused stats)
      const hpMin = Math.floor(total * 0.2);
      const hpMax = Math.floor(total * 0.4); // Limit to avoid exceeding total
      const hp = Math.floor(hpMin + Math.random() * (hpMax - hpMin));
      const spdMin = Math.floor(total * 0.1);
      const spdMax = Math.floor(total * 0.3); // Adjusted to leave room
      const spd = Math.floor(spdMin + Math.random() * (spdMax - spdMin));
      const refMin = Math.floor(total * 0.1);
      const refMax = Math.floor(total * 0.2); // Adjusted to balance
      const ref = Math.floor(refMin + Math.random() * (refMax - refMin));
      const remaining = total - (hp + spd + ref);
      const pow = Math.floor(remaining * Math.random());
      const def = remaining - pow; // Use all remaining stats

      this.fields.hp.value = hp;
      this.fields.spd.value = spd;
      this.fields.ref.value = ref;
      this.fields.pow.value = pow;
      this.fields.def.value = def;
      this.fields.grd.value = 0;
      this.fields.vit.value = 0;
      this.fields.inf.value = 0;

      // Set resistances to sum to exactly 3
      const kinetic = Math.round((Math.random() * 1.0) * 100) / 100; // Max 1.0 to ensure sum <= 3
      const pressure = Math.round((Math.random() * (1.0)) * 100) / 100; // Max 1.0
      const force = Math.round((3.0 - kinetic - pressure) * 100) / 100; // Adjust to exactly 3
      this.fields.kinetic.value = kinetic.toFixed(2);
      this.fields.pressure.value = pressure.toFixed(2);
      this.fields.force.value = force.toFixed(2);

      // Validate and adjust if necessary (should not be needed with this logic)
      this.validator.validate();
      this.summaryGenerator.update();
      this.resistanceExplainer.update();
      this.autoSave();
      this.updateStatHelpTexts();
    }

    updateStatHelpTexts() {
      const total = parseInt(this.fields.total.value) || 0;
      const hpMin = Math.floor(total * 0.2);
      const spdMin = Math.floor(total * 0.1);
      const spdMax = Math.floor(total * 0.6);
      const refMin = Math.floor(total * 0.1);

      this.hpHelpText.textContent = `Nhập HP (≥ ${hpMin}).`;
      this.spdHelpText.textContent = `Nhập SPD (${spdMin}-${spdMax}).`;
      this.refHelpText.textContent = `Nhập REF (≥ ${refMin}).`;
    }

    attachEvents() {
      for (let key in this.fields) {
        this.fields[key].addEventListener("input", () => {
          this.validator.validate();
          this.summaryGenerator.update();
          this.resistanceExplainer.update();
          this.autoSave();
        });
      }

      this.fields.total.addEventListener("input", () => {
        this.updateStatHelpTexts();
      });

      this.copyBtn.addEventListener("click", () => this.copySummary());
      this.resetBtn.addEventListener("click", () => this.resetProfile());
      this.undoBtn.addEventListener("click", () => this.undo());
      this.saveBtn.addEventListener("click", () => this.manualSave());
      this.backToHomeBtn.addEventListener("click", () => this.backToHome());
      this.buildProfileBtn.addEventListener("click", () => this.buildProfile());

      document.querySelectorAll(".accordion-header").forEach(header => {
        header.addEventListener("click", () => header.parentElement.classList.toggle("active"));
      });
    }

    init() {
      this.loadProfile();
      this.validator.validate();
      this.summaryGenerator.update();
      this.resistanceExplainer.update();
      this.updateStatHelpTexts(); // Initial call to set values on page load
      this.attachEvents();
    }
  }

  // Initialize fields
  const fields = {
    name: document.getElementById("name"),
    day: document.getElementById("day"),
    month: document.getElementById("month"),
    year: document.getElementById("year"),
    gender: document.getElementById("gender"),
    race: document.getElementById("race"),
    bio: document.getElementById("bio"),
    class: document.getElementById("class"),
    total: document.getElementById("total"),
    hp: document.getElementById("hp"),
    spd: document.getElementById("spd"),
    ref: document.getElementById("ref"),
    pow: document.getElementById("pow"),
    def: document.getElementById("def"),
    grd: document.getElementById("grd"),
    vit: document.getElementById("vit"),
    inf: document.getElementById("inf"),
    kinetic: document.getElementById("kinetic"),
    pressure: document.getElementById("pressure"),
    force: document.getElementById("force")
  };

  const unusedStatsBox = document.getElementById("unusedStats");
  const validationResult = document.getElementById("validationResult");
  const resistanceDifference = document.getElementById("resistance-difference");
  const summaryBox = document.getElementById("summary");

  const storage = new Storage();
  const validator = new Validator(fields, unusedStatsBox, validationResult, resistanceDifference);
  const summaryGenerator = new SummaryGenerator(fields, summaryBox);
  const resistanceExplainer = new ResistanceExplainer(fields);
  const formHandler = new FormHandler(fields, storage, validator, summaryGenerator, resistanceExplainer);

  formHandler.init();
});