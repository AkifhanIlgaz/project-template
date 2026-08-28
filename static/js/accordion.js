// Accordion: React Aria DisclosureGroup davranışının karşılığı.
// Panel animasyonu --disclosure-panel-height değişkenine bağlıdır.

function syncPanel(panel) {
  var expanded = panel.getAttribute("data-expanded") === "true";
  var body = panel.querySelector(".accordion__body");
  var h = expanded && body ? body.scrollHeight + "px" : "0px";
  panel.style.setProperty("--disclosure-panel-height", h);
}

function initAccordions(root) {
  (root || document).querySelectorAll(".accordion__panel").forEach(syncPanel);
}

function setExpanded(item, expand) {
  var trigger = item.querySelector(".accordion__trigger");
  var panel = item.querySelector(".accordion__panel");
  var indicator = item.querySelector(".accordion__indicator");
  if (trigger) trigger.setAttribute("aria-expanded", String(expand));
  if (indicator) indicator.setAttribute("data-expanded", String(expand));
  if (panel) {
    panel.setAttribute("data-expanded", String(expand));
    syncPanel(panel);
  }
}

document.addEventListener("click", function (e) {
  var trigger = e.target.closest(".accordion__trigger");
  if (!trigger || trigger.disabled) return;
  var item = trigger.closest(".accordion__item");
  var accordion = trigger.closest(".accordion");
  var expand = trigger.getAttribute("aria-expanded") !== "true";
  // HeroUI default: allowsMultipleExpanded=false, açılan öğe diğerlerini kapatır.
  if (expand && accordion && !accordion.hasAttribute("data-allows-multiple-expanded")) {
    accordion.querySelectorAll(":scope > .accordion__item").forEach(function (other) {
      if (other !== item) setExpanded(other, false);
    });
  }
  setExpanded(item, expand);
});

document.addEventListener("DOMContentLoaded", function () {
  initAccordions();
});

// htmx ile yeni içerik geldiğinde accordionları hazırla.
document.body.addEventListener("htmx:afterSwap", function (e) {
  initAccordions(e.target);
});
