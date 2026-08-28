// Dashboard sidebar: desktop collapse/expand and mobile drawer state, both
// stored on <html> via data attributes ([data-sidebar]/[data-sidebar-mobile])
// so the sidebar's own markup never needs JS-driven inline styles — mirrors
// the [data-theme] FOUC-guard pattern in theme-toggle.js. Desktop collapse
// persists across visits; the mobile drawer does not (starts closed on
// every page load).
(function () {
  if (localStorage.getItem("sidebar") === "collapsed") {
    document.documentElement.setAttribute("data-sidebar", "collapsed");
  }

  window.__toggleSidebar = function () {
    var collapsed = document.documentElement.getAttribute("data-sidebar") === "collapsed";
    if (collapsed) {
      document.documentElement.removeAttribute("data-sidebar");
      localStorage.setItem("sidebar", "open");
    } else {
      document.documentElement.setAttribute("data-sidebar", "collapsed");
      localStorage.setItem("sidebar", "collapsed");
    }
  };

  window.__toggleMobileSidebar = function () {
    var open = document.documentElement.getAttribute("data-sidebar-mobile") === "open";
    if (open) {
      document.documentElement.removeAttribute("data-sidebar-mobile");
    } else {
      document.documentElement.setAttribute("data-sidebar-mobile", "open");
    }
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") document.documentElement.removeAttribute("data-sidebar-mobile");
  });
})();
