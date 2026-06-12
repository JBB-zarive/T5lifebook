// =======================================
// T5 LifeBook - app.js V2 complète
// =======================================

const ENGINE_REPLACEMENT_KM = 170000;
const VEHICLE_GOAL_KM = 400000;
const ENGINE_REPLACEMENT_DATE_FR = "12/06/2026";

const MAINTENANCE_TYPES = [
    { name: "Vidange moteur + filtre", interval: 8000 },
    { name: "Vidange DSG", interval: 60000 },
    { name: "Vidange Haldex", interval: 60000 },
    { name: "Filtre gasoil", interval: 30000 },
    { name: "Filtre à air", interval: 30000 },
    { name: "Freins", interval: null },
    { name: "Pneus", interval: null },
    { name: "Distribution", interval: 180000 },
    { name: "Embrayage / volant moteur", interval: null },
    { name: "Remplacement turbos", interval: null }
];

document.addEventListener("DOMContentLoaded", () => {
    initStorage();
    initMaintenanceSelect();
    bindEvents();
    loadCloudConfig();
    updateDashboard();
});

function initStorage() {
    if (!localStorage.getItem("t5_vehicle_km")) {
        localStorage.setItem("t5_vehicle_km", String(ENGINE_REPLACEMENT_KM));
    }

    if (!localStorage.getItem("t5_km_history")) {
        localStorage.setItem("t5_km_history", JSON.stringify([]));
    }

    if (!localStorage.getItem("t5_maintenances")) {
        localStorage.setItem("t5_maintenances", JSON.stringify([]));
    }

    if (!localStorage.getItem("t5_cloud_url")) {
        localStorage.setItem("t5_cloud_url", "");
    }
}

function bindEvents() {
    document.getElementById("saveKmBtn").addEventListener("click", saveKilometrage);

    document.getElementById("openMaintenanceBtn").addEventListener("click", openMaintenanceForm);
    document.getElementById("cancelMaintenanceBtn").addEventListener("click", closeMaintenanceForm);
    document.getElementById("saveMaintenanceBtn").addEventListener("click", saveMaintenance);

    document.getElementById("saveCloudBtn").addEventListener("click", saveCloudConfig);
    document.getElementById("testCloudBtn").addEventListener("click", testCloud);
    document.getElementById("syncAllBtn").addEventListener("click", syncAll);
}

function initMaintenanceSelect() {
    const select = document.getElementById("maintenanceType");
    select.innerHTML = MAINTENANCE_TYPES
        .map(item => `<option value="${item.name}">${item.name}</option>`)
        .join("");
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
        alert("Le kilométrage saisi est inférieur au dernier kilométrage enregistré.");
        return;
    }

    const now = new Date().toLocaleString("fr-FR");
    const engineKm = getEngineKm(newKm);

    localStorage.setItem("t5_vehicle_km", String(newKm));

    const history = getKmHistory();
    const entry = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        date: now,
        km: newKm,
        engineKm: engineKm
    };

    history.unshift(entry);
    localStorage.setItem("t5_km_history", JSON.stringify(history));

    syncRow("kilometrages", [now, newKm, engineKm]);

    input.value = "";
    updateDashboard();
}

function updateDashboard() {
    const vehicleKm = getVehicleKm();
    const engineKm = getEngineKm(vehicleKm);

    setText("vehicleKm", formatKm(vehicleKm));
    setText("engineKm", `${formatKm(engineKm)} • remplacé le ${ENGINE_REPLACEMENT_DATE_FR}`);

    updateVehicleGoal(vehicleKm);
    updateMaintenanceList();
    updateHistory();
}

function updateVehicleGoal(vehicleKm) {
    const percent = Math.min((vehicleKm / VEHICLE_GOAL_KM) * 100, 100);

    const bar = document.getElementById("vehicleProgress");
    const text = document.getElementById("vehicleProgressText");

    if (bar) bar.style.width = percent + "%";
    if (text) text.textContent = `${formatKm(vehicleKm)} / ${formatKm(VEHICLE_GOAL_KM)}`;
}

function updateMaintenanceList() {
    const container = document.getElementById("maintenanceList");
    const currentKm = getVehicleKm();
    const maintenances = getMaintenances();

    container.innerHTML = MAINTENANCE_TYPES.map(type => {
        const last = getLastMaintenanceForType(type.name, maintenances);
        const lastKm = last ? Number(last.km) : ENGINE_REPLACEMENT_KM;
        const kmSince = Math.max(0, currentKm - lastKm);

        if (type.interval) {
            const ratio = Math.min((kmSince / type.interval) * 100, 100);
            const statusClass = ratio >= 100 ? "danger" : ratio >= 80 ? "warning" : "ok";

            return `
                <div class="maintenance-item">
                    <div class="maintenance-header">
                        <strong>${type.name}</strong>
                        <span>${formatKm(kmSince)} / ${formatKm(type.interval)}</span>
                    </div>
                    <div class="maintenance-progress">
                        <div class="maintenance-bar ${statusClass}" style="width:${ratio}%"></div>
                    </div>
                    <small>${last ? "Dernier : " + formatKm(last.km) + " • " + formatDateFr(last.date) : "Base : moteur neuf"}</small>
                </div>
            `;
        }

        return `
            <div class="maintenance-item no-interval">
                <div class="maintenance-header">
                    <strong>${type.name}</strong>
                    <span>${last ? formatKm(kmSince) + " depuis intervention" : "Non renseigné"}</span>
                </div>
                <small>${last ? "Dernier : " + formatKm(last.km) + " • " + formatDateFr(last.date) : "Aucune donnée"}</small>
            </div>
        `;
    }).join("");
}

function openMaintenanceForm() {
    document.getElementById("maintenanceFormCard").classList.remove("hidden");
    document.getElementById("maintenanceKm").value = getVehicleKm();
    document.getElementById("maintenanceDate").value = new Date().toISOString().slice(0, 10);
    document.getElementById("maintenanceNotes").value = "";
}

function closeMaintenanceForm() {
    document.getElementById("maintenanceFormCard").classList.add("hidden");
}

function saveMaintenance() {
    const type = document.getElementById("maintenanceType").value;
    const date = document.getElementById("maintenanceDate").value;
    const km = parseInt(document.getElementById("maintenanceKm").value, 10);
    const notes = document.getElementById("maintenanceNotes").value.trim();

    if (!type || !date || isNaN(km) || km <= 0) {
        alert("Merci de renseigner le type, la date et le kilométrage.");
        return;
    }

    const maintenance = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        type,
        date,
        km,
        engineKm: getEngineKm(km),
        notes
    };

    const maintenances = getMaintenances();
    maintenances.unshift(maintenance);
    localStorage.setItem("t5_maintenances", JSON.stringify(maintenances));

    syncRow("entretiens", [
        maintenance.date,
        maintenance.km,
        maintenance.engineKm,
        maintenance.type,
        maintenance.notes
    ]);

    closeMaintenanceForm();
    updateDashboard();
}

function updateHistory() {
    const kmHistory = getKmHistory().map(item => ({
        category: "Kilométrage",
        dateSort: parseDateForSort(item.date),
        displayDate: item.date,
        km: item.km,
        title: "Mise à jour kilométrage",
        detail: "Km moteur : " + formatKm(item.engineKm)
    }));

    const maintenanceHistory = getMaintenances().map(item => ({
        category: "Entretien",
        dateSort: new Date(item.date),
        displayDate: formatDateFr(item.date),
        km: item.km,
        title: item.type,
        detail: item.notes || "Entretien enregistré"
    }));

    const all = [...kmHistory, ...maintenanceHistory]
        .sort((a, b) => b.dateSort - a.dateSort);

    const historyList = document.getElementById("historyList");
    const lastUpdate = document.getElementById("lastUpdate");

    if (!all.length) {
        historyList.innerHTML = "<p>Aucun historique enregistré.</p>";
        lastUpdate.textContent = "Dernière mise à jour : jamais";
        return;
    }

    lastUpdate.textContent = "Dernière mise à jour : " + all[0].displayDate;

    historyList.innerHTML = all.map(item => `
        <div class="history-item">
            <div class="history-top">
                <strong>${item.category} • ${formatKm(item.km)}</strong>
                <small>${item.displayDate}</small>
            </div>
            <div>${item.title}</div>
            <small>${item.detail}</small>
        </div>
    `).join("");
}

function saveCloudConfig() {
    const url = document.getElementById("cloudUrl").value.trim();
    localStorage.setItem("t5_cloud_url", url);
    updateCloudStatus(url ? "Cloud : configuré" : "Cloud : non configuré");
}

function loadCloudConfig() {
    const url = localStorage.getItem("t5_cloud_url") || "";
    document.getElementById("cloudUrl").value = url;
    updateCloudStatus(url ? "Cloud : configuré" : "Cloud : non configuré");
}

function testCloud() {
    const url = getCloudUrl();

    if (!url) {
        alert("Merci de renseigner l'URL Google Apps Script.");
        return;
    }

    syncRow("sync_log", [
        new Date().toLocaleString("fr-FR"),
        "test",
        "Test depuis T5 LifeBook"
    ]);

    updateCloudStatus("Test envoyé vers Google Sheets.");
}

function syncAll() {
    const url = getCloudUrl();

    if (!url) {
        alert("Merci de renseigner l'URL Google Apps Script.");
        return;
    }

    getKmHistory().forEach(item => {
        syncRow("kilometrages", [item.date, item.km, item.engineKm]);
    });

    getMaintenances().forEach(item => {
        syncRow("entretiens", [item.date, item.km, item.engineKm, item.type, item.notes]);
    });

    syncRow("sync_log", [
        new Date().toLocaleString("fr-FR"),
        "sync_all",
        "Synchronisation complète demandée"
    ]);

    updateCloudStatus("Synchronisation envoyée.");
}

function syncRow(table, values) {
    const url = getCloudUrl();
    if (!url) return;

    const payload = { table, values };

    fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).catch(() => {
        updateCloudStatus("Erreur de synchronisation.");
    });
}

function updateCloudStatus(message) {
    const status = document.getElementById("cloudStatus");
    if (status) status.textContent = message;
}

function getLastMaintenanceForType(type, maintenances) {
    const filtered = maintenances
        .filter(item => item.type === type)
        .sort((a, b) => Number(b.km) - Number(a.km));

    return filtered[0] || null;
}

function getVehicleKm() {
    return parseInt(localStorage.getItem("t5_vehicle_km"), 10);
}

function getEngineKm(vehicleKm) {
    return Math.max(0, Number(vehicleKm) - ENGINE_REPLACEMENT_KM);
}

function getKmHistory() {
    return JSON.parse(localStorage.getItem("t5_km_history")) || [];
}

function getMaintenances() {
    return JSON.parse(localStorage.getItem("t5_maintenances")) || [];
}

function getCloudUrl() {
    return localStorage.getItem("t5_cloud_url") || "";
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function formatKm(value) {
    return Number(value).toLocaleString("fr-FR") + " km";
}

function formatDateFr(dateString) {
    if (!dateString) return "";
    if (dateString.includes("/")) return dateString;

    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("fr-FR");
}

function parseDateForSort(dateString) {
    if (!dateString) return new Date(0);

    const parts = dateString.split(" ")[0].split("/");
    if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }

    return new Date(dateString);
}
