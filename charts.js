// =======================================
// T5 LifeBook - charts.js
// Dashboard enrichi : KPI carburant, graphique
// de consommation (SVG natif, sans lib externe)
// et aperçu des prochains entretiens.
//
// Ce fichier ne modifie jamais app.js : il se
// contente de lire les mêmes données (localStorage)
// et de "brancher" un rendu supplémentaire après
// chaque updateDashboard().
// =======================================

document.addEventListener("DOMContentLoaded", () => {
    // On enrichit updateDashboard() sans toucher à app.js :
    // à chaque fois que le tableau de bord se met à jour
    // (nouveau plein, nouveau km, restauration cloud...),
    // on rafraîchit aussi nos widgets.
    if (typeof window.updateDashboard === "function") {
        const originalUpdateDashboard = window.updateDashboard;
        window.updateDashboard = function () {
            originalUpdateDashboard();
            renderDashboardExtras();
        };
    }

    renderDashboardExtras();
});

function renderDashboardExtras() {
    try { renderFuelKpis(); } catch (e) { console.error("charts.js KPIs:", e); }
    try { renderConsoChart(); } catch (e) { console.error("charts.js chart:", e); }
    try { renderUpcomingMaintenance(); } catch (e) { console.error("charts.js upcoming:", e); }
}

// -------------------------------------------------------------------
// KPI CARBURANT
// -------------------------------------------------------------------
function renderFuelKpis() {
    const kpiEl = document.getElementById("dashKpis");
    if (!kpiEl) return;

    const fuel = [...getFuelHistory()].sort((a, b) => Number(b.km) - Number(a.km));

    if (fuel.length < 2) {
        kpiEl.classList.add("hidden");
        kpiEl.innerHTML = "";
        return;
    }

    const withConso = fuel.map((f, i) => {
        const next = fuel[i + 1];
        if (!next) return { ...f, conso: null };
        const kmDiff = Number(f.km) - Number(next.km);
        if (kmDiff <= 0) return { ...f, conso: null };
        return { ...f, conso: (f.liters / kmDiff) * 100 };
    });

    const consoValues = withConso.filter(f => f.conso !== null).map(f => f.conso);
    const avgConso = consoValues.length ? consoValues.reduce((s, c) => s + c, 0) / consoValues.length : null;

    const totalL     = fuel.reduce((s, f) => s + f.liters, 0);
    const totalPrice = fuel.reduce((s, f) => s + f.price, 0);
    const avgPriceL  = totalPrice / totalL;

    const kmMin  = Math.min(...fuel.map(f => Number(f.km)));
    const kmMax  = Math.max(...fuel.map(f => Number(f.km)));
    const coutKm = kmMax > kmMin ? totalPrice / (kmMax - kmMin) : null;

    const last = withConso[0];

    kpiEl.classList.remove("hidden");
    kpiEl.innerHTML =
        (avgConso !== null ? boxHTML(avgConso.toFixed(1) + " L/100", "Conso moyenne", "highlight") : "") +
        (coutKm !== null ? boxHTML(coutKm.toFixed(2) + " €/km", "Coût au km") : "") +
        boxHTML(avgPriceL.toFixed(3) + " €/L", "Prix moyen") +
        boxHTML(last.price.toFixed(2) + " €", "Dernier plein");

    function boxHTML(value, label, extraClass) {
        return `<div class="fuel-stat-box${extraClass ? " " + extraClass : ""}">
            <div class="value">${value}</div>
            <div class="label">${label}</div>
        </div>`;
    }
}

// -------------------------------------------------------------------
// GRAPHIQUE DE CONSOMMATION (SVG natif)
// -------------------------------------------------------------------
function renderConsoChart() {
    const wrap = document.getElementById("consoChart");
    if (!wrap) return;

    const fuel = [...getFuelHistory()].sort((a, b) => Number(a.km) - Number(b.km)); // chronologique

    const points = [];
    for (let i = 1; i < fuel.length; i++) {
        const kmDiff = Number(fuel[i].km) - Number(fuel[i - 1].km);
        if (kmDiff <= 0) continue;
        const conso = (fuel[i].liters / kmDiff) * 100;
        points.push({ conso, date: fuel[i].date, km: fuel[i].km });
    }

    if (points.length < 2) {
        wrap.innerHTML = `<p class="chart-empty">Ajoute au moins 3 pleins pour voir la courbe de consommation.</p>`;
        return;
    }

    const last8 = points.slice(-8);

    const W = 300, H = 130, padX = 8, padY = 16;
    const values = last8.map(p => p.conso);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const stepX = (W - padX * 2) / (last8.length - 1);
    const coords = last8.map((p, i) => {
        const x = padX + i * stepX;
        const y = H - padY - ((p.conso - min) / range) * (H - padY * 2);
        return { x, y, ...p };
    });

    const linePath = coords.map((c, i) => (i === 0 ? "M" : "L") + c.x.toFixed(1) + "," + c.y.toFixed(1)).join(" ");
    const areaPath = linePath + ` L${coords[coords.length - 1].x.toFixed(1)},${H - padY} L${coords[0].x.toFixed(1)},${H - padY} Z`;

    const dots = coords.map(c =>
        `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3.2" class="chart-dot"></circle>`
    ).join("");

    const firstLabel = coords[0];
    const lastLabel  = coords[coords.length - 1];

    const trend = lastLabel.conso - firstLabel.conso;
    const trendLabel = trend <= -0.05 ? "▼ en baisse" : trend >= 0.05 ? "▲ en hausse" : "→ stable";
    const trendClass = trend <= -0.05 ? "trend-good" : trend >= 0.05 ? "trend-bad" : "trend-neutral";

    wrap.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" class="conso-svg" preserveAspectRatio="none">
            <defs>
                <linearGradient id="consoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--fuel)" stop-opacity="0.35"></stop>
                    <stop offset="100%" stop-color="var(--fuel)" stop-opacity="0"></stop>
                </linearGradient>
            </defs>
            <path d="${areaPath}" fill="url(#consoFill)" stroke="none"></path>
            <path d="${linePath}" fill="none" stroke="var(--fuel)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
            ${dots}
        </svg>
        <div class="conso-chart-footer">
            <span>${formatDateFr(firstLabel.date)} → ${formatDateFr(lastLabel.date)}</span>
            <span class="conso-trend ${trendClass}">${lastLabel.conso.toFixed(1)} L/100 <small>${trendLabel}</small></span>
        </div>
    `;
}

// -------------------------------------------------------------------
// PROCHAINS ENTRETIENS (les 3 échéances les plus urgentes)
// -------------------------------------------------------------------
function renderUpcomingMaintenance() {
    const container = document.getElementById("upcomingList");
    if (!container) return;

    const top = getMaintenanceUrgencyList()
        .filter(item => item.hasGauge && item.ratio > 0)
        .slice(0, 3);

    if (!top.length) {
        container.innerHTML = "<p>Rien à signaler pour le moment 👍</p>";
        return;
    }

    container.innerHTML = top.map(item => {
        const cls = maintenanceUrgencyClass(item.ratio);
        return `
        <div class="maintenance-item">
            <div class="maintenance-header">
                <strong>${item.name}</strong>
                <span>${item.detail}</span>
            </div>
            <div class="maintenance-progress">
                <div class="maintenance-bar ${cls}" style="width:${item.ratio}%"></div>
            </div>
        </div>`;
    }).join("");
}
