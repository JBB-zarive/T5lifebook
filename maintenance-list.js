// =======================================
// T5 LifeBook - maintenance-list.js
// Remplace entièrement le rendu de la liste d'entretien
// (window.updateMaintenanceList) par une liste unifiée,
// triée par urgence, avec icônes SVG par type.
//
// Ceci REMPLACE la fonction globale updateMaintenanceList
// définie dans app.js (au lieu de la compléter), puisque
// c'est tout le rendu visuel de cette liste qu'on change.
// app.js continue d'appeler updateMaintenanceList() par son
// nom depuis updateDashboard() : comme cet appel se fait par
// identifiant à l'exécution, il utilise automatiquement cette
// nouvelle version dès que ce script est chargé (avant même le
// premier rendu, puisque les scripts s'exécutent avant l'événement
// DOMContentLoaded qui déclenche le premier appel dans app.js).
// =======================================

window.updateMaintenanceList = function updateMaintenanceListUnified() {
    const container = document.getElementById("maintenanceList");
    if (!container) return;

    const items = getMaintenanceUrgencyList();

    container.innerHTML = items.map(item => {
        const icon = maintenanceIconSVG(item.name);

        if (item.hasGauge) {
            const cls = maintenanceUrgencyClass(item.ratio);
            return `
            <div class="maintenance-item unified">
                <div class="maintenance-icon">${icon}</div>
                <div class="maintenance-body">
                    <div class="maintenance-header">
                        <strong>${item.name}</strong>
                        <span>${item.detail}</span>
                    </div>
                    <div class="maintenance-progress">
                        <div class="maintenance-bar ${cls}" style="width:${item.ratio}%"></div>
                    </div>
                    <small>${item.sub}</small>
                </div>
            </div>`;
        }

        return `
        <div class="maintenance-item unified no-interval">
            <div class="maintenance-icon">${icon}</div>
            <div class="maintenance-body">
                <div class="maintenance-header">
                    <strong>${item.name}</strong>
                    <span>${item.detail}</span>
                </div>
                <small>${item.sub}</small>
            </div>
        </div>`;
    }).join("");
};
