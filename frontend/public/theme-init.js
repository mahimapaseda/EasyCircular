(function () {
  try {
    var t = localStorage.getItem("theme");
    var d = t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", d);
    document.documentElement.style.colorScheme = d ? "dark" : "light";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", d ? "#0a0f1a" : "#f8fafc");
    }
  } catch (e) {}

  // Dev: drop stale service workers that can serve outdated HTML and break hydration.
  try {
    if (
      (location.hostname === "localhost" || location.hostname === "127.0.0.1") &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (reg) {
          reg.unregister();
        });
      });
      if ("caches" in window) {
        caches.keys().then(function (keys) {
          keys.forEach(function (key) {
            caches.delete(key);
          });
        });
      }
    }
  } catch (e) {}
})();
