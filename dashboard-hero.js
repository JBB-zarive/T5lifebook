// =======================================
// T5 LifeBook - dashboard-hero.js
// Remplace window.updateVehicleGoal (barre linéaire) par
// un anneau de progression circulaire. Même principe que
// maintenance-list.js : remplacement complet de la fonction
// globale, appelée par identifiant depuis updateDashboard()
// dans app.js.
// =======================================

window.updateVehicleGoal = function updateVehicleGoalRing(vehicleKm) {
    const R = 86;
    const CIRCUMFERENCE = 2 * Math.PI * R;

    const percent       = Math.min((vehicleKm / VEHICLE_GOAL_KM) * 100, 100);
    const ring          = document.getElementById("vehicleRingFg");
    const percentLabel  = document.getElementById("vehicleRingPercent");
    const text          = document.getElementById("vehicleProgressText");

    if (ring) {
        ring.style.strokeDasharray  = CIRCUMFERENCE;
        ring.style.strokeDashoffset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
    }
    if (percentLabel) percentLabel.textContent = percent.toFixed(0) + " %";
    if (text) text.textContent = `${formatKm(vehicleKm)} / ${formatKm(VEHICLE_GOAL_KM)}`;
};
