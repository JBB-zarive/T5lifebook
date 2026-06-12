// =======================================
// T5 LifeBook - app.js V2 complète
// =======================================

const ENGINE_REPLACEMENT_KM = 170000;
const VEHICLE_GOAL_KM = 400000;
const ENGINE_REPLACEMENT_DATE_FR = "12/06/2026";

const MAINTENANCE_TYPES = [
    { nom : "Vidange moteur + filtre", intervalle : 8000 },
    { nom : "Vidange DSG", intervalle : 60000 },
    { nom : "Vidange Haldex", intervalle : 60000 },
    { nom : "Filtre gasoil", intervalle : 30000 },
    { nom : "Filtre à air", intervalle : 30000 },
    { nom: "Amis", intervalle: null },
    { nom : "Pneus", intervalle : null },
    { nom: "Distribution", intervalle: 180000 },
    { nom : "Embrayage / volant moteur", intervalle : null },
    { nom : "Remplacement turbos", intervalle : null }
];

document.addEventListener("DOMContentLoaded", () => {
    initStorage();
    initMaintenanceSelect();
    lierÉvénements();
    chargerCloudConfig();
    mettre à jour le tableau de bord();
});

fonction initStorage() {
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

fonction bindEvents() {
    document.getElementById("saveKmBtn").addEventListener("click", saveKilometrage);

    document.getElementById("openMaintenanceBtn").addEventListener("click", openMaintenanceForm);
    document.getElementById("cancelMaintenanceBtn").addEventListener("click", closeMaintenanceForm);
    document.getElementById("saveMaintenanceBtn").addEventListener("click", saveMaintenance);

    document.getElementById("saveCloudBtn").addEventListener("click", saveCloudConfig);
    document.getElementById("testCloudBtn").addEventListener("click", testCloud);
    document.getElementById("syncAllBtn").addEventListener("click", syncAll);
}

fonction initMaintenanceSelect() {
    const select = document.getElementById("maintenanceType");
    select.innerHTML = TYPES_DE_MAINTENANCE
        .map(item => `<option value="${item.name}">${item.name}</option>`)
        .rejoindre("");
}

fonction saveKilometrage() {
    const input = document.getElementById("currentKm");
    const newKm = parseInt(input.value, 10);
    const currentKm = getVehicleKm();

    if (isNaN(newKm) || newKm <= 0) {
        alert("Veuillez saisir un kilométrage valide.");
        retour;
    }

    si (nouveauKm < km actuel) {
        alert("Le kilométrage saisi est inférieur au dernier kilométrage enregistré.");
        retour;
    }

    const now = new Date().toLocaleString("fr-FR");
    const engineKm = getEngineKm(newKm);

    localStorage.setItem("t5_vehicle_km", String(newKm));

    const historique = obtenirHistoriqueKm();
    const entrée = {
        id : crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        date: maintenant,
        km : nouveau km,
        moteurKm : moteurKm
    };

    historique.décaler(entrée);
    localStorage.setItem("t5_km_history", JSON.stringify(history));

    syncRow("kilomètres", [maintenant, nouveauKm, moteurKm]);

    valeur de l'entrée = "";
    mettre à jour le tableau de bord();
}

fonction updateDashboard() {
    const vehicleKm = getVehicleKm();
    const engineKm = getEngineKm(vehicleKm);

    setText("véhiculeKm", formatKm(véhiculeKm));
    setText("engineKm", `${formatKm(engineKm)} • remplacé le ${ENGINE_REPLACEMENT_DATE_FR}`);

    mettre à jourVehicleGoal(véhiculeKm);
    mettre à jour la liste de maintenance();
    mettre à jourHistorique();
}

fonction updateVehicleGoal(vehicleKm) {
    const percent = Math.min((vehicleKm / VEHICLE_GOAL_KM) * 100, 100);

    const bar = document.getElementById("vehicleProgress");
    const text = document.getElementById("vehicleProgressText");

    si (barre) bar.style.width = percent + "%";
    si (texte) text.textContent = `${formatKm(vehicleKm)} / ${formatKm(VEHICLE_GOAL_KM)}`;
}

fonction updateMaintenanceList() {
    const container = document.getElementById("maintenanceList");
    const currentKm = getVehicleKm();
    const maintenances = getMaintenances();

    container.innerHTML = MAINTENANCE_TYPES.map(type => {
        const dernier = obtenirDernièreMaintenancePourType(type.name, maintenances);
        const dernierKm = dernier ? Nombre(dernier.km) : KM_REMPLACEMENT_MOTEUR;
        const kmSince = Math.max(0, currentKm - lastKm);

        si (type.interval) {
            const ratio = Math.min((kmSince / type.interval) * 100, 100);
            const statusClass = ratio >= 100 ? "danger" : ratio >= 80 ? "avertissement" : "ok";

            retourner `
                <div class="maintenance-item">
                    <div class="maintenance-header">
                        <strong>${type.name}</strong>
                        <span>${formatKm(kmSince)} / ${formatKm(type.interval)}</span>
                    </div>
                    <div class="maintenance-progress">
                        <div class="maintenance-bar ${statusClass}" style="width:${ratio}%"></div>
                    </div>
                    <small>${dernier ? "Dernier : " + formatKm(last.km) + " • " + formatDateFr(last.date) : "Base : moteur neuf"}</small>
                </div>
            `;
        }

        retourner `
            <div class="maintenance-item no-interval">
                <div class="maintenance-header">
                    <strong>${type.name}</strong>
                    <span>${dernier ? formatKm(kmSince) + " depuis intervention" : "Non renseigné"></span>
                </div>
                <small>${dernier ? "Dernier : " + formatKm(last.km) + " • " + formatDateFr(last.date) : "Aucune donnée"}</small>
            </div>
        `;
    }).rejoindre("");
}

fonction openMaintenanceForm() {
    document.getElementById("maintenanceFormCard").classList.remove("hidden");
    document.getElementById("maintenanceKm").value = getVehicleKm();
    document.getElementById("maintenanceDate").value = new Date().toISOString().slice(0, 10);
    document.getElementById("maintenanceNotes").value = "";
}

fonction closeMaintenanceForm() {
    document.getElementById("maintenanceFormCard").classList.add("hidden");
}

fonction saveMaintenance() {
    const type = document.getElementById("maintenanceType").value;
    const date = document.getElementById("maintenanceDate").value;
    const km = parseInt(document.getElementById("maintenanceKm").value, 10);
    const notes = document.getElementById("maintenanceNotes").value.trim();

    si (!type || !date || isNaN(km) || km <= 0) {
        alert("Merci de renseigner le type, la date et le kilométrage.");
        retour;
    }

    maintenance constante = {
        id : crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        taper,
        date,
        km,
        moteurKm : obtenirMoteurKm(km),
        notes
    };

    const maintenances = getMaintenances();
    maintenances.unshift(maintenance);
    localStorage.setItem("t5_maintenances", JSON.stringify(maintenances));

    syncRow("entretiens", [
        date de maintenance,
        entretien.km,
        entretien.moteurKm,
        maintenance.type,
        notes de maintenance
    ]);

    fermerFormulaireMaintenance();
    mettre à jour le tableau de bord();
}

fonction updateHistory() {
    const kmHistory = getKmHistory().map(item => ({
        catégorie : "Kilométrage",
        dateSort : parseDateForSort(item.date),
        displayDate : item.date,
        km : article.km,
        titre : "Mise à jour kilométrage",
        détail : "Km moteur : " + formatKm(item.engineKm)
    }));

    const maintenanceHistory = getMaintenances().map(item => ({
        catégorie : "Entretien",
        dateSort : nouvelle Date(item.date),
        displayDate : formatDateFr(item.date),
        km : article.km,
        titre : type d'élément,
        détail : item.notes || "Entretien enregistré"
    }));

    const all = [...kmHistory, ...maintenanceHistory]
        .sort((a, b) => b.dateSort - a.dateSort);

    const historyList = document.getElementById("historyList");
    const lastUpdate = document.getElementById("lastUpdate");

    si (!all.length) {
        historyList.innerHTML = "<p>Aucun historique enregistré.</p>";
        lastUpdate.textContent = "Dernière mise à jour : jamais";
        retour;
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

fonction saveCloudConfig() {
    const url = document.getElementById("cloudUrl").value.trim();
    localStorage.setItem("t5_cloud_url", url);
    updateCloudStatus(url ? "Cloud : configuré" : "Cloud : non configuré");
}

fonction loadCloudConfig() {
    const url = localStorage.getItem("t5_cloud_url") || "";
    document.getElementById("cloudUrl").value = url;
    updateCloudStatus(url ? "Cloud : configuré" : "Cloud : non configuré");
}

fonction testCloud() {
    const url = getCloudUrl();

    si (!url) {
        alert("Merci de rechercher l'URL Google Apps Script.");
        retour;
    }

    syncRow("sync_log", [
        nouvelle Date().toLocaleString("fr-FR"),
        "test",
        "Test depuis T5 LifeBook"
    ]);

    updateCloudStatus("Test envoyé vers Google Sheets.");
}

fonction syncAll() {
    const url = getCloudUrl();

    si (!url) {
        alert("Merci de rechercher l'URL Google Apps Script.");
        retour;
    }

    getKmHistory().forEach(item => {
        syncRow("kilomètres", [item.date, item.km, item.engineKm]);
    });

    getMaintenances().forEach(item => {
        syncRow("entretiens", [item.date, item.km, item.engineKm, item.type, item.notes]);
    });

    syncRow("sync_log", [
        nouvelle Date().toLocaleString("fr-FR"),
        "sync_all",
        "Synchronisation complète demandée"
    ]);

    updateCloudStatus("Synchronisation envoyée.");
}

fonction syncRow(table, valeurs) {
    const url = getCloudUrl();
    si (!url) retourner;

    const payload = { table, valeurs };

    récupérer(url, {
        méthode : « POST »,
        mode : "no-cors",
        en-têtes : { "Content-Type": "application/json" },
        corps : JSON.stringify(payload)
    }).catch(() => {
        updateCloudStatus("Erreur de synchronisation.");
    });
}

fonction updateCloudStatus(message) {
    const status = document.getElementById("cloudStatus");
    si (statut) statut.textContent = message ;
}

function getLastMaintenanceForType (type, maintenances) {
    const filtré = maintenances
        .filter(item => item.type === type)
        .sort((a, b) => Nombre(b.km) - Nombre(a.km));

    retourner filtered[0] || null;
}

fonction getVehicleKm() {
    return parseInt(localStorage.getItem("t5_vehicle_km"), 10);
}

fonction getEngineKm(vehicleKm) {
    retourner Math.max(0, Number(vehicleKm) - ENGINE_REPLACEMENT_KM);
}

fonction getKmHistory() {
    return JSON.parse(localStorage.getItem("t5_km_history")) || [];
}

fonction getMaintenances() {
    return JSON.parse(localStorage.getItem("t5_maintenances")) || [] ;
}

fonction getCloudUrl() {
    retourner localStorage.getItem("t5_cloud_url") || "";
}

fonction setText(id, valeur) {
    const élément = document.getElementById(id);
    si (élément) élément.textContent = valeur ;
}

fonction formatKm(valeur) {
    retourner Nombre(valeur).toLocaleString("fr-FR") + " km";
}

fonction formatDateFr(dateString) {
    si (!dateString) retourner "";
    si (dateString.includes("/")) retourner dateString;

    const date = new Date(dateString + "T00:00:00");
    retourner date.toLocaleDateString("fr-FR");
}

fonction parseDateForSort(dateString) {
    si (!dateString) retourner une nouvelle Date(0);

    const parts = dateString.split(" ")[0].split("/");
    si (parts.length === 3) {
        retourner une nouvelle Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }

    retourner une nouvelle Date(dateString);
}
