// =======================================
// T5 LifeBook - app.js V1 stable
// =======================================

const ENGINE_REPLACEMENT_KM = 170000;
const VEHICLE_GOAL_KM = 400000;
const ENGINE_GOAL_KM = 300000;

document.addEventListener("DOMContentLoaded", () => {
    initStorage();
    bindEvents();
    updateDashboard();
});

function initStorage() {
    if (!localStorage.getItem("t5_vehicle_km")) {
        localStorage.setItem("t5_vehicle_km", String(ENGINE_REPLACEMENT_KM));
    }

    if (!localStorage.getItem("t5_history")) {
        localStorage.setItem("t5_history", JSON.stringify([]));
    }
}

function bindEvents() {
    const saveKmBtn = document.getElementById("saveKmBtn");

    saveKmBtn.addEventListener("click", () => {
        saveKilometrage();
    });
}

function saveKilometrage() {
    const input = document.getElementById("currentKm");
    const newKm = parseInt(input.value, 10);
    const currentKm = getVehicleKm();

    if (isNaN(newKm) || newKm <= 0) {
        alert("Veuillez saisir un kilométrage valide.");
        return;
    }

    if (newKm < currentKm) {
        alert(
            "Le kilométrage saisi est inférieur au dernier kilométrage enregistré."
        );
        return;
    }

    localStorage.setItem("t5_vehicle_km", String(newKm));

    const history = getHistory();

    history.unshift({
        date: new Date().toLocaleString("fr-FR"),
        km: newKm
    });

    localStorage.setItem("t5_history", JSON.stringify(history));

    input.value = "";
    updateDashboard();
}

function updateDashboard() {
    const vehicleKm = getVehicleKm();
    const engineKm = Math.max(0, vehicleKm - ENGINE_REPLACEMENT_KM);

    updateText("vehicleKm", formatKm(vehicleKm));
    updateText("engineKm", formatKm(engineKm));

    updateVehicleGoal(vehicleKm);
    updateEngineGoal(engineKm);
    updateHistory();
}

function updateVehicleGoal(vehicleKm) {
    const percent = Math.min((vehicleKm / VEHICLE_GOAL_KM) * 100, 100);

    const bar = document.getElementById("vehicleProgress");
    const text = document.getElementById("vehicleProgressText");

    if (bar) {
        bar.style.width = percent + "%";
    }

    if (text) {
        text.textContent = `${formatKm(vehicleKm)} / ${formatKm(VEHICLE_GOAL_KM)}`;
    }
}

function updateEngineGoal(engineKm) {
    const percent = Math.min((engineKm / ENGINE_GOAL_KM) * 100, 100);

    const bar = document.getElementById("engineProgress");
    const text = document.getElementById("engineProgressText");

    if (bar) {
        bar.style.width = percent + "%";
    }

    if (text) {
        text.textContent = `${formatKm(engineKm)} / ${formatKm(ENGINE_GOAL_KM)}`;
    }
}

function updateHistory() {
    const history = getHistory();
    const historyList = document.getElementById("historyList");
    const lastUpdate = document.getElementById("lastUpdate");

    if (!history.length) {
        if (historyList) {
            historyList.innerHTML = "<p>Aucun historique enregistré.</p>";
        }

        if (lastUpdate) {
            lastUpdate.textContent = "Dernière mise à jour : jamais";
        }

        return;
    }

    if (lastUpdate) {
        lastUpdate.textContent = "Dernière mise à jour : " + history[0].date;
    }

    if (historyList) {
        historyList.innerHTML = history.map(item => {
            const engineKm = Math.max(0, item.km - ENGINE_REPLACEMENT_KM);

            return `
                <div class="history-item">
                    <strong>${formatKm(item.km)}</strong><br>
                    <small>${item.date}</small><br>
                    <small>Km moteur : ${formatKm(engineKm)}</small>
                </div>
            `;
        }).join("");
    }
}

function updateText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function getVehicleKm() {
    return parseInt(localStorage.getItem("t5_vehicle_km"), 10);
}

function getHistory() {
    return JSON.parse(localStorage.getItem("t5_history")) || [];
}

function formatKm(value) {
    return Number(value).toLocaleString("fr-FR") + " km";
}
