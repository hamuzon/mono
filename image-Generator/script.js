const STORAGE_KEY = "gradient_image_generator";

const DEFAULT_STATE = {
    colors: ["#ff0000", "#0000ff"],
    angle: 135,
    singleColor: false,
    randomMode: false,
    width: 1920,
    height: 1080,
    ext: "png",
    quality: 0.92,
    name: "Image",
    tY: true,
    tM: true,
    tD: true,
    tH: true,
    tm: true,
    ts: true,
    tW: true,
    tID: true,
    weekdayLang: "en",
    jsonExport: true
};

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorList = document.getElementById("colorList");

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getState()));
}

function loadState() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_STATE;
}

function getState() {
    return {
        colors: [...colorList.querySelectorAll("input[type=color]")].map(i => i.value),
        angle: angle.value,
        singleColor: singleColor.checked,
        randomMode: randomMode.checked,
        width: width.value,
        height: height.value,
        ext: ext.value,
        quality: quality.value,
        name: nameInput.value,
        tY: tY.checked,
        tM: tM.checked,
        tD: tD.checked,
        tH: tH.checked,
        tm: tm.checked,
        ts: ts.checked,
        tW: tW.checked,
        tID: tID.checked,
        weekdayLang: weekdayLang.value,
        jsonExport: jsonExport.checked
    };
}

function applyState(s) {
    colorList.innerHTML = "";
    s.colors.forEach(c => addColorItem(c));
    angle.value = s.angle;
    singleColor.checked = s.singleColor;
    randomMode.checked = s.randomMode;
    width.value = s.width;
    height.value = s.height;
    ext.value = s.ext;
    quality.value = s.quality;
    nameInput.value = s.name;
    tY.checked = s.tY;
    tM.checked = s.tM;
    tD.checked = s.tD;
    tH.checked = s.tH;
    tm.checked = s.tm;
    ts.checked = s.ts;
    tW.checked = s.tW;
    tID.checked = s.tID;
    weekdayLang.value = s.weekdayLang;
    jsonExport.checked = s.jsonExport;
}

function addColorItem(val = "#ffffff") {
    const d = document.createElement("div");
    d.className = "color-item";
    d.innerHTML = `
        <input type="color" value="${val}">
        <div class="move">
            <button class="up">▲</button>
            <button class="down">▼</button>
        </div>`;
    colorList.appendChild(d);
}

colorList.onclick = e => {
    const item = e.target.closest(".color-item");
    if (!item) return;
    if (e.target.classList.contains("up") && item.previousElementSibling) {
        colorList.insertBefore(item, item.previousElementSibling);
    }
    if (e.target.classList.contains("down") && item.nextElementSibling) {
        colorList.insertBefore(item.nextElementSibling, item);
    }
};

function draw() {
    canvas.width = width.value;
    canvas.height = height.value;

    const cols = [...colorList.querySelectorAll("input")].map(i => i.value);

    if (singleColor.checked || cols.length === 1) {
        ctx.fillStyle = cols[0];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    const r = angle.value * Math.PI / 180;
    const g = ctx.createLinearGradient(
        canvas.width / 2 - Math.cos(r) * canvas.width / 2,
        canvas.height / 2 - Math.sin(r) * canvas.height / 2,
        canvas.width / 2 + Math.cos(r) * canvas.width / 2,
        canvas.height / 2 + Math.sin(r) * canvas.height / 2
    );

    cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function filename(preview) {
    const d = new Date();
    const p = n => String(n).padStart(2, "0");
    const a = [];

    if (nameInput.value) a.push(nameInput.value);
    if (tY.checked) a.push(d.getFullYear());
    if (tM.checked) a.push(p(d.getMonth() + 1));
    if (tD.checked) a.push(p(d.getDate()));

    const t = [];
    if (tH.checked) t.push(p(d.getHours()));
    if (tm.checked) t.push(p(d.getMinutes()));
    if (ts.checked) t.push(p(d.getSeconds()));
    if (t.length) a.push(t.join("-"));

    if (tW.checked) {
        const jp = ["日", "月", "火", "水", "木", "金", "土"];
        const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        a.push(weekdayLang.value === "jp" ? jp[d.getDay()] : en[d.getDay()]);
    }

    if (tID.checked) a.push(Math.random().toString(36).slice(2, 6));

    const name = a.join("_").replace(/[_-]+$/g, "");
    if (preview) filenamePreview.textContent = `${name}.${ext.value}`;
    return name;
}

previewBtn.onclick = () => {
    if (randomMode.checked) {
        colorList.innerHTML = "";
        for (let i = 0; i < 3; i += 1) {
            addColorItem(`#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`);
        }
    }
    draw();
    filename(true);
    saveState();
};

saveBtn.onclick = () => {
    draw();
    const base = filename(false);
    const a = document.createElement("a");
    a.href = canvas.toDataURL(`image/${ext.value}`, Number(quality.value));
    a.download = `${base}.${ext.value}`;
    a.click();

    if (jsonExport.checked) {
        const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
        const j = document.createElement("a");
        j.href = URL.createObjectURL(blob);
        j.download = `${base}.json`;
        j.click();
    }
};

exportJson.onclick = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "settings.json";
    a.click();
};

importJson.onclick = () => jsonFile.click();

jsonFile.onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
        applyState(JSON.parse(r.result));
        saveState();
        filename(true);
    };
    r.readAsText(f);
};

saveTemplate.onclick = () => saveState();

resetAll.onclick = () => {
    localStorage.removeItem(STORAGE_KEY);
    applyState(DEFAULT_STATE);
    filename(true);
};

preset.onchange = () => {
    if (!preset.value) return;
    const [w, h] = preset.value.split("x");
    width.value = w;
    height.value = h;
};

const addColorButton = document.getElementById("addColor");
const removeColorButton = document.getElementById("removeColor");

addColorButton.onclick = () => {
    if (colorList.children.length < 10) addColorItem();
};

removeColorButton.onclick = () => {
    if (colorList.children.length > 2) {
        colorList.lastElementChild.remove();
    }
};

applyState(loadState());
filename(true);
