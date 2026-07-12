// =======================================
// T5 LifeBook - custom-maintenance.js
// Ajoute une option "Autre (à préciser)" dans le
// menu déroulant des entretiens, avec un champ de
// saisie libre. Ne modifie jamais app.js : ce script
// ajoute une option dans le <select> et remplace sa
// valeur juste avant que app.js lise le formulaire.
// =======================================

document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("maintenanceType");
    const wrap   = document.getElementById("maintenanceCustomWrap");
    const input  = document.getElementById("maintenanceCustomType");
    if (!select || !wrap || !input) return;

    addAutreOption();

    select.addEventListener("change", () => {
        if (select.value === "__autre__") {
            wrap.classList.remove("hidden");
            input.value = "";
            input.focus();
        } else {
            wrap.classList.add("hidden");
        }
    });

    // Remise à zéro propre à chaque ouverture de la modale entretien
    ["openMaintenanceBtn", "openMaintenanceBtnCard"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener("click", resetCustomType);
    });

    function resetCustomType() {
        wrap.classList.add("hidden");
        input.value = "";
        if (select.value === "__autre__") select.selectedIndex = 0;
    }

    function addAutreOption() {
        if (select.querySelector('option[value="__autre__"]')) return;
        const opt = document.createElement("option");
        opt.value = "__autre__";
        opt.textContent = "➕ Autre (à préciser)";
        select.appendChild(opt);
    }
});

// -------------------------------------------------------------------
// Intercepte le clic sur "Enregistrer" en PHASE DE CAPTURE, donc avant
// que le gestionnaire de app.js (attaché directement sur le bouton)
// ne s'exécute. Cela permet de remplacer "__autre__" par le texte
// réellement saisi, sans jamais toucher à saveMaintenance() dans app.js.
// -------------------------------------------------------------------
document.addEventListener("click", function (e) {
    if (!e.target || e.target.id !== "saveMaintenanceBtn") return;

    const select = document.getElementById("maintenanceType");
    const input  = document.getElementById("maintenanceCustomType");
    if (!select || select.value !== "__autre__") return;

    const custom = (input.value || "").trim();

    if (!custom) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        alert("Merci de préciser le type d'entretien.");
        input.focus();
        return;
    }

    let opt = Array.from(select.options).find(o => o.value === custom);
    if (!opt) {
        opt = document.createElement("option");
        opt.value = custom;
        opt.textContent = custom;
        const autreOpt = select.querySelector('option[value="__autre__"]');
        select.insertBefore(opt, autreOpt);
    }
    select.value = custom;
}, true);
