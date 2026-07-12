// =======================================
// T5 LifeBook - nav.js
// Navigation par onglets (bottom tab bar)
// Ne modifie pas la logique de app.js :
// affiche/masque simplement les pages.
// =======================================

document.addEventListener("DOMContentLoaded", () => {
    const pages   = document.querySelectorAll(".page");
    const navBtns = document.querySelectorAll(".nav-btn");

    function showPage(pageId) {
        pages.forEach(p => p.classList.toggle("active", p.id === "page-" + pageId));
        navBtns.forEach(b => b.classList.toggle("active", b.dataset.page === pageId));
        try { localStorage.setItem("t5_active_page", pageId); } catch (e) {}
        window.scrollTo({ top: 0, behavior: "instant" });
    }

    navBtns.forEach(btn => {
        btn.addEventListener("click", () => showPage(btn.dataset.page));
    });

    let saved = "dashboard";
    try {
        const stored = localStorage.getItem("t5_active_page");
        if (stored && document.getElementById("page-" + stored)) saved = stored;
    } catch (e) {}

    showPage(saved);
});
