// =======================================
// T5 LifeBook - app.js V3.0
// Carburant + Modales + Entretiens triés
// =======================================

const ENGINE_REPLACEMENT_KM   = 170060;
const VEHICLE_GOAL_KM          = 400000;
const ENGINE_REPLACEMENT_DATE_FR = "19/06/2026";
const ENGINE_REPLACEMENT_ISO   = "2026-06-19"; // date ISO du moteur neuf

const DEFAULT_CLOUD_URL = "https://script.google.com/macros/s/AKfycbzbV7LaByU4OrwPxOdujpoAYIwCRGURSy067ljj2Q3egID6NhC-5_lKlf0-00Exn9ttZA/exec";

// -------------------------------------------------------------------
// Types d'entretien — 4 groupes :
//   "km"          → intervalle kilométrique (trié par interval croissant)
//   "time"        → intervalle temporel uniquement (liquide de frein 2 ans)
//   "dual"        → double jauge km + temps (distribution 180 000 km / 6 ans)
//   "info"        → pas de jauge, info seulement
// -------------------------------------------------------------------
const MAINTENANCE_TYPES = [
    // Groupe 1 : km, trié interval croissant
    { name: "Vidange moteur + filtre",  group: "km",   interval: 8000,   intervalYears: null },
    { name: "Filtre gasoil",            group: "km",   interval: 30000,  intervalYears: null },
    { name: "Filtre à air",             group: "km",   interval: 30000,  intervalYears: null },
    { name: "Vidange DSG",              group: "km",   interval: 60000,  intervalYears: null },
    { name: "Vidange Haldex",           group: "km",   interval: 60000,  intervalYears: null },
    // Groupe 2 : double jauge (km + années)
    { name: "Distribution",             group: "dual", interval: 180000, intervalYears: 6   },
    // Groupe 3 : temporel uniquement
    { name: "Liquide de frein",         group: "time", interval: null,   intervalYears: 2   },
    // Groupe 4 : info seulement
    { name: "Freins",                   group: "info", interval: null,   intervalYears: null },
    { name: "Pneus",                    group: "info", interval: null,   intervalYears: null },
    { name: "Embrayage / volant moteur",group: "info", interval: null,   intervalYears: null },
    { name: "Remplacement turbos",      group: "info", interval: null,   intervalYears: null },
    { name: "Train avant / géométrie",  group: "info", interval: null,   intervalYears: null },
    { name: "Autre",                    group: "info", interval: null,   intervalYears: null }
];

const INITIAL_KM_HISTORY = [
    { id: "km-2026-06-12-170060", date: "12/06/2026 00:00:00", km: 170060, engineKm: 0, createdAt: "2026-06-12T00:00:00" }
];

const INITIAL_MAINTENANCES = [
    { id: "mnt-2026-05-19-vidange",      type: "Vidange moteur + filtre",  date: "2026-05-19", km: 169528, engineKm: 0, notes: "Vidange moteur, filtre à huile, filtre à air, filtre à carburant, liquide de frein. Remplacement des silentblocs de barre stabilisatrice, triangle avant gauche, triangle avant droit, deux biellettes de barre stabilisatrice et contrôle de la géométrie.", createdAt: "2026-05-19T12:00:00" },
    { id: "mnt-2026-05-19-filtre-air",   type: "Filtre à air",             date: "2026-05-19", km: 169528, engineKm: 0, notes: "Filtre à air remplacé lors de l'entretien complet.", createdAt: "2026-05-19T12:00:01" },
    { id: "mnt-2026-05-19-filtre-gasoil",type: "Filtre gasoil",            date: "2026-05-19", km: 169528, engineKm: 0, notes: "Filtre à carburant remplacé lors de l'entretien complet.", createdAt: "2026-05-19T12:00:02" },
    { id: "mnt-2026-05-19-liquide-frein",type: "Liquide de frein",         date: "2026-05-19", km: 169528, engineKm: 0, notes: "Liquide de frein remplacé.", createdAt: "2026-05-19T12:00:03" },
    { id: "mnt-2026-05-19-train-avant",  type: "Train avant / géométrie",  date: "2026-05-19", km: 169528, engineKm: 0, notes: "Silentblocs de barre stabilisatrice, triangle avant gauche, triangle avant droit, deux biellettes de barre stabilisatrice et contrôle de la géométrie.", createdAt: "2026-05-19T12:00:04" },
    { id: "mnt-2025-11-14-turbos",       type: "Remplacement turbos",      date: "2025-11-14", km: 166800, engineKm: 0, notes: "Remplacement des turbos, nettoyage échangeur et conduits d'air, vidange, filtre à huile, remplacement couvre-culasse et filtre à air.", createdAt: "2025-11-14T12:00:00" },
    { id: "mnt-2025-11-14-vidange",      type: "Vidange moteur + filtre",  date: "2025-11-14", km: 166800, engineKm: 0, notes: "Vidange et filtre à huile réalisés lors du remplacement des turbos.", createdAt: "2025-11-14T12:00:01" },
    { id: "mnt-2025-11-14-filtre-air",   type: "Filtre à air",             date: "2025-11-14", km: 166800, engineKm: 0, notes: "Filtre à air remplacé lors du remplacement des turbos.", createdAt: "2025-11-14T12:00:02" },
    { id: "mnt-2018-06-06-dsg",          type: "Vidange DSG",              date: "2018-06-06", km: 99850,  engineKm: 0, notes: "Remplacement complet de la boîte DSG. Boîte de vitesses remplacée, câble de sélection réglé, boîte déposée/reposée, GFS/fonction guidée et parcours d'essai.", createdAt: "2018-06-06T12:00:00" },
    { id: "mnt-2018-06-06-haldex",       type: "Vidange Haldex",           date: "2018-06-06", km: 99850,  engineKm: 0, notes: "Supposée réalisée lors du remplacement complet de la boîte DSG. À confirmer si facture détaillée disponible.", createdAt: "2018-06-06T12:00:01" }
];

// -------------------------------------------------------------------
// INIT
// -------------------------------------------------------------------
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
    if (!localStorage.getItem("t5_cloud_url"))      localStorage.setItem("t5_cloud_url", DEFAULT_CLOUD_URL);
    if (!localStorage.getItem("t5_vehicle_km"))     localStorage.setItem("t5_vehicle_km", String(170060));
    if (!localStorage.getItem("t5_km_history"))     localStorage.setItem("t5_km_history", JSON.stringify(INITIAL_KM_HISTORY));
    if (!localStorage.getItem("t5_maintenances"))   localStorage.setItem("t5_maintenances", JSON.stringify(INITIAL_MAINTENANCES));
    if (!localStorage.getItem("t5_fuel_history"))   localStorage.setItem("t5_fuel_history", JSON.stringify([]));
}

function isLocalDataEmpty() {
    return getKmHistory().length === 0 && getMaintenances().length === 0;
}

// -------------------------------------------------------------------
// EVENTS
// -------------------------------------------------------------------
function bindEvents() {
    // Km modal
    document.getElementById("openKmModal").addEventListener("click", openKmModal);
    document.getElementById("closeKmModal").addEventListener("click", closeKmModal);
    document.getElementById("cancelKmModal").addEventListener("click", closeKmModal);
    document.getElementById("saveKmBtn").addEventListener("click", saveKilometrage);

    // Fuel modal
    document.getElementById("openFuelModal").addEventListener("click", openFuelModal);
    document.getElementById("closeFuelModal").addEventListener("click", closeFuelModal);
    document.getElementById("cancelFuelModal").addEventListener("click", closeFuelModal);
    document.getElementById("saveFuelBtn").addEventListener("click", saveFuel);

    // Maintenance modal
    document.getElementById("openMaintenanceBtn").addEventListener("click", openMaintenanceModal);
    document.getElementById("openMaintenanceBtnCard").addEventListener("click", openMaintenanceModal);
    document.getElementById("closeMaintenanceModal").addEventListener("click", closeMaintenanceModal);
    document.getElementById("cancelMaintenanceModal").addEventListener("click", closeMaintenanceModal);
    document.getElementById("saveMaintenanceBtn").addEventListener("click", saveMaintenance);

    // Cloud
    document.getElementById("saveCloudBtn").addEventListener("click", saveCloudConfig);
    document.getElementById("testCloudBtn").addEventListener("click", testCloud);
    document.getElementById("syncAllBtn").addEventListener("click", syncAll);
    document.getElementById("restoreCloudBtn").addEventListener("click", restoreFromCloudWithConfirmation);

    // Fermer modal en cliquant sur l'overlay
    document.getElementById("kmModalOverlay").addEventListener("click", e => { if (e.target === e.currentTarget) closeKmModal(); });
    document.getElementById("fuelModalOverlay").addEventListener("click", e => { if (e.target === e.currentTarget) closeFuelModal(); });
    document.getElementById("maintenanceModalOverlay").addEventListener("click", e => { if (e.target === e.currentTarget) closeMaintenanceModal(); });
}

function initMaintenanceSelect() {
    const select = document.getElementById("maintenanceType");
    select.innerHTML = MAINTENANCE_TYPES
        .map(item => `<option value="${item.name}">${item.name}</option>`)
        .join("");
}

// -------------------------------------------------------------------
// MODALES KM
// -------------------------------------------------------------------
function openKmModal() {
    const history = getKmHistory();
    const lastDate = history.length ? history[0].date : "jamais";
    document.getElementById("lastUpdate").textContent = "Dernière mise à jour : " + lastDate;
    document.getElementById("currentKm").value = "";
    document.getElementById("kmModalOverlay").classList.remove("hidden");
}

function closeKmModal() {
    document.getElementById("kmModalOverlay").classList.add("hidden");
}

// -------------------------------------------------------------------
// MODALES CARBURANT
// -------------------------------------------------------------------
function openFuelModal() {
    document.getElementById("fuelDate").value = new Date().toISOString().slice(0, 10);
    document.getElementById("fuelKm").value = getVehicleKm() || "";
    document.getElementById("fuelLiters").value = "";
    document.getElementById("fuelPrice").value = "";
    document.getElementById("fuelModalOverlay").classList.remove("hidden");
}

function closeFuelModal() {
    document.getElementById("fuelModalOverlay").classList.add("hidden");
}

// -------------------------------------------------------------------
// MODALES ENTRETIEN
// -------------------------------------------------------------------
function openMaintenanceModal() {
    document.getElementById("maintenanceKm").value = getVehicleKm();
    document.getElementById("maintenanceDate").value = new Date().toISOString().slice(0, 10);
    document.getElementById("maintenanceNotes").value = "";
    document.getElementById("maintenanceModalOverlay").classList.remove("hidden");
}

function closeMaintenanceModal() {
    document.getElementById("maintenanceModalOverlay").classList.add("hidden");
}

// -------------------------------------------------------------------
// SAUVEGARDES
// -------------------------------------------------------------------
function saveKilometrage() {
    const input  = document.getElementById("currentKm");
    const newKm  = parseInt(input.value, 10);
    const currentKm = getVehicleKm();

    if (isNaN(newKm) || newKm <= 0) { alert("Veuillez saisir un kilométrage valide."); return; }
    if (newKm < currentKm)          { alert("Le kilométrage saisi est inférieur au dernier kilométrage enregistré."); return; }

    const now        = new Date();
    const dateLabel  = now.toLocaleString("fr-FR");
    const engineKm   = getEngineKm(newKm);

    localStorage.setItem("t5_vehicle_km", String(newKm));

    const history = getKmHistory();
    const entry = { id: makeId(), date: dateLabel, km: newKm, engineKm, createdAt: now.toISOString() };
    history.unshift(entry);
    localStorage.setItem("t5_km_history", JSON.stringify(history));

    syncRow("kilometrages", [dateLabel, newKm, engineKm]);

    closeKmModal();
    updateDashboard();
}

function saveFuel() {
    const date   = document.getElementById("fuelDate").value;
    const km     = parseInt(document.getElementById("fuelKm").value, 10);
    const liters = parseFloat(document.getElementById("fuelLiters").value);
    const price  = parseFloat(document.getElementById("fuelPrice").value);

    if (!date || isNaN(km) || km <= 0)      { alert("Veuillez saisir la date et le kilométrage."); return; }
    if (isNaN(liters) || liters <= 0)        { alert("Veuillez saisir le nombre de litres."); return; }
    if (isNaN(price)  || price  <= 0)        { alert("Veuillez saisir le prix total."); return; }

    const currentKm = getVehicleKm();
    const engineKm  = getEngineKm(km);

    // Mise à jour km si le km saisi est supérieur
    if (km > currentKm) {
        localStorage.setItem("t5_vehicle_km", String(km));
        const history   = getKmHistory();
        const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("fr-FR") + " (plein)";
        history.unshift({ id: makeId(), date: dateLabel, km, engineKm, createdAt: date + "T12:00:00" });
        localStorage.setItem("t5_km_history", JSON.stringify(history));
        syncRow("kilometrages", [dateLabel, km, engineKm]);
    }

    const entry = {
        id:        makeId(),
        date,
        km,
        engineKm,
        liters:    Math.round(liters * 100) / 100,
        price:     Math.round(price  * 100) / 100,
        pricePerL: Math.round((price / liters) * 1000) / 1000,
        createdAt: date + "T12:00:00"
    };

    const fuelHistory = getFuelHistory();
    fuelHistory.unshift(entry);
    localStorage.setItem("t5_fuel_history", JSON.stringify(fuelHistory));

    syncRow("carburant", [date, km, liters, price, entry.pricePerL]);

    closeFuelModal();
    updateDashboard();
}

function saveMaintenance() {
    const type  = document.getElementById("maintenanceType").value;
    const date  = document.getElementById("maintenanceDate").value;
    const km    = parseInt(document.getElementById("maintenanceKm").value, 10);
    const notes = document.getElementById("maintenanceNotes").value.trim();

    if (!type || !date || isNaN(km) || km <= 0) { alert("Merci de renseigner le type, la date et le kilométrage."); return; }

    const maintenance = { id: makeId(), type, date, km, engineKm: getEngineKm(km), notes, createdAt: new Date().toISOString() };
    const maintenances = getMaintenances();
    maintenances.unshift(maintenance);
    localStorage.setItem("t5_maintenances", JSON.stringify(maintenances));

    syncRow("entretiens", [maintenance.date, maintenance.km, maintenance.engineKm, maintenance.type, maintenance.notes]);

    closeMaintenanceModal();
    updateDashboard();
}

// -------------------------------------------------------------------
// DASHBOARD
// -------------------------------------------------------------------
function updateDashboard() {
    const vehicleKm = getVehicleKm();
    const engineKm  = getEngineKm(vehicleKm);

    setText("vehicleKm", formatKm(vehicleKm));
    setText("engineKm",  `${formatKm(engineKm)} • remplacé le ${ENGINE_REPLACEMENT_DATE_FR}`);

    updateVehicleGoal(vehicleKm);
    updateMaintenanceList();
    updateFuelHistory();
    updateHistory();
}

function updateVehicleGoal(vehicleKm) {
    const percent = Math.min((vehicleKm / VEHICLE_GOAL_KM) * 100, 100);
    const bar  = document.getElementById("vehicleProgress");
    const text = document.getElementById("vehicleProgressText");
    if (bar)  bar.style.width = percent + "%";
    if (text) text.textContent = `${formatKm(vehicleKm)} / ${formatKm(VEHICLE_GOAL_KM)}`;
}

// -------------------------------------------------------------------
// MAINTENANCE LIST — rendu par groupes
// -------------------------------------------------------------------
function updateMaintenanceList() {
    const container    = document.getElementById("maintenanceList");
    const currentKm    = getVehicleKm();
    const maintenances = getMaintenances();
    const now          = new Date();

    // Groupes dans l'ordre voulu
    const groups = [
        { key: "km",   label: "🔧 Intervalles kilométriques",  types: MAINTENANCE_TYPES.filter(t => t.group === "km").sort((a, b) => a.interval - b.interval) },
        { key: "dual", label: "⚙️ Distribution",               types: MAINTENANCE_TYPES.filter(t => t.group === "dual") },
        { key: "time", label: "📅 Intervalles temporels",       types: MAINTENANCE_TYPES.filter(t => t.group === "time") },
        { key: "info", label: "📋 Autres interventions",        types: MAINTENANCE_TYPES.filter(t => t.group === "info") }
    ];

    let html = "";

    groups.forEach(group => {
        if (!group.types.length) return;
        html += `<div class="maintenance-group-title">${group.label}</div>`;

        group.types.forEach(type => {
            const last   = getLastMaintenanceForType(type.name, maintenances);
            const lastKm = last ? Number(last.km) : null;
            const lastDate = last ? new Date(last.date + "T00:00:00") : null;

            // ---- Groupe KM ----
            if (type.group === "km") {
                const baseKm  = lastKm !== null ? lastKm : ENGINE_REPLACEMENT_KM;
                const kmSince = Math.max(0, currentKm - baseKm);
                const ratio   = Math.min((kmSince / type.interval) * 100, 100);
                const cls     = ratio >= 100 ? "danger" : ratio >= 80 ? "warning" : "ok";
                const hint    = last
                    ? `Dernier : ${formatKm(last.km)} • ${formatDateFr(last.date)}`
                    : "Base : moteur neuf";

                html += `
                <div class="maintenance-item">
                    <div class="maintenance-header">
                        <strong>${type.name}</strong>
                        <span>${formatKm(kmSince)} / ${formatKm(type.interval)}</span>
                    </div>
                    <div class="maintenance-progress">
                        <div class="maintenance-bar ${cls}" style="width:${ratio}%"></div>
                    </div>
                    <small>${hint}</small>
                </div>`;
                return;
            }

            // ---- Groupe DUAL (km + années) ----
            if (type.group === "dual") {
                const baseKm  = lastKm !== null ? lastKm : ENGINE_REPLACEMENT_KM;
                const kmSince = Math.max(0, currentKm - baseKm);
                const ratioKm = Math.min((kmSince / type.interval) * 100, 100);
                const clsKm   = ratioKm >= 100 ? "danger" : ratioKm >= 80 ? "warning" : "ok";

                const baseDate   = lastDate || new Date(ENGINE_REPLACEMENT_ISO + "T00:00:00");
                const monthsSince = (now - baseDate) / (1000 * 60 * 60 * 24 * 30.44);
                const ratioTime  = Math.min((monthsSince / (type.intervalYears * 12)) * 100, 100);
                const clsTime    = ratioTime >= 100 ? "danger" : ratioTime >= 80 ? "warning" : "ok";
                const yearsSince = (monthsSince / 12).toFixed(1);

                const hint = last
                    ? `Dernier : ${formatKm(last.km)} • ${formatDateFr(last.date)}`
                    : "Base : moteur neuf";

                html += `
                <div class="maintenance-item">
                    <div class="maintenance-header">
                        <strong>${type.name}</strong>
                        <span>${formatKm(kmSince)} / ${formatKm(type.interval)}</span>
                    </div>
                    <div class="dual-gauge">
                        <div class="dual-gauge-row">
                            <span class="dual-gauge-label">Km</span>
                            <div class="maintenance-progress">
                                <div class="maintenance-bar ${clsKm}" style="width:${ratioKm}%"></div>
                            </div>
                        </div>
                        <div class="dual-gauge-row">
                            <span class="dual-gauge-label">Ans</span>
                            <div class="maintenance-progress">
                                <div class="maintenance-bar ${clsTime}" style="width:${ratioTime}%"></div>
                            </div>
                        </div>
                    </div>
                    <small>${hint} • ${yearsSince} an${yearsSince >= 2 ? "s" : ""} / ${type.intervalYears} ans</small>
                </div>`;
                return;
            }

            // ---- Groupe TIME (années seulement) ----
            if (type.group === "time") {
                if (last && lastDate) {
                    const monthsSince = (now - lastDate) / (1000 * 60 * 60 * 24 * 30.44);
                    const ratioTime   = Math.min((monthsSince / (type.intervalYears * 12)) * 100, 100);
                    const clsTime     = ratioTime >= 100 ? "danger" : ratioTime >= 80 ? "warning" : "ok";
                    const monthsLeft  = Math.max(0, type.intervalYears * 12 - monthsSince);
                    const mLabel      = monthsLeft < 1 ? "échéance dépassée" : `${Math.round(monthsLeft)} mois restants`;

                    html += `
                    <div class="maintenance-item">
                        <div class="maintenance-header">
                            <strong>${type.name}</strong>
                            <span>${Math.round(monthsSince)} mois / ${type.intervalYears * 12} mois</span>
                        </div>
                        <div class="maintenance-progress">
                            <div class="maintenance-bar ${clsTime}" style="width:${ratioTime}%"></div>
                        </div>
                        <small>Dernier : ${formatDateFr(last.date)} • ${mLabel}</small>
                    </div>`;
                } else {
                    html += `
                    <div class="maintenance-item">
                        <div class="maintenance-header">
                            <strong>${type.name}</strong>
                            <span>Non renseigné</span>
                        </div>
                        <small>Aucune donnée</small>
                    </div>`;
                }
                return;
            }

            // ---- Groupe INFO ----
            const kmSince = lastKm !== null ? Math.max(0, currentKm - lastKm) : null;
            html += `
            <div class="maintenance-item no-interval">
                <div class="maintenance-header">
                    <strong>${type.name}</strong>
                    <span>${kmSince !== null ? formatKm(kmSince) + " depuis intervention" : "Non renseigné"}</span>
                </div>
                <small>${last ? "Dernier : " + formatKm(last.km) + " • " + formatDateFr(last.date) : "Aucune donnée"}</small>
            </div>`;
        });
    });

    container.innerHTML = html;
}

// -------------------------------------------------------------------
// FUEL HISTORY
// -------------------------------------------------------------------
function updateFuelHistory() {
    const fuelHistory = getFuelHistory();
    const container   = document.getElementById("fuelList");
    const statsEl     = document.getElementById("fuelStats");

    if (!fuelHistory.length) {
        container.innerHTML = "<p>Aucun plein enregistré.</p>";
        statsEl.classList.add("hidden");
        return;
    }

    // Stats globales
    const totalL     = fuelHistory.reduce((s, f) => s + f.liters, 0);
    const totalPrice = fuelHistory.reduce((s, f) => s + f.price,  0);
    const avgPriceL  = totalPrice / totalL;

    statsEl.classList.remove("hidden");
    statsEl.innerHTML = `
        <div class="fuel-stat-box">
            <div class="value">${totalL.toFixed(0)} L</div>
            <div class="label">Total consommé</div>
        </div>
        <div class="fuel-stat-box">
            <div class="value">${totalPrice.toFixed(0)} €</div>
            <div class="label">Total dépensé</div>
        </div>
        <div class="fuel-stat-box">
            <div class="value">${avgPriceL.toFixed(3)} €/L</div>
            <div class="label">Prix moyen</div>
        </div>
    `;

    container.innerHTML = fuelHistory.slice(0, 20).map(f => {
        const unitPrice = (f.price / f.liters).toFixed(3);
        return `
        <div class="fuel-item">
            <div class="fuel-item-left">
                <strong>${formatKm(f.km)}</strong>
                <small>${formatDateFr(f.date)}</small>
            </div>
            <div class="fuel-item-right">
                <div class="price">${f.price.toFixed(2)} €</div>
                <small>${f.liters.toFixed(2)} L • ${unitPrice} €/L</small>
            </div>
        </div>`;
    }).join("");
}

// -------------------------------------------------------------------
// HISTORY (km + entretiens + carburant)
// -------------------------------------------------------------------
function updateHistory() {
    const kmHistory = getKmHistory().map(item => ({
        category:    "Kilométrage",
        categoryClass: "",
        dateSort:    parseDateForSort(item.date),
        createdAt:   item.createdAt || item.date,
        displayDate: item.date,
        km:          item.km,
        title:       "Mise à jour kilométrage",
        detail:      "Km moteur : " + formatKm(item.engineKm)
    }));

    const maintenanceHistory = getMaintenances().map(item => ({
        category:    "Entretien",
        categoryClass: "",
        dateSort:    new Date(item.date + "T00:00:00"),
        createdAt:   item.createdAt || item.date,
        displayDate: formatDateFr(item.date),
        km:          item.km,
        title:       item.type,
        detail:      item.notes || "Entretien enregistré"
    }));

    const fuelHistoryItems = getFuelHistory().map(item => ({
        category:    "Carburant",
        categoryClass: "fuel-history",
        dateSort:    new Date(item.date + "T12:00:00"),
        createdAt:   item.createdAt,
        displayDate: formatDateFr(item.date),
        km:          item.km,
        title:       `Plein : ${item.liters.toFixed(2)} L`,
        detail:      `${item.price.toFixed(2)} € • ${(item.price / item.liters).toFixed(3)} €/L`
    }));

    const all = [...kmHistory, ...maintenanceHistory, ...fuelHistoryItems]
        .sort((a, b) => {
            const byDate = b.dateSort - a.dateSort;
            if (byDate !== 0) return byDate;
            const byKm = Number(b.km) - Number(a.km);
            if (byKm !== 0) return byKm;
            return String(b.createdAt).localeCompare(String(a.createdAt));
        });

    const historyList = document.getElementById("historyList");
    if (!all.length) { historyList.innerHTML = "<p>Aucun historique enregistré.</p>"; return; }

    historyList.innerHTML = all.map(item => `
        <div class="history-item ${item.categoryClass}">
            <div class="history-top">
                <strong>${item.category} • ${formatKm(item.km)}</strong>
                <small>${item.displayDate}</small>
            </div>
            <div>${item.title}</div>
            <small>${item.detail}</small>
        </div>
    `).join("");
}

// -------------------------------------------------------------------
// CLOUD — aligné sur Google Apps Script V2 (Code.gs)
// POST : { action:"sync", kilometrages:[...], entretiens:[...], carburant:[...] }
// GET  : { success:true, kilometrages:[{date,km,km_moteur}], entretiens:[{...}], carburant:[{...}] }
// -------------------------------------------------------------------
function saveCloudConfig() {
    const url = document.getElementById("cloudUrl").value.trim();
    localStorage.setItem("t5_cloud_url", url);
    updateCloudStatus(url ? "☁️ Cloud configuré" : "Cloud : non configuré");
}

function loadCloudConfig() {
    const url = localStorage.getItem("t5_cloud_url") || "";
    document.getElementById("cloudUrl").value = url;
    updateCloudStatus(url ? "☁️ Cloud configuré" : "Cloud : non configuré");
}

function testCloud() {
    if (!getCloudUrl()) { alert("Merci de renseigner l'URL Google Apps Script."); return; }
    // Envoie un sync vide juste pour vérifier la connexion
    cloudPost({ action: "sync" });
    updateCloudStatus("⏳ Test envoyé… vérifiez l'onglet sync_log dans Sheets.");
}

async function syncAll() {
    if (!getCloudUrl()) { alert("Merci de renseigner l'URL Google Apps Script."); return; }
    updateCloudStatus("⏳ Synchronisation en cours…");

    // Formate les données en objets nommés attendus par replaceSheet()
    const kilometrages = getKmHistory().map(item => ({
        date:      item.date,
        km:        item.km,
        km_moteur: item.engineKm
    }));

    const entretiens = getMaintenances().map(item => ({
        date:      item.date,
        km:        item.km,
        km_moteur: item.engineKm,
        type:      item.type,
        notes:     item.notes || ""
    }));

    const carburant = getFuelHistory().map(item => ({
        date:        item.date,
        km:          item.km,
        km_moteur:   item.engineKm,
        litres:      item.liters,
        prix_total:  item.price,
        prix_litre:  item.pricePerL
    }));

    try {
        await cloudPost({ action: "sync", kilometrages, entretiens, carburant });
        updateCloudStatus("✅ Synchronisé le " + new Date().toLocaleString("fr-FR"));
    } catch (err) {
        console.error(err);
        updateCloudStatus("❌ Erreur de synchronisation.");
    }
}

// Appelé au démarrage si localStorage vide
async function autoRestoreFromCloudIfPossible() {
    const url = getCloudUrl();
    if (!url) return;
    try {
        updateCloudStatus("⏳ Restauration automatique…");
        const cloudData = await fetchCloudData();
        const hasData = cloudData.kilometrages.length || cloudData.entretiens.length || cloudData.carburant.length;
        if (hasData) {
            applyCloudData(cloudData);
            updateCloudStatus("✅ Données restaurées depuis Google Sheets.");
        } else {
            updateCloudStatus("☁️ Cloud configuré — aucune donnée distante.");
        }
    } catch {
        updateCloudStatus("⚠️ Restauration automatique impossible.");
    }
}

async function restoreFromCloudWithConfirmation() {
    if (!getCloudUrl()) { alert("Merci de renseigner l'URL Google Apps Script."); return; }
    const ok = confirm("Restaurer depuis Google Sheets ?\n\nLes données locales actuelles seront remplacées par les données cloud.");
    if (!ok) return;
    try {
        updateCloudStatus("⏳ Restauration depuis Google Sheets…");
        const cloudData = await fetchCloudData();
        applyCloudData(cloudData);
        updateDashboard();
        updateCloudStatus("✅ Restauration terminée le " + new Date().toLocaleString("fr-FR"));
    } catch (error) {
        console.error(error);
        updateCloudStatus("❌ Erreur pendant la restauration.");
        alert("Impossible de restaurer depuis Google Sheets.\n\nVérifiez l'URL et les permissions du script.");
    }
}

// GET — lit toutes les feuilles
async function fetchCloudData() {
    const response = await fetch(getCloudUrl(), { method: "GET", cache: "no-store" });
    const data = await response.json();
    if (!data.success) throw new Error("Réponse Google Sheets invalide : " + (data.error || "?"));
    return {
        kilometrages:  data.kilometrages  || [],
        entretiens:    data.entretiens    || [],
        carburant:     data.carburant     || []
    };
}

// Applique les données cloud dans localStorage
// Les objets reçus ont des clés nommées (ex: { date, km, km_moteur, type, notes })
function applyCloudData(cloudData) {

    // — Kilométrages —
    const kmHistory = (cloudData.kilometrages || [])
        .map((obj, i) => {
            const km       = parseInt(obj.km, 10);
            const engineKm = parseInt(obj.km_moteur, 10);
            const date     = normalizeCloudDate(obj.date);
            if (!km) return null;
            return {
                id:        "cloud-km-" + i + "-" + km,
                date:      date,
                km,
                engineKm:  isNaN(engineKm) ? getEngineKm(km) : engineKm,
                createdAt: date + "T00:00:00"
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.km - a.km);

    // — Entretiens —
    const maintenances = (cloudData.entretiens || [])
        .map((obj, i) => {
            const km       = parseInt(obj.km, 10);
            const engineKm = parseInt(obj.km_moteur, 10);
            const date     = normalizeCloudDate(obj.date);
            const type     = String(obj.type || "Autre");
            const notes    = String(obj.notes || "");
            if (!km) return null;
            return {
                id:        "cloud-mnt-" + i + "-" + km,
                type,
                date,
                km,
                engineKm:  isNaN(engineKm) ? getEngineKm(km) : engineKm,
                notes,
                createdAt: date + "T12:00:00"
            };
        })
        .filter(Boolean);

    // — Carburant —
    const fuelHistory = (cloudData.carburant || [])
        .map((obj, i) => {
            const km      = parseInt(obj.km, 10);
            const liters  = parseFloat(obj.litres);
            const price   = parseFloat(obj.prix_total);
            const date    = normalizeCloudDate(obj.date);
            if (!km || isNaN(liters) || isNaN(price)) return null;
            return {
                id:        "cloud-fuel-" + i + "-" + km,
                date,
                km,
                engineKm:  getEngineKm(km),
                liters,
                price,
                pricePerL: Math.round((price / liters) * 1000) / 1000,
                createdAt: date + "T12:00:00"
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.km - a.km);

    const latestKm = kmHistory.length ? Math.max(...kmHistory.map(i => i.km)) : 170060;
    localStorage.setItem("t5_vehicle_km",    String(latestKm));
    localStorage.setItem("t5_km_history",    JSON.stringify(kmHistory));
    localStorage.setItem("t5_maintenances",  JSON.stringify(maintenances));
    localStorage.setItem("t5_fuel_history",  JSON.stringify(fuelHistory));
}

// POST vers Google Apps Script (mode no-cors → pas de retour lisible, normal)
function cloudPost(payload) {
    const url = getCloudUrl();
    if (!url) return Promise.reject("Pas d'URL configurée.");
    return fetch(url, {
        method:  "POST",
        mode:    "no-cors",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
    });
}

function updateCloudStatus(message) {
    const el = document.getElementById("cloudStatus");
    if (el) el.textContent = message;
}

// -------------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------------
function getLastMaintenanceForType(type, maintenances) {
    const filtered = maintenances.filter(i => i.type === type).sort((a, b) => Number(b.km) - Number(a.km));
    return filtered[0] || null;
}

function getVehicleKm()   { return parseInt(localStorage.getItem("t5_vehicle_km"), 10); }
function getEngineKm(vKm) { return Math.max(0, Number(vKm) - ENGINE_REPLACEMENT_KM); }
function getKmHistory()   { return JSON.parse(localStorage.getItem("t5_km_history"))   || []; }
function getMaintenances(){ return JSON.parse(localStorage.getItem("t5_maintenances")) || []; }
function getFuelHistory() { return JSON.parse(localStorage.getItem("t5_fuel_history")) || []; }
function getCloudUrl()    { return localStorage.getItem("t5_cloud_url") || ""; }
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function formatKm(value)  { return Number(value).toLocaleString("fr-FR") + " km"; }

function formatDateFr(dateString) {
    if (!dateString) return "";
    if (dateString.includes("/")) return dateString;
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("fr-FR");
}

function normalizeCloudDate(value) {
    if (!value) return new Date().toISOString().slice(0, 10);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const text = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    if (/^\d{2}\/\d{2}\/\d{4}/.test(text)) {
        const parts = text.split(" ")[0].split("/");
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const parsed = new Date(text);
    return !isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function parseDateForSort(dateString) {
    if (!dateString) return new Date(0);
    const firstPart = String(dateString).split(" ")[0];
    const parts     = firstPart.split("/");
    if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    const parsed = new Date(dateString);
    return !isNaN(parsed.getTime()) ? parsed : new Date(0);
}

function makeId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}
