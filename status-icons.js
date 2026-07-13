// =======================================
// T5 LifeBook - status-icons.js
// app.js (et cloud-merge.js) appellent tous updateCloudStatus(message)
// avec un emoji en préfixe ("✅ Synchronisé...", "❌ Erreur...", etc.).
// Comme updateCloudStatus() se contente d'un textContent = message,
// on remplace ENTIÈREMENT cette fonction globale (comme pour
// updateMaintenanceList / updateHistory / updateVehicleGoal) par une
// version qui détecte ce préfixe, l'enlève, et affiche une icône SVG
// à la place — sans jamais modifier les messages dans app.js.
// =======================================

const STATUS_ICONS = {
    "✅":  { cls: "ok",   svg: '<path d="M20 6 9 17l-5-5"/>' },
    "❌":  { cls: "error",svg: '<path d="M18 6 6 18M6 6l12 12"/>' },
    "⚠️": { cls: "warn", svg: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 9v5"/><path d="M12 17h.01"/>' },
    "☁️": { cls: "info", svg: '<path d="M7 18h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7.2 8.1 4 4 0 0 0 7 18z"/>' },
    "⏳":  { cls: "info", svg: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 2"/>' }
};

const STATUS_PREFIX_RE = /^(\u2705|\u274C|\u26A0\uFE0F|\u2601\uFE0F|\u23F3)\s*/u;

window.updateCloudStatus = function updateCloudStatusWithIcon(message) {
    const el = document.getElementById("cloudStatus");
    if (!el) return;

    const msg = String(message == null ? "" : message);
    const match = msg.match(STATUS_PREFIX_RE);

    if (!match) {
        el.textContent = msg;
        return;
    }

    const icon = STATUS_ICONS[match[1]];
    const text = msg.slice(match[0].length);

    if (!icon) {
        el.textContent = msg;
        return;
    }

    el.innerHTML =
        `<span class="status-icon ${icon.cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.svg}</svg></span>` +
        `<span>${text}</span>`;
};
