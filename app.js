// ================================
// T5 LifeBook - app.js Production V1
// Dashboard kilométrique
// ================================

// Configuration
const ENGINE_REPLACEMENT_KM = 170000;
const VEHICLE_GOAL_KM = 400000;
const ENGINE_GOAL_KM = 300000;

// Éléments HTML
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

// Chargement initial
document.addEventListener("DOMContentLoaded", () => {
    initializeData();
    refreshDashboard();
});

// Initialisation
function initializeData() {
    if (!localStorage.getItem("t5_vehicle_km")) {
        localStorage.setItem("t5_vehicle_km", String(ENGINE_REPLACEMENT_KM));
    }

    if (!localStorage.getItem("t5_history")) {
        const initialHistory = [{
            date: new Date().toLocaleString("fr-FR"),
            km: ENGINE_REPLACEMENT_KM,
            note: "Initialisation T5 LifeBook"
        }];

        localStorage.setItem("t5_history", JSON.stringify(initialHistory));
    }
}

// Enregistrement kilométrage
saveKmBtn.addEventListener("click", saveCurrentKm);

function saveCurrentKm() {
    const newKm = parseInt(currentKmInput.value, 10);
    const currentStoredKm = parseInt(localStorage.getItem("t5_vehicle_km"), 10);

    if (isNaN(newKm) || newKm <= 0) {
        alert("Veuillez saisir un kilométrage valide.");
        return;
    }

    if (newKm < currentStoredKm) {
        alert(
            "Le kilométrage saisi est inférieur au dernier kilométrage enregistré.\n\n" +
            "Dernier kilométrage : " + formatKm(currentStoredKm)
        );
        return;
    }

    if (newKm === currentStoredKm) {
        const confirmSame = confirm(
            "Ce kilométrage est identique au dernier enregistré.\n\n" +
            "Voulez-vous quand même l'enregistrer dans l'historique ?"
        );

        if (!confirmSame) return;
    }

    const history = getHistory();

    history.unshift({
        date: new Date().toLocaleString("fr-FR"),
        km: newKm,
        note: "Mise à jour kilométrage"
    });

    localStorage.setItem("t5_vehicle_km", String(newKm));
    localStorage.setItem("t5_history", JSON.stringify(history));

    currentKmInput.value = "";
    refreshDashboard();
}

// Rafraîchissement général
function refreshDashboard() {
    const vehicleKm = getVehicleKm();
    const engineKm = getEngineKm(vehicleKm);

    vehicleKmElement.innerText = formatKm(vehicleKm);
    engineKmElement.innerText = formatKm(engineKm);

    updateProgressBars(vehicleKm, engineKm);
    updateHistory();
}

// Calcul km moteur
function getEngineKm(vehicleKm) {
    return Math.max(0, vehicleKm - ENGINE_REPLACEMENT_KM);
}

// Progress bars
function mettreAJourLesBarresDeProgression(véhiculeKm, moteurKm) {
    const pourcentageDuVéhicule = Math.min(
        (véhiculeKm / OBJECTIF_VÉHICULE_KM) * 100,
        100
    );

    const moteurPourcentage = Math.min(
        (moteurKm / ENGINE_GOAL_KM) * 100,
        100
    );

    progrèsDuVéhicule.style.width = pourcentageDuVéhicule + "%";
    moteurProgress.style.width = moteurPourcentage + "%";

    texteDeProgressionDuVéhicule.textContent =
        `${formatKm(véhiculeKm)} / ${formatKm(OBJECTIF_VÉHICULE_KM)}`;

    moteurProgressText.textContent =
        `${formatKm(moteurKm)} / ${formatKm(ENGINE_GOAL_KM)}`;
}

// Historique
function updateHistory() {
    const history = getHistory();

    if (!history || history.length === 0) {
        historyList.innerHTML = "<p>Aucun historique enregistré.</p>";
        lastUpdateElement.innerText = "Dernière mise à jour : jamais";
        return;
    }

    historyList.innerHTML = history.map(item => {
        const engineKm = getEngineKm(item.km);

        return `
            <div class="history-item">
                <strong>${formatKm(item.km)}</strong><br>
                <small>${item.date}</small><br>
                <small>Km moteur : ${formatKm(engineKm)}</small>
                ${item.note ? `<br><small>${item.note}</small>` : ""}
            </div>
        `;
    }).join("");

    lastUpdateElement.innerText =
        "Dernière mise à jour : " + history[0].date;
}

// Helpers
function getVehicleKm() {
    return parseInt(localStorage.getItem("t5_vehicle_km"), 10);
}

function getHistory() {
    return JSON.parse(localStorage.getItem("t5_history")) || [];
}

function formatKm(value) {
    return Number(value).toLocaleString("fr-FR") + " km";
}
