// Sample helpers: switch views by hash, toggle theme, and the "marked safe" signature moment.
(function () {
  const views = [...document.querySelectorAll(".view")];
  const links = [...document.querySelectorAll(".switcher a")];
  function show() {
    const id = (location.hash || "#" + views[0].id).slice(1);
    const run = () => {
      views.forEach((v) => v.classList.toggle("on", v.id === id));
      links.forEach((a) => a.setAttribute("aria-current", a.hash === "#" + id ? "page" : "false"));
      window.scrollTo(0, 0);
    };
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(run);
    else run();
  }
  addEventListener("hashchange", show);
  show();

  const params = new URLSearchParams(location.search);
  if (params.get("theme") === "dark") document.documentElement.dataset.theme = "dark";
  document.querySelectorAll("[data-theme-toggle]").forEach((b) =>
    b.addEventListener("click", () => {
      const r = document.documentElement;
      r.dataset.theme = r.dataset.theme === "dark" ? "light" : "dark";
    })
  );

  // signature moment: a case marked safe
  document.querySelectorAll("[data-mark-safe]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-case]");
      const badge = card.querySelector(".status");
      badge.className = "status st-resolved is-safe";
      badge.innerHTML = '<svg class="i" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Resolved';
      btn.replaceWith(Object.assign(document.createElement("span"), { className: "safe-note", textContent: "Marked safe. Thank you." }));
    })
  );
})();
