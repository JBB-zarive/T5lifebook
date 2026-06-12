const ENGINE_REPLACEMENT_KM = 170000;
const VEHICLE_GOAL_KM = 400000;
const ENGINE_GOAL_KM = 300000;

const currentKmInput = document.getElementById("currentKm");
const saveKmBtn = document.getElementById("saveKmBtn");

const vehicleKmElement = document.getElementById("vehicleKm");
const engineKmElement = document.getElementById("engineKm");

const vehicleProgress = document.getElementById("vehicleProgress");
const engineProgress = document.getElementById("engineProgress");

const vehicleProgressText = document.getElementById("vehicleProgressText");
const engineProgressText = document.getElementById("engineProgressText");

const lastUpdateElement = document.getElementById("lastUpdate");
const historyList = document.getElementById("historyList");

document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("t5_vehicle_km")) {
        localStorage.setItem("t5_vehicle_km", "170000");
    }

    if (!localStorage.getItem("t5_history")) {
        localStorage.setItem("t5_history", JSON.stringify([]));
    }

    refreshDashboard();
});

saveKmBtn.addEventListener("click", () => {
    const newKm = parseInt(currentKmInput.value, 10);
    const oldKm = parseInt(localStorage.getItem("t5_vehicle_km"), 10);

    if (isNaN(newKm) || newKm <= 0) {
        alert("Kilométrage invalide.");
        return;
    }

    if (newKm < oldKm) {
        alert("Le kilométrage ne peut pas être inférieur au dernier enregistré.");
        return;
    }

    localStorage.setItem("t5_vehicle_km", String(newKm));

    const history = JSON.parse(localStorage.getItem("t5_history"));
    history.unshift({
        date: new Date().toLocaleString("fr-FR"),
        km: newKm
    });

    localStorage.setItem("t5_history", JSON.stringify(history));

    currentKmInput.value = "";
    refreshDashboard();
});

function refreshDashboard() {
    const vehicleKm = parseInt(localStorage.getItem("t5_vehicle_km"), 10);
    const engineKm = Math.max(0, vehicleKm - ENGINE_REPLACEMENT_KM);

    vehicleKmElement.textContent = formatKm(vehicleKm);
    engineKmElement.textContent = formatKm(engineKm);

    vehicleProgress.style.width = Math.min((vehicleKm / VEHICLE_GOAL_KM) * 100, 100) + "%";
    engineProgress.style.width = Math.min((engineKm / ENGINE_GOAL_KM) * 100, 100) + "%";

    vehicleProgressText.textContent = `${formatKm(vehicleKm)} / ${formatKm(VEHICLE_GOAL_KM)}`;
    engineProgressText.textContent = `${formatKm(engineKm)} / ${formatKm(ENGINE_GOAL_KM)}`;

    updateHistory();
}

function updateHistory() {
    const history = JSON.parse(localStorage.getItem("t5_history"));

    if (!history.length) {
        historyList.innerHTML = "<p>Aucun historique enregistré.</p>";
        lastUpdateElement.textContent = "Dernière mise à jour : jamais";
        return;
    }

    lastUpdateElement.textContent = "Dernière mise à jour : " + history[0].date;

    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <strong>${formatKm(item.km)}</strong><br>
            <small>${item.date}</small>
        </div>
    `).join("");
}

function formatKm(value) {
    return Number(value).toLocaleString("fr-FR") + " km";
}
