/* ===================================
   T5 LifeBook V2 - app-v2.js
=================================== */

// ================= CONFIG =================

const STORAGE = {
    VEHICLE: "t5_vehicle",
    KM: "t5_kilometrages",
    MAINTENANCE: "t5_entretiens",
    FUEL: "t5_carburant",
    MODS: "t5_modifications",
    CLOUD: "t5_cloud_url"
};

const VEHICLE = {
    model: "T5.1 4Motion DSG CFCA 180 ch",
    vin: "WV1ZZZ7HZEH003985",
    immat: "CW-374-CL",
    engineReplacementDate: "2026-06-19",
    engineStartKm: 170060,
    objectiveKm: 400000
};

// ================= INIT =================

document.addEventListener("DOMContentLoaded", () => {

    initializeStorage();

    initNavigation();
    initModals();
    initButtons();

    loadDashboard();

});

// ================= STORAGE =================

function initializeStorage() {

    if (!localStorage.getItem(STORAGE.VEHICLE)) {
        localStorage.setItem(
            STORAGE.VEHICLE,
            JSON.stringify(VEHICLE)
        );
    }

    if (!localStorage.getItem(STORAGE.KM))
        localStorage.setItem(STORAGE.KM, "[]");

    if (!localStorage.getItem(STORAGE.MAINTENANCE))
        localStorage.setItem(STORAGE.MAINTENANCE, "[]");

    if (!localStorage.getItem(STORAGE.FUEL))
        localStorage.setItem(STORAGE.FUEL, "[]");

    if (!localStorage.getItem(STORAGE.MODS))
        localStorage.setItem(STORAGE.MODS, "[]");

}

function getData(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
}

function setData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getVehicle() {
    return JSON.parse(
        localStorage.getItem(STORAGE.VEHICLE)
    );
}

// ================= NAVIGATION =================

function initNavigation() {

    document
        .querySelectorAll(".nav-btn")
        .forEach(btn => {

            btn.addEventListener("click", () => {
                showPage(btn.dataset.page);
            });

        });

}

function showPage(page) {

    document.querySelectorAll(".page")
        .forEach(p => {
            p.classList.add("hidden");
            p.classList.remove("active-page");
        });

    document.querySelectorAll(".nav-btn")
        .forEach(btn => {
            btn.classList.remove("active");
        });

    document
        .getElementById(`page-${page}`)
        ?.classList.remove("hidden");

    document
        .getElementById(`page-${page}`)
        ?.classList.add("active-page");

    document
        .querySelector(`[data-page="${page}"]`)
        ?.classList.add("active");

}

// ================= MODALS =================

function initModals() {

    bindModal(
        "openFuelModal",
        "fuelModal"
    );

    bindModal(
        "quickFuelBtn",
        "fuelModal"
    );

    bindModal(
        "quickKmBtn",
        "kmModal"
    );

    bindModal(
        "openMaintenanceModal",
        "maintenanceModal"
    );

    bindModal(
        "openModModal",
        "modModal"
    );

    document
        .querySelectorAll(".close-modal")
        .forEach(btn => {

            btn.addEventListener(
                "click",
                closeAllModals
            );

        });

}

function bindModal(buttonId, modalId) {

    const btn =
        document.getElementById(buttonId);

    if (!btn) return;

    btn.addEventListener("click", () => {

        closeAllModals();

        document
            .getElementById(modalId)
            ?.classList.remove("hidden");

        prefillDates();

    });

}

function closeAllModals() {

    document
        .querySelectorAll(".modal")
        .forEach(m => {
            m.classList.add("hidden");
        });

}

// ================= PREFILL =================

function prefillDates() {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    [
        "fuelDate",
        "kmDate",
        "maintenanceDate",
        "modDate"
    ].forEach(id => {

        const el =
            document.getElementById(id);

        if (el && !el.value)
            el.value = today;

    });

    const currentKm =
        getCurrentKm();

    [
        "fuelKm",
        "kmValue",
        "maintenanceKm",
        "modKm"
    ].forEach(id => {

        const el =
            document.getElementById(id);

        if (el)
            el.value = currentKm;

    });

}

// ================= ID =================

function generateId(prefix) {

    return `${prefix}-${Date.now()}`;

}

// ================= KM =================

function getCurrentKm() {

    const kms =
        getData(STORAGE.KM);

    if (kms.length === 0)
        return VEHICLE.engineStartKm;

    kms.sort(
        (a, b) =>
            b.km_chassis -
            a.km_chassis
    );

    return kms[0].km_chassis;

}

function calculateEngineKm(
    chassisKm
) {

    return (
        chassisKm -
        VEHICLE.engineStartKm
    );

}

// ================= BUTTONS =================

function initButtons() {

    document
        .getElementById("saveKmBtn")
        ?.addEventListener(
            "click",
            saveKm
        );

    document
        .getElementById("saveFuelBtn")
        ?.addEventListener(
            "click",
            saveFuel
        );

    document
        .getElementById("saveMaintenanceBtn")
        ?.addEventListener(
            "click",
            saveMaintenance
        );

    document
        .getElementById("saveModBtn")
        ?.addEventListener(
            "click",
            saveModification
        );

}

// ================= SAVE KM =================

function saveKm() {

    const km =
        parseInt(
            document
                .getElementById("kmValue")
                .value
        );

    if (!km) return;

    const item = {

        id:
            generateId("km"),

        date_saisie:
            document
                .getElementById("kmDate")
                .value,

        km_chassis: km,

        km_moteur:
            calculateEngineKm(km),

        source:
            document
                .getElementById("kmSource")
                .value,

        note:
            document
                .getElementById("kmNote")
                .value

    };

    const kms =
        getData(STORAGE.KM);

    kms.push(item);

    setData(
        STORAGE.KM,
        kms
    );

    closeAllModals();
    loadDashboard();

}

// ================= SAVE FUEL =================

function saveFuel() {

    const km =
        parseInt(
            document
                .getElementById("fuelKm")
                .value
        );

    const fuel = {

        id:
            generateId("car"),

        date:
            document
                .getElementById("fuelDate")
                .value,

        km_chassis: km,

        litres:
            parseFloat(
                document
                    .getElementById("fuelLiters")
                    .value
            ),

        montant:
            parseFloat(
                document
                    .getElementById("fuelAmount")
                    .value
            ),

        createdAt:
            new Date()
                .toISOString()

    };

    const fuels =
        getData(STORAGE.FUEL);

    fuels.push(fuel);

    setData(
        STORAGE.FUEL,
        fuels
    );

    // Relevé km automatique

    const kms =
        getData(STORAGE.KM);

    kms.push({

        id:
            generateId("km"),

        date_saisie:
            fuel.date,

        km_chassis:
            fuel.km_chassis,

        km_moteur:
            calculateEngineKm(
                fuel.km_chassis
            ),

        source:
            "carburant",

        note:
            "Ajout automatique"

    });

    setData(
        STORAGE.KM,
        kms
    );

    closeAllModals();
    loadDashboard();

}

// ================= SAVE MAINTENANCE =================

function saveMaintenance() {

    const km =
        parseInt(
            document
                .getElementById(
                    "maintenanceKm"
                )
                .value
        );

    const item = {

        id:
            generateId("ent"),

        date:
            document
                .getElementById(
                    "maintenanceDate"
                )
                .value,

        km_chassis: km,

        km_moteur:
            calculateEngineKm(km),

        type:
            document
                .getElementById(
                    "maintenanceType"
                )
                .value,

        description:
            document
                .getElementById(
                    "maintenanceNotes"
                )
                .value,

        cout:
            parseFloat(
                document
                    .getElementById(
                        "maintenanceCost"
                    )
                    .value
            ) || 0,

        createdAt:
            new Date()
                .toISOString()

    };

    const data =
        getData(
            STORAGE.MAINTENANCE
        );

    data.push(item);

    setData(
        STORAGE.MAINTENANCE,
        data
    );

    closeAllModals();
    loadDashboard();

}

// ================= SAVE MOD =================

function saveModification() {

    const km =
        parseInt(
            document
                .getElementById(
                    "modKm"
                )
                .value
        );

    const item = {

        id:
            generateId("mod"),

        titre:
            document
                .getElementById(
                    "modTitle"
                )
                .value,

        date:
            document
                .getElementById(
                    "modDate"
                )
                .value,

        km_chassis: km,

        description:
            document
                .getElementById(
                    "modDescription"
                )
                .value,

        cout:
            parseFloat(
                document
                    .getElementById(
                        "modCost"
                    )
                    .value
            ) || 0,

        createdAt:
            new Date()
                .toISOString()

    };

    const data =
        getData(STORAGE.MODS);

    data.push(item);

    setData(
        STORAGE.MODS,
        data
    );

    closeAllModals();
    loadDashboard();

}

// ================= DASHBOARD =================

function loadDashboard() {

    const km =
        getCurrentKm();

    const engineKm =
        calculateEngineKm(km);

    document
        .getElementById(
            "vehicleKm"
        ).innerText =
        formatKm(km);

    document
        .getElementById(
            "engineKm"
        ).innerText =
        formatKm(engineKm);

    updateProgress();
    updateFuelStats();

}

// ================= PROGRESS =================

function updateProgress() {

    const km =
        getCurrentKm();

    const percent =
        Math.min(
            100,
            (km /
             VEHICLE.objectiveKm) *
            100
        );

    document
        .getElementById(
            "vehicleProgress"
        ).style.width =
        percent + "%";

    document
        .getElementById(
            "vehicleProgressText"
        ).innerText =

        `${formatNumber(km)}
        / ${formatNumber(
            VEHICLE.objectiveKm
        )} km`;

}

// ================= FUEL =================

function updateFuelStats() {

    const fuels =
        getData(STORAGE.FUEL);

    if (
        fuels.length === 0
    ) return;

    const total =
        fuels.reduce(
            (s, f) =>
                s + f.montant,
            0
        );

    document
        .getElementById(
            "fuelTotal"
        ).innerText =
        total.toFixed(2) +
        " €";

}

// ================= HELPERS =================

function formatKm(km) {
    return (
        formatNumber(km) +
        " km"
    );
}

function formatNumber(n) {

    return new Intl
        .NumberFormat(
            "fr-FR"
        )
        .format(n);

}
const CLOUD_URL =
"https://script.google.com/macros/s/AKfycbyMlt67VhYuU1IjRJaWGdImVQYBPz2FXyXz_cXlJ03NHj6YVNkFdkQzdNBcEFl4kMUzvw/exec";
