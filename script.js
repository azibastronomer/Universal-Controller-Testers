let controllerIndex = null;
let currentLayout = [];
let deadzone = 0.05;

/* ---------- IMAGE SYSTEM ---------- */
function getControllerImage(name) {
    return `https://source.unsplash.com/400x300/?${encodeURIComponent(name + " game controller")}`;
}

function setControllerImage(finalName, imgEl) {
    const cacheKey = `img-${finalName}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
        imgEl.src = cached;
        return;
    }

    const url = getControllerImage(finalName);
    imgEl.src = url;

    imgEl.onload = () => {
        sessionStorage.setItem(cacheKey, url);
    };

    imgEl.onerror = () => {
        imgEl.src = getControllerImage("game controller");
    };
}

/* ---------- GAMEPAD CONNECT ---------- */
window.addEventListener("gamepadconnected", (e) => {
    controllerIndex = e.gamepad.index;

    document.getElementById("status").style.display = "none";
    document.getElementById("controller-display").classList.remove("hidden");

    detectController(e.gamepad);
    setupUI(e.gamepad);
    updateLoop();
});

/* ---------- GAMEPAD DISCONNECT ---------- */
window.addEventListener("gamepaddisconnected", () => {
    controllerIndex = null;

    document.getElementById("status").style.display = "block";
    document.getElementById("controller-display").classList.add("hidden");
});

/* ---------- DETECTION ---------- */
function detectController(gp) {
    const id = gp.id;
    console.log("RAW:", id);

    // Extract VID / PID
    const vendorMatch = id.match(/vendor:\s*(\w+)/i);
    const productMatch = id.match(/product:\s*(\w+)/i);

    const vid = vendorMatch ? vendorMatch[1].toLowerCase() : "unknown";
    const pid = productMatch ? productMatch[1].toLowerCase() : "unknown";

    // Clean name
    let cleanName = id
        .replace(/\(.*?\)/g, "")
        .replace(/vendor:\s*\w+/gi, "")
        .replace(/product:\s*\w+/gi, "")
        .trim();

    const finalName = cleanName || "Unknown Controller";

    // UI update
    document.getElementById("model-name").innerText =
        `${finalName}\nVID: ${vid} | PID: ${pid}`;

    const imgEl = document.getElementById("controller-img");

    // AUTO IMAGE SYSTEM
    setControllerImage(finalName, imgEl);
}

/* ---------- UI BUTTONS ---------- */
function setupUI(gp) {
    const btnGrid = document.getElementById("buttons-grid");
    btnGrid.innerHTML = "";

    gp.buttons.forEach((_, i) => {
        btnGrid.innerHTML += `<div id="btn-${i}" class="btn-node">B${i}</div>`;
    });
}

/* ---------- UPDATE LOOP ---------- */
function updateLoop() {
    if (controllerIndex === null) return;

    const gp = navigator.getGamepads()[controllerIndex];
    if (!gp) return;

    gp.buttons.forEach((btn, i) => {
        const el = document.getElementById(`btn-${i}`);
        if (!el) return;

        btn.pressed
            ? el.classList.add("active")
            : el.classList.remove("active");
    });

    updateStick("stick-l", gp.axes[0], gp.axes[1]);
    updateStick("stick-r", gp.axes[2], gp.axes[3]);

    requestAnimationFrame(updateLoop);
}

/* ---------- STICK MOVEMENT ---------- */
function updateStick(id, x = 0, y = 0) {
    const dot = document.getElementById(id);
    if (!dot) return;

    const moveX = x * 45;
    const moveY = y * 45;

    dot.style.transform =
        `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;

    dot.style.background =
        (Math.abs(x) > deadzone || Math.abs(y) > deadzone)
            ? "#ff0000"
            : "#ffffff";
}

/* ---------- VIBRATION ---------- */
document.getElementById("vibrate-btn").onclick = () => {
    const gp = navigator.getGamepads()[controllerIndex];

    if (gp?.vibrationActuator) {
        gp.vibrationActuator.playEffect("dual-rumble", {
            duration: 600,
            strongMagnitude: 1.0,
            weakMagnitude: 1.0
        });
    }
};