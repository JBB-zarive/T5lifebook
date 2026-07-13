// =======================================
// T5 LifeBook - history-list.js
// Remplace window.updateHistory (comme maintenance-list.js
// remplace updateMaintenanceList) pour :
//   - ne plus afficher les mises à jour de kilométrage seul
//   - réorganiser chaque ligne : titre en gras, puis date + km
//     en petit (comme la date aujourd'hui), puis le commentaire
// =======================================

window.updateHistory = function updateHistoryUnified() {
    const maintenanceHistory = getMaintenances().map(item => ({
        categoryClass: "",
        dateSort:    new Date(item.date + "T00:00:00"),
        createdAt:   item.createdAt || item.date,
        displayDate: formatDateFr(item.date),
        km:          item.km,
        title:       item.type,
        detail:      item.notes || "Entretien enregistré"
    }));

    const fuelHistoryItems = getFuelHistory().map(item => ({
        categoryClass: "fuel-history",
        dateSort:    new Date(item.date + "T12:00:00"),
        createdAt:   item.createdAt,
        displayDate: formatDateFr(item.date),
        km:          item.km,
        title:       `Plein : ${item.liters.toFixed(2)} L`,
        detail:      `${item.price.toFixed(2)} € • ${(item.price / item.liters).toFixed(3)} €/L`
    }));

    const all = [...maintenanceHistory, ...fuelHistoryItems]
        .sort((a, b) => {
            const byDate = b.dateSort - a.dateSort;
            if (byDate !== 0) return byDate;
            const byKm = Number(b.km) - Number(a.km);
            if (byKm !== 0) return byKm;
            return String(b.createdAt).localeCompare(String(a.createdAt));
        });

    const historyList = document.getElementById("historyList");
    if (!historyList) return;
    if (!all.length) { historyList.innerHTML = "<p>Aucun historique enregistré.</p>"; return; }

    historyList.innerHTML = all.map(item => `
        <div class="history-item ${item.categoryClass}">
            <strong>${item.title}</strong>
            <small class="history-meta">${item.displayDate} • ${formatKm(item.km)}</small>
            <p class="history-detail">${item.detail}</p>
        </div>
    `).join("");
};
