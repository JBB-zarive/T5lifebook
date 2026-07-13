// =======================================
// T5 LifeBook - maintenance-data.js
// Helper partagé : calcule une liste unifiée des
// entretiens triée par urgence, + fournit les icônes
// SVG associées à chaque type. Réutilisé par
// maintenance-list.js (page Entretien) et charts.js
// (widget "prochains entretiens" du dashboard).
//
// Réutilise les helpers/consts déjà définis par app.js
// (MAINTENANCE_TYPES, getVehicleKm, getMaintenances,
// getLastMaintenanceForType, ENGINE_REPLACEMENT_KM,
// ENGINE_REPLACEMENT_ISO, formatKm, formatDateFr) sans
// jamais les modifier.
// =======================================

function getMaintenanceUrgencyList() {
    const currentKm    = getVehicleKm();
    const maintenances = getMaintenances();
    const now          = new Date();
    const results      = [];

    MAINTENANCE_TYPES.forEach(type => {
        const last     = getLastMaintenanceForType(type.name, maintenances);
        const lastKm   = last ? Number(last.km) : null;
        const lastDate = last ? new Date(last.date + "T00:00:00") : null;

        if (type.group === "km" || type.group === "dual") {
            const baseKm  = lastKm !== null ? lastKm : ENGINE_REPLACEMENT_KM;
            const kmSince = Math.max(0, currentKm - baseKm);
            let ratio     = Math.min((kmSince / type.interval) * 100, 100);
            let detail    = `${formatKm(Math.max(0, type.interval - kmSince))} restants`;

            if (type.group === "dual") {
                const baseDate    = lastDate || new Date(ENGINE_REPLACEMENT_ISO + "T00:00:00");
                const monthsSince = (now - baseDate) / (1000 * 60 * 60 * 24 * 30.44);
                const ratioTime   = Math.min((monthsSince / (type.intervalYears * 12)) * 100, 100);
                if (ratioTime > ratio) {
                    ratio  = ratioTime;
                    const monthsLeft = Math.max(0, type.intervalYears * 12 - monthsSince);
                    detail = `${Math.round(monthsLeft)} mois restants`;
                }
            }

            results.push({
                name: type.name,
                ratio,
                detail,
                sub: last ? `Dernier : ${formatKm(last.km)} • ${formatDateFr(last.date)}` : "Base : moteur neuf",
                hasGauge: true
            });
            return;
        }

        if (type.group === "time") {
            if (last && lastDate) {
                const monthsSince = (now - lastDate) / (1000 * 60 * 60 * 24 * 30.44);
                const ratio       = Math.min((monthsSince / (type.intervalYears * 12)) * 100, 100);
                const monthsLeft  = Math.max(0, type.intervalYears * 12 - monthsSince);
                results.push({
                    name: type.name,
                    ratio,
                    detail: monthsLeft < 1 ? "Échéance dépassée" : `${Math.round(monthsLeft)} mois restants`,
                    sub: `Dernier : ${formatDateFr(last.date)}`,
                    hasGauge: true
                });
            } else {
                results.push({ name: type.name, ratio: -1, detail: "Non renseigné", sub: "Aucune donnée", hasGauge: false });
            }
            return;
        }

        // Groupe "info" : pas d'intervalle, pas de jauge
        const kmSince = lastKm !== null ? Math.max(0, currentKm - lastKm) : null;
        results.push({
            name: type.name,
            ratio: -1,
            detail: kmSince !== null ? formatKm(kmSince) + " depuis intervention" : "Non renseigné",
            sub: last ? `Dernier : ${formatKm(last.km)} • ${formatDateFr(last.date)}` : "Aucune donnée",
            hasGauge: false
        });
    });

    const withGauge    = results.filter(r => r.hasGauge).sort((a, b) => b.ratio - a.ratio);
    const withoutGauge = results.filter(r => !r.hasGauge);
    return withGauge.concat(withoutGauge);
}

function maintenanceUrgencyClass(ratio) {
    return ratio >= 100 ? "danger" : ratio >= 80 ? "warning" : "ok";
}

// Icônes SVG (traits fins, cohérentes avec le reste de l'app).
// Pictogrammes génériques (goutte, engrenage, pneu, disque, ressort...),
// pas de set d'icônes tiers.
const MAINTENANCE_ICONS = {
    "Vidange moteur + filtre":   '<path d="M12 3s6 6.5 6 10.5a6 6 0 1 1-12 0C6 9.5 12 3 12 3z"/>',
    "Filtre gasoil":             '<path d="M4 4h16"/><path d="M4 4l6.5 8v7l3-1.5v-5.5L20 4"/>',
    "Filtre à air":              '<path d="M4 4h16"/><path d="M4 4l6.5 8v7l3-1.5v-5.5L20 4"/>',
    "Vidange DSG":               '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    "Vidange Haldex":            '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    "Distribution":              '<circle cx="8" cy="12" r="3"/><circle cx="16" cy="12" r="3"/><path d="M8 9a7 7 0 0 1 8 0M8 15a7 7 0 0 0 8 0"/>',
    "Liquide de frein":          '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.4"/><path d="M12 6v2M12 16v2M6 12h2M16 12h2"/>',
    "Freins":                    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.4"/><path d="M12 6v2M12 16v2M6 12h2M16 12h2"/>',
    "Pneus":                     '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"/>',
    "Embrayage / volant moteur": '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    "Remplacement turbos":       '<circle cx="12" cy="12" r="8"/><path d="M12 12 8 6M12 12l6-1M12 12l1 7M12 12l-6 3"/>',
    "Train avant / géométrie":   '<circle cx="12" cy="12" r="7"/><path d="M12 5v3M12 16v3M5 12h3M16 12h3"/><path d="M9 9l1.5 1.5M15 9l-1.5 1.5M9 15l1.5-1.5M15 15l-1.5-1.5"/>',
    "Suspension":                '<path d="M12 2v4"/><path d="M12 18v4"/><path d="M9 6l6 1.5-6 1.5 6 1.5-6 1.5 6 1.5-6 1.5 6 1.5-6 1.5"/>'
};

function maintenanceIconSVG(name) {
    const inner = MAINTENANCE_ICONS[name] ||
        '<path d="M21 7.5a5.5 5.5 0 0 1-7.44 5.16L6 20.2 3.8 18l7.54-7.56A5.5 5.5 0 0 1 18.5 3l-3.75 3.75 1.5 1.5L20 4.5c.63.9 1 1.99 1 3z"/>';
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
