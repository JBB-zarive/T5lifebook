// =======================================
// T5 LifeBook - cloud-merge.js
// Fusion "append-only" avec Google Sheets — jamais de suppression,
// jamais de remplacement en masse (contrairement à "Restaurer" qui
// reste un choix manuel et explicite de l'utilisateur) :
//   - une ligne connue seulement dans Google → rapatriée en local
//   - une ligne connue seulement en local    → signalée comme "à envoyer"
//   - une ligne connue des deux côtés        → on n'y touche pas
//
// IMPORTANT — principe de sauvegarde : la vérification AUTOMATIQUE et
// silencieuse au démarrage ne fait JAMAIS d'envoi vers Google, seulement
// du rapatriement. L'envoi (syncAll) ne se déclenche que sur une action
// explicite : une sauvegarde normale (gérée par app.js, inchangée) ou un
// appui manuel sur "Vérifier maintenant" / "Synchroniser". Un envoi
// automatique et invisible juste après une réinstallation (stockage
// local remis aux données d'origine) provoquait des doublons dans le
// Sheet ; on ne pousse donc plus jamais sans une action visible de
// l'utilisateur.
//
// Reconnaissance : par identifiant stable en priorité ; repli sur une
// clé date + kilométrage (+ type pour les entretiens, + litres pour le
// carburant) pour les lignes ajoutées à la main dans le Sheet, sans
// identifiant.
//
// Ce fichier neutralise l'auto-restauration conditionnelle de app.js
// (qui ne se déclenchait que si le stockage local était vide) et la
// remplace par cette fusion complète, déclenchée à chaque ouverture,
// qu'il y ait déjà des données locales ou non.
// =======================================

window.autoRestoreFromCloudIfPossible = async function () {
    // Volontairement vide : cloud-merge.js prend le relais avec une
    // vraie fusion (au lieu d'un remplacement complet), pour tous les
    // cas de figure — pas seulement quand le stockage local est vide.
};

// -------------------------------------------------------------------
// Normalisation des lignes venant du Sheet (même forme que les objets
// locaux, pour pouvoir comparer les deux côtés avec les mêmes clés).
// -------------------------------------------------------------------
function parseCloudKmRow(obj) {
    const km = parseInt(obj.km || obj.km_chassis, 10);
    if (!km) return null;
    const engineKm = parseInt(obj.km_moteur || obj.engineKm, 10);
    const date = normalizeCloudDate(obj.date || obj.date_saisie);
    return {
        id: obj.id || "",
        date: date,
        km: km,
        engineKm: isNaN(engineKm) ? getEngineKm(km) : engineKm,
        source: obj.source || "cloud",
        note: obj.note || "",
        createdAt: date + "T00:00:00"
    };
}

function parseCloudMaintenanceRow(obj) {
    const km = parseInt(obj.km || obj.km_chassis, 10);
    if (!km) return null;
    const engineKm = parseInt(obj.km_moteur || obj.engineKm, 10);
    const date = normalizeCloudDate(obj.date || obj.date_saisie);
    return {
        id: obj.id || "",
        type: String(obj.type || "Autre"),
        date: date,
        km: km,
        engineKm: isNaN(engineKm) ? getEngineKm(km) : engineKm,
        notes: String(obj.notes || obj.description || obj.note || ""),
        cout: obj.cout || "",
        createdAt: date + "T12:00:00"
    };
}

function parseCloudFuelRow(obj) {
    const km = parseInt(obj.km || obj.km_chassis, 10);
    const liters = parseFloat(obj.litres || obj.liters);
    const price = parseFloat(obj.prix_total || obj.montant || obj.price);
    if (!km || isNaN(liters) || isNaN(price)) return null;
    const engineKm = parseInt(obj.km_moteur || obj.engineKm, 10);
    const date = normalizeCloudDate(obj.date || obj.date_saisie);
    return {
        id: obj.id || "",
        date: date,
        km: km,
        engineKm: isNaN(engineKm) ? getEngineKm(km) : engineKm,
        liters: Math.round(liters * 100) / 100,
        price: Math.round(price * 100) / 100,
        pricePerL: parseFloat(obj.prix_litre || obj.pricePerL) || Math.round((price / liters) * 1000) / 1000,
        createdAt: date + "T12:00:00"
    };
}

// -------------------------------------------------------------------
// Clés de repli (date + km [+ type / litres]) pour les lignes du Sheet
// sans identifiant. dayKey() réutilise parseDateForSort (app.js) pour
// gérer aussi bien les dates FR ("12/06/2026 (plein)") que ISO.
// -------------------------------------------------------------------
function dayKey(dateStr) {
    const d = parseDateForSort(dateStr);
    if (!d || isNaN(d.getTime())) return String(dateStr);
    return d.toISOString().slice(0, 10);
}

function fallbackKeyDateKm(dateStr, km)              { return dayKey(dateStr) + "|" + Number(km); }
function fallbackKeyDateKmType(dateStr, km, type)    { return dayKey(dateStr) + "|" + Number(km) + "|" + String(type || "").trim().toLowerCase(); }
function fallbackKeyDateKmLiters(dateStr, km, liters){ return dayKey(dateStr) + "|" + Number(km) + "|" + (Math.round(Number(liters) * 100) / 100); }

// -------------------------------------------------------------------
// Fusion générique d'une table (kilométrages / entretiens / carburant)
// -------------------------------------------------------------------
function mergeTable(opts) {
    const localItems = opts.localGetter();

    const cloudIds = new Set();
    const cloudFallbackKeys = new Set();
    const parsedCloudRows = [];

    (opts.cloudRows || []).forEach(raw => {
        const parsed = opts.parseCloudRow(raw);
        if (!parsed) return;
        if (parsed.id) cloudIds.add(parsed.id);
        cloudFallbackKeys.add(opts.fallbackKey(parsed));
        parsedCloudRows.push(parsed);
    });

    const localIds = new Set(localItems.map(i => i.id).filter(Boolean));

    const toAppend = [];
    parsedCloudRows.forEach(parsed => {
        if (parsed.id) {
            if (localIds.has(parsed.id)) return; // déjà connu
        } else {
            const key = opts.fallbackKey(parsed);
            const alreadyLocal = localItems.some(item => opts.fallbackKey(item) === key);
            if (alreadyLocal) return; // reconnu via date + km (+ type / litres)
            parsed.id = makeId(); // adoption d'un identifiant stable pour la suite
        }
        toAppend.push(parsed);
    });

    if (toAppend.length > 0) {
        let merged = toAppend.concat(localItems);
        merged = dedupeByIdKeepingFirst(merged); // filet de sécurité local
        if (typeof opts.sortFn === "function") merged = merged.sort(opts.sortFn);
        localStorage.setItem(opts.localSetterKey, JSON.stringify(merged));
    }

    let pushed = 0;
    localItems.forEach(item => {
        const key = opts.fallbackKey(item);
        const knownByCloud = (item.id && cloudIds.has(item.id)) || cloudFallbackKeys.has(key);
        if (!knownByCloud) pushed++;
    });

    return { imported: toAppend.length, pushed };
}

// Filet de sécurité local : ne garde qu'une seule entrée par id, même
// si un id venait à apparaître deux fois (protège l'affichage sur le
// téléphone, en plus de la déduplication ajoutée côté script Google).
function dedupeByIdKeepingFirst(items) {
    const seen = new Set();
    const result = [];
    items.forEach(item => {
        if (item.id && seen.has(item.id)) return;
        if (item.id) seen.add(item.id);
        result.push(item);
    });
    return result;
}

function mergeCloudData(cloudData) {
    const kmResult = mergeTable({
        localGetter: getKmHistory,
        localSetterKey: "t5_km_history",
        cloudRows: cloudData.kilometrages || [],
        parseCloudRow: parseCloudKmRow,
        fallbackKey: row => fallbackKeyDateKm(row.date, row.km),
        sortFn: (a, b) => Number(b.km) - Number(a.km)
    });

    const mntResult = mergeTable({
        localGetter: getMaintenances,
        localSetterKey: "t5_maintenances",
        cloudRows: cloudData.entretiens || [],
        parseCloudRow: parseCloudMaintenanceRow,
        fallbackKey: row => fallbackKeyDateKmType(row.date, row.km, row.type),
        sortFn: (a, b) => {
            const byDate = parseDateForSort(b.date) - parseDateForSort(a.date);
            if (byDate !== 0) return byDate;
            return Number(b.km) - Number(a.km);
        }
    });

    const fuelResult = mergeTable({
        localGetter: getFuelHistory,
        localSetterKey: "t5_fuel_history",
        cloudRows: cloudData.carburant || [],
        parseCloudRow: parseCloudFuelRow,
        fallbackKey: row => fallbackKeyDateKmLiters(row.date, row.km, row.liters),
        sortFn: (a, b) => Number(b.km) - Number(a.km)
    });

    return {
        imported: kmResult.imported + mntResult.imported + fuelResult.imported,
        pushed:   kmResult.pushed   + mntResult.pushed   + fuelResult.pushed
    };
}

// Le kilométrage courant est un nombre, pas une liste : on prend
// toujours le plus grand des deux (le compteur ne recule jamais).
function recomputeVehicleKm() {
    const history = getKmHistory();
    if (!history.length) return;
    const maxKm = Math.max(...history.map(item => Number(item.km) || 0));
    if (maxKm > getVehicleKm()) {
        localStorage.setItem("t5_vehicle_km", String(maxKm));
    }
}

// -------------------------------------------------------------------
// Point d'entrée. silent=true (lancement auto) : jamais de message,
// jamais d'alerte, et surtout — jamais d'envoi vers Google. On ne fait
// que rapatrier ce qui manque en local. Un envoi automatique et
// invisible juste après une réinstallation (stockage local remis aux
// données d'origine) est ce qui provoquait des doublons dans le Sheet ;
// l'envoi ne se déclenche donc plus QUE sur une action explicite :
// une sauvegarde normale (inchangée, gérée par app.js), ou un appui sur
// "Vérifier maintenant" / "Synchroniser".
// silent=false (bouton "Vérifier maintenant") : un vrai retour via
// updateCloudStatus(), comme les autres actions cloud, et l'envoi reste
// possible si des données locales manquent côté cloud.
// -------------------------------------------------------------------
async function runCloudMerge(options) {
    options = options || {};
    const silent = !!options.silent;
    const url = getCloudUrl();

    if (!url) {
        if (!silent) updateCloudStatus("Merci de renseigner l'URL Google Apps Script.");
        return { ok: false, reason: "no-url" };
    }

    if (!silent) updateCloudStatus("⏳ Vérification avec Google Sheets…");

    try {
        const cloudData = await fetchCloudData();
        const summary = mergeCloudData(cloudData);

        if (summary.imported > 0) {
            recomputeVehicleKm();
            if (typeof window.updateDashboard === "function") window.updateDashboard();
        }

        // Envoi vers Google : uniquement sur vérification manuelle,
        // jamais depuis la vérification automatique et silencieuse.
        if (summary.pushed > 0 && !silent) {
            syncAll().catch(() => {});
        }

        if (!silent) {
            const total = summary.imported + summary.pushed;
            updateCloudStatus(total > 0
                ? `✅ Vérifié — ${summary.imported} récupérée(s), ${summary.pushed} envoyée(s)`
                : "✅ À jour, aucune nouveauté");
        }

        return { ok: true, summary };
    } catch (error) {
        console.error("runCloudMerge:", error);
        if (!silent) updateCloudStatus("❌ Erreur pendant la vérification.");
        return { ok: false, reason: "error" };
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Vérification automatique et totalement silencieuse à l'ouverture.
    Promise.resolve()
        .then(() => runCloudMerge({ silent: true }))
        .catch(() => {})
        .finally(() => {
            document.dispatchEvent(new CustomEvent("t5-cloud-check-done"));
        });

    // Bouton "Vérifier maintenant" (page Réglages).
    const btn = document.getElementById("checkCloudBtn");
    if (btn) {
        btn.addEventListener("click", () => {
            runCloudMerge({ silent: false }).catch(() => {});
        });
    }
});
