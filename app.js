const ENGINE_REPLACEMENT_KM = 170000;
const VEHICLE_GOAL_KM = 400000;
const ENGINE_GOAL_KM = 300000;

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("currentKm");
    const button = document.getElementById("saveKmBtn");

    if (!localStorage.getItem("t5_vehicle_km")) {
        localStorage.setItem("t5_vehicle_km", "170000");
    }

    if (!localStorage.getItem("t5_history")) {
        localStorage.setItem("t5_history", JSON.stringify([]));
    }

    button.addEventListener("click", () => {
        const km = parseInt(input.value, 10);
        const oldKm = parseInt(localStorage.getItem("t5_vehicle_km"), 10);

        if (isNaN(km) || km <= 0) {
            alert("Kilométrage invalide.");
            return;
        }

        if (km < oldKm) {
            alert("Le kilométrage ne peut pas être inférieur au dernier enregistré.");
            return;
        }

        localStorage.setItem("t5_vehicle_km", String(km));

        const history = JSON.parse(localStorage.getItem("t5_history"));
        history.unshift({
            date: new Date().toLocaleString("fr-FR"),
            km: km
        });
        localStorage.setItem("t5_history", JSON.stringify(history));

        input.value = "";
        updateDisplay();
    });

    updateDisplay();
});

function updateDisplay() {
    const vehicleKm = parseInt(localStorage.getItem("t5_vehicle_km"), 10);
    const engineKm = Math.max(0, vehicleKm - ENGINE_REPLACEMENT_KM);

    document.getElementById("vehicleKm").textContent = formatKm(vehicleKm);
    document.getElementById("engineKm").textContent = formatKm(engineKm);

    document.getElementById("vehicleProgress").style.width =
        Math.min((vehicleKm / VEHICLE_GOAL_KM) * 100, 100) + "%";

    document.getElementById("engineProgress").style.width =
        Math.min((engineKm / ENGINE_GOAL_KM) * 100, 100) + "%";

    document.getElementById("vehicleProgressText").textContent =
        `${formatKm(vehicleKm)} / ${formatKm(VEHICLE_GOAL_KM)}`;

    document.getElementById("engineProgressText").textContent =
        `${formatKm(engineKm)} / ${formatKm(ENGINE_GOAL_KM)}`;

    const history = JSON.parse(localStorage.getItem("t5_history"));

    const lastUpdate = document.getElementById("lastUpdate");
    const historyList = document.getElementById("historyList");

    if (history.length === 0) {
        lastUpdate.textContent = "Dernière mise à jour : jamais";
        historyList.innerHTML = "<p>Aucun historique enregistré.</p>";
        return;
    }

    lastUpdate.textContent = "Dernière mise à jour : " + history[0].date;

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
