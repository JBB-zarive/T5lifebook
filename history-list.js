// =======================================
// T5 LifeBook - history-list.js
// Remplace window.updateHistory (comme maintenance-list.js
// remplace updateMaintenanceList) pour :
//   - ne plus afficher les mises à jour de kilométrage seul
//   - réutiliser EXACTEMENT le même rendu que la liste d'entretien
//     (.maintenance-item.unified : icône + titre en gras + date/km
//     en petit + commentaire), pour une apparence harmonisée
// =======================================

function fuelIconSVG() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15"/>
        <path d="M3 21h11"/>
        <path d="M7 8.5h4"/>
        <path d="M14 10.5h2.2a1.8 1.8 0 0 1 1.8 1.8V17a1.5 1.5 0 0 0 3 0v-6l-2.3-2.3"/>
    </svg>`;
}

window.updateHistory = function updateHistoryUnified() {
    const maintenanceHistory = getMaintenances().map(item => ({
        icon:        maintenanceIconSVG(item.type),
        dateSort:    new Date(item.date + "T00:00:00"),
        createdAt:   item.createdAt || item.date,
        displayDate: formatDateFr(item.date),
        km:          item.km,
        title:       item.type,
        detail:      item.notes || "Entretien enregistré"
    }));

    const fuelHistoryItems = getFuelHistory().map(item => ({
        icon:        fuelIconSVG(),
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
        <div class="maintenance-item unified no-interval">
            <div class="maintenance-icon">${item.icon}</div>
            <div class="maintenance-body">
                <strong>${item.title}</strong>
                <small class="history-meta">${item.displayDate} • ${formatKm(item.km)}</small>
                <p class="history-detail">${item.detail}</p>
            </div>
        </div>
    `).join("");
};
