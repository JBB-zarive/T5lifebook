// =======================================
// T5 LifeBook - sync-splash.js
// Affiche l'écran de démarrage animé (van sur planète) et le masque
// une fois que cloud-merge.js a terminé sa vérification (import/push/
// erreur — peu importe l'issue, l'écran disparaît).
//
// Une durée minimale évite un simple flash si tout était déjà à jour.
// Un timeout de sécurité absolu évite tout blocage si jamais
// cloud-merge.js ne se charge pas ou ne se déclenche pas.
// =======================================

(function () {
    const MIN_DISPLAY_MS = 1600; // évite un simple flash si tout est déjà en local
    const MAX_DISPLAY_MS = 6000; // filet de sécurité
    const startedAt = Date.now();
    let dismissed = false;

    function dismiss() {
        if (dismissed) return;
        dismissed = true;
        const el = document.getElementById("syncSplash");
        if (!el) return;
        el.classList.add("sync-splash-hide");
        setTimeout(() => el.remove(), 550);
    }

    function scheduleDismiss() {
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
        setTimeout(dismiss, wait);
    }

    // Signal envoyé par cloud-merge.js une fois la vérification terminée.
    document.addEventListener("t5-cloud-check-done", scheduleDismiss);

    // Filet de sécurité absolu.
    setTimeout(dismiss, MAX_DISPLAY_MS);
})();
