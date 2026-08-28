// ScrollShadow: React'teki useScrollShadow hook'unun karşılığı. Scroll
// pozisyonuna göre data-top-scroll/data-bottom-scroll/data-top-bottom-scroll
// (dikeyde) veya data-left-scroll/data-right-scroll/data-left-right-scroll
// (yatayda) yazar; CSS bu attribute'lara göre mask-image uygular.

function scrollShadowCheck(el) {
  var vertical = el.getAttribute("data-orientation") !== "horizontal";
  var offset = parseInt(el.getAttribute("data-scroll-shadow-offset") || "0", 10);
  var scrollStart = vertical ? el.scrollTop : el.scrollLeft;
  var scrollSize = vertical ? el.scrollHeight : el.scrollWidth;
  var clientSize = vertical ? el.clientHeight : el.clientWidth;

  var hasBefore = scrollStart > offset;
  var hasAfter = scrollStart + clientSize + offset < scrollSize;

  requestAnimationFrame(function () {
    if (vertical) {
      if (hasBefore && hasAfter) {
        el.setAttribute("data-top-bottom-scroll", "true");
        el.removeAttribute("data-top-scroll");
        el.removeAttribute("data-bottom-scroll");
      } else {
        el.setAttribute("data-top-scroll", String(hasBefore));
        el.setAttribute("data-bottom-scroll", String(hasAfter));
        el.removeAttribute("data-top-bottom-scroll");
      }
    } else {
      if (hasBefore && hasAfter) {
        el.setAttribute("data-left-right-scroll", "true");
        el.removeAttribute("data-left-scroll");
        el.removeAttribute("data-right-scroll");
      } else {
        el.setAttribute("data-left-scroll", String(hasBefore));
        el.setAttribute("data-right-scroll", String(hasAfter));
        el.removeAttribute("data-left-right-scroll");
      }
    }
  });
}

function scrollShadowInit(el) {
  if (el.dataset.scrollShadowInit === "true") return;
  el.dataset.scrollShadowInit = "true";
  scrollShadowCheck(el);
  el.addEventListener("scroll", function () {
    scrollShadowCheck(el);
  }, { passive: true });
  new ResizeObserver(function () {
    scrollShadowCheck(el);
  }).observe(el);
}

function scrollShadowInitAll(root) {
  (root || document).querySelectorAll('[data-slot="scroll-shadow"]').forEach(scrollShadowInit);
}

document.addEventListener("DOMContentLoaded", function () {
  scrollShadowInitAll(document);
});
document.body.addEventListener("htmx:afterSwap", function (e) {
  scrollShadowInitAll(e.target);
});
