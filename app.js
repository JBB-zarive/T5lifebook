// =======================================
// T5 LifeBook - app.js V2.3.1 Cloud Correctif
// Google Sheets : écriture + restauration
// Correction mapping colonnes + dédoublonnage
// =======================================

const ENGINE_REPLACEMENT_KM = 170060;
const VEHICLE_GOAL_KM = 400000;
const ENGINE_REPLACEMENT_DATE_FR = "19/06/2026";

const DEFAULT_CLOUD_URL = "https://script.google.com/macros/s/AKfycbzbV7LaByU4OrwPxOdujpoAYIwCRGURSy067ljj2Q3egID6NhC-5_lKlf0-00Exn9ttZA/exec";

const MAINTENANCE_TYPES = [
    { name: "Vidange moteur + filtre", interval: 10000 },
    { name: "Vidange DSG", interval: 80000 },
    { name: "Vidange Haldex", interval: 80000 },
    { name: "Filtre gasoil", interval: 30000 },
    { name: "Filtre à air", interval: 30000 },
    { name: "Liquide de frein", interval: null },
    { name: "Freins", interval: null },
    { name: "Pneus", interval: null },
    { name: "Distribution", interval: 180000 },
    { name: "Embrayage / volant moteur", interval: null },
    { name: "Remplacement turbos", interval: null },
    { name: "Train avant / géométrie", interval: null },
    { name: "Autre", interval: null }
];

const INITIAL_KM_HISTORY = [
    {
        id: "km-2026-06-12-170060",
        date: "12/06/2026 00:00:00",
        km: 170060,
        engineKm: 0,
        createdAt: "2026-06-12T00:00:00"
    }
];

const INITIAL_MAINTENANCES = [
    {
        id: "mnt-2026-05-19-vidange",
        type: "Vidange moteur + filtre",
        date: "2026-05-19",
        km: 169528,
        engineKm: 0,
        notes: "Vidange moteur, filtre à huile, filtre à air, filtre à carburant, liquide de frein. Remplacement des silentblocs de barre stabilisatrice, triangle avant gauche, triangle avant droit, deux biellettes de barre stabilisatrice et contrôle de la géométrie.",
        createdAt: "2026-05-19T12:00:00"
    },
    {
        id: "mnt-2026-05-19-filtre-air",
        type: "Filtre à air",
        date: "2026-05-19",
        km: 169528,
        engineKm: 0,
        notes: "Filtre à air remplacé lors de l'entretien complet.",
        createdAt: "2026-05-19T12:00:01"
    },
    {
        id: "mnt-2026-05-19-filtre-gasoil",
        type: "Filtre gasoil",
        date: "2026-05-19",
        km: 169528,
        engineKm: 0,
        notes: "Filtre à carburant remplacé lors de l'entretien complet.",
        createdAt: "2026-05-19T12:00:02"
    },
    {
        id: "mnt-2026-05-19-liquide-frein",
        type: "Liquide de frein",
        date: "2026-05-19",
        km: 169528,
        engineKm: 0,
        notes: "Liquide de frein remplacé.",
        createdAt: "2026-05-19T12:00:03"
    },
    {
        id: "mnt-2026-05-19-train-avant",
        type: "Train avant / géométrie",
        date: "2026-05-19",
        km: 169528,
        engineKm: 0,
        notes: "Silentblocs de barre stabilisatrice, triangle avant gauche, triangle avant droit, deux biellettes de barre stabilisatrice et contrôle de la géométrie.",
        createdAt: "2026-05-19T12:00:04"
    },
    {
        id: "mnt-2025-11-14-turbos",
        type: "Remplacement turbos",
        date: "2025-11-14",
        km: 166800,
        engineKm: 0,
        notes: "Remplacement des turbos, nettoyage échangeur et conduits d'air, vidange, filtre à huile, remplacement couvre-culasse et filtre à air.",
        createdAt: "2025-11-14T12:00:00"
    },
    {
        id: "mnt-2025-11-14-vidange",
        type: "Vidange moteur + filtre",
        date: "2025-11-14",
        km: 166800,
        engineKm: 0,
        notes: "Vidange et filtre à huile réalisés lors du remplacement des turbos.",
        createdAt: "2025-11-14T12:00:01"
    },
    {
        id: "mnt-2025-11-14-filtre-air",
        type: "Filtre à air",
        date: "2025-11-14",
        km: 166800,
        engineKm: 0,
        notes: "Filtre à air remplacé lors du remplacement des turbos.",
        createdAt: "2025-11-14T12:00:02"
    },
    {
        id: "mnt-2018-06-06-dsg",
        type: "Vidange DSG",
        date: "2018-06-06",
        km: 99850,
        engineKm: 0,
        notes: "Remplacement complet de la boîte DSG. Boîte de vitesses remplacée, câble de sélection réglé, boîte déposée/reposée, GFS/fonction guidée et parcours d'essai.",
        createdAt: "2018-06-06T12:00:00"
    },
    {
        id: "mnt-2018-06-06-haldex",
        type: "Vidange Haldex",
        date: "2018-06-06",
        km: 99850,
        engineKm: 0,
        notes: "Supposée réalisée lors du remplacement complet de la boîte DSG. À confirmer si facture détaillée disponible.",
        createdAt: "2018-06-06T12:00:01"
    }
];

document.addEventListener("DOMContentLoaded", async () => {
    initStorageSafely();
    initMaintenanceSelect();
    bindEvents();
    loadCloudConfig();

    if (isLocalDataEmpty()) {
        await autoRestoreFromCloudIfPossible();
    }

    updateDashboard();
});

function initStorageSafely() {
    if (!localStorage.getItem("t5_cloud_url")) {
        localStorage.setItem("t5_cloud_url", DEFAULT_CLOUD_URL);
    }

    if (!localStorage.getItem("t5_vehicle_km")) {
        localStorage.setItem("t5_vehicle_km", String(170060));
    }

    if (!localStorage.getItem("t5_km_history")) {
        localStorage.setItem("t5_km_history", JSON.stringify(INITIAL_KM_HISTORY));
    }

    if (!localStorage.getItem("t5_maintenances")) {
        localStorage.setItem("t5_maintenances", JSON.stringify(INITIAL_MAINTENANCES));
    }
}

function isLocalDataEmpty() {
    const kmHistory = getKmHistory();
    const maintenances = getMaintenances();

    return kmHistory.length === 0 && maintenances.length === 0;
}

function bindEvents() {
    document.getElementById("saveKmBtn").addEventListener("click", saveKilometrage);
    document.getElementById("openMaintenanceBtn").addEventListener("click", openMaintenanceForm);
    document.getElementById("cancelMaintenanceBtn").addEventListener("click", closeMaintenanceForm);
    document.getElementById("saveMaintenanceBtn").addEventListener("click", saveMaintenance);
    document.getElementById("saveCloudBtn").addEventListener("click", saveCloudConfig);
    document.getElementById("testCloudBtn").addEventListener("click", testCloud);
    document.getElementById("syncAllBtn").addEventListener("click", syncAll);
    document.getElementById("restoreCloudBtn").addEventListener("click", restoreFromCloudWithConfirmation);
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

    const now = new Date();
    const dateLabel = now.toLocaleString("fr-FR");
    const engineKm = getEngineKm(newKm);

    localStorage.setItem("t5_vehicle_km", String(newKm));

    const history = getKmHistory();

    const entry = {
        id: makeId(),
        date: dateLabel,
        km: newKm,
        engineKm: engineKm,
        createdAt: now.toISOString()
    };

    history.unshift(entry);

    localStorage.setItem(
        "t5_km_history",
        JSON.stringify(dedupeKilometrages(history))
    );

    syncRow("kilometrages", [
        entry.id,
        entry.date,
        entry.km,
        entry.engineKm,
        "saisie",
        ""
    ]);

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
        id: makeId(),
        type,
        date,
        km,
        engineKm: getEngineKm(km),
        notes,
        createdAt: new Date().toISOString()
    };

    const maintenances = getMaintenances();
    maintenances.unshift(maintenance);

    localStorage.setItem(
        "t5_maintenances",
        JSON.stringify(dedupeMaintenances(maintenances))
    );

    syncRow("entretiens", [
        maintenance.id,
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
        createdAt: item.createdAt || item.date,
        displayDate: item.date,
        km: item.km,
        title: "Mise à jour kilométrage",
        detail: "Km moteur : " + formatKm(item.engineKm)
    }));

    const maintenanceHistory = getMaintenances().map(item => ({
        category: "Entretien",
        dateSort: new Date(item.date + "T00:00:00"),
        createdAt: item.createdAt || item.date,
        displayDate: formatDateFr(item.date),
        km: item.km,
        title: item.type,
        detail: item.notes || "Entretien enregistré"
    }));

    const all = [...kmHistory, ...maintenanceHistory]
        .sort((a, b) => {
            const byDate = b.dateSort - a.dateSort;
            if (byDate !== 0) return byDate;

            const byKm = Number(b.km) - Number(a.km);
            if (byKm !== 0) return byKm;

            return String(b.createdAt).localeCompare(String(a.createdAt));
        });

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
    if (!getCloudUrl()) {
        alert("Merci de renseigner l'URL Google Apps Script.");
        return;
    }

    syncRow("sync_log", [
        new Date().toLocaleString("fr-FR"),
        "test",
        "Test depuis T5 LifeBook",
        "",
        ""
    ]);

    updateCloudStatus("Test envoyé vers Google Sheets.");
}

function syncAll() {
    if (!getCloudUrl()) {
        alert("Merci de renseigner l'URL Google Apps Script.");
        return;
    }

    getKmHistory().forEach(item => {
        syncRow("kilometrages", [
            item.id || makeId(),
            item.date,
            item.km,
            item.engineKm,
            "app",
            ""
        ]);
    });

    getMaintenances().forEach(item => {
        syncRow("entretiens", [
            item.id || makeId(),
            item.date,
            item.km,
            item.engineKm,
            item.type,
            item.notes
        ]);
    });

    syncRow("sync_log", [
        new Date().toLocaleString("fr-FR"),
        "sync_all",
        "Synchronisation complète demandée",
        "",
        ""
    ]);

    updateCloudStatus("Synchronisation envoyée.");
}

async function autoRestoreFromCloudIfPossible() {
    const url = getCloudUrl();
    if (!url) return;

    try {
        updateCloudStatus("Restauration automatique en cours...");
        const cloudData = await fetchCloudData();

        if (cloudData && (cloudData.kilometrages.length || cloudData.entretiens.length)) {
            applyCloudData(cloudData);
            updateCloudStatus("Données restaurées automatiquement depuis Google Sheets.");
        }
    } catch (error) {
        updateCloudStatus("Restauration automatique impossible.");
    }
}

async function restoreFromCloudWithConfirmation() {
    const url = getCloudUrl();

    if (!url) {
        alert("Merci de renseigner l'URL Google Apps Script.");
        return;
    }

    const ok = confirm(
        "Restaurer depuis Google Sheets ?\n\n" +
        "Les données locales actuelles seront remplacées par les données cloud."
    );

    if (!ok) return;

    try {
        updateCloudStatus("Restauration depuis Google Sheets...");
        const cloudData = await fetchCloudData();
        applyCloudData(cloudData);
        updateDashboard();
        updateCloudStatus("Restauration terminée.");
    } catch (error) {
        console.error(error);
        updateCloudStatus("Erreur pendant la restauration.");
        alert("Impossible de restaurer depuis Google Sheets.");
    }
}

async function fetchCloudData() {
    const response = await fetch(getCloudUrl(), {
        method: "GET",
        cache: "no-store"
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error("Réponse Google Sheets invalide.");
    }

    return {
        kilometrages: data.kilometrages || [],
        entretiens: data.entretiens || []
    };
}

function applyCloudData(cloudData) {
    const kmHistory = (cloudData.kilometrages || [])
        .map((row, index) => {
            const id = String(row[0] || "cloud-km-" + index);
            const date = String(row[1] || "");
            const km = parseInt(row[2], 10);
            const engineKm = parseInt(row[3], 10);

            if (isNaN(km) || km <= 0) return null;

            return {
                id,
                date: date || "Date inconnue",
                km,
                engineKm: isNaN(engineKm) ? getEngineKm(km) : engineKm,
                createdAt: parseDateForSort(date).toISOString()
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.km - a.km);

    const maintenances = (cloudData.entretiens || [])
        .map((row, index) => {
            const id = String(row[0] || "cloud-maintenance-" + index);
            const date = normalizeCloudDate(row[1]);
            const km = parseInt(row[2], 10);
            const engineKm = parseInt(row[3], 10);
            const type = String(row[4] || "Autre");
            const notes = String(row[5] || "");

            if (isNaN(km) || km <= 0) return null;

            return {
                id,
                type,
                date,
                km,
                engineKm: isNaN(engineKm) ? getEngineKm(km) : engineKm,
                notes,
                createdAt: date + "T12:00:00"
            };
        })
        .filter(Boolean);

    const cleanKmHistory = dedupeKilometrages(kmHistory);
    const cleanMaintenances = dedupeMaintenances(maintenances);

    const latestKmFromHistory = cleanKmHistory.length
        ? Math.max(...cleanKmHistory.map(item => item.km))
        : 0;

    const latestKmFromMaintenance = cleanMaintenances.length
        ? Math.max(...cleanMaintenances.map(item => item.km))
        : 0;

    const latestKm = Math.max(
        latestKmFromHistory,
        latestKmFromMaintenance,
        170060
    );

    localStorage.setItem("t5_vehicle_km", String(latestKm));
    localStorage.setItem("t5_km_history", JSON.stringify(cleanKmHistory));
    localStorage.setItem("t5_maintenances", JSON.stringify(cleanMaintenances));
}

function dedupeKilometrages(items) {
    const unique = new Map();

    items.forEach(item => {
        const key = `${item.date}|${item.km}`;
        if (!unique.has(key)) {
            unique.set(key, item);
        }
    });

    return Array.from(unique.values());
}

function dedupeMaintenances(items) {
    const unique = new Map();

    items.forEach(item => {
        const key = `${item.date}|${item.km}|${item.type}`;
        if (!unique.has(key)) {
            unique.set(key, item);
        }
    });

    return Array.from(unique.values());
}

function syncRow(table, values) {
    const url = getCloudUrl();
    if (!url) return;

    fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, values })
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

function normalizeCloudDate(value) {
    if (!value) return new Date().toISOString().slice(0, 10);

    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    if (/^\d{2}\/\d{2}\/\d{4}/.test(text)) {
        const parts = text.split(" ")[0].split("/");
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }

    return new Date().toISOString().slice(0, 10);
}

function parseDateForSort(dateString) {
    if (!dateString) return new Date(0);

    const firstPart = String(dateString).split(" ")[0];
    const parts = firstPart.split("/");

    if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    }

    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }

    return new Date(0);
}

function makeId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}
