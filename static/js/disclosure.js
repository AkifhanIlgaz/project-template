// Disclosure/DisclosureGroup: React Aria Disclosure davranışının karşılığı.
// Accordion'la aynı kalıp; panel animasyonu --disclosure-panel-height'a bağlı.
// Trigger, [slot="trigger"] üzerinden yakalanır (DisclosureTrigger veya
// Attrs'ına slot="trigger" verilmiş Button).

function syncDisclosureContent(content) {
  var expanded = content.getAttribute("data-expanded") === "true";
  var body = content.querySelector(".disclosure__body");
  var h = expanded && body ? body.scrollHeight + "px" : "0px";
  content.style.setProperty("--disclosure-panel-height", h);
}

function initDisclosures(root) {
  (root || document).querySelectorAll(".disclosure__content").forEach(syncDisclosureContent);
}

function setDisclosureExpanded(disclosure, expand) {
  var trigger = disclosure.querySelector('[slot="trigger"]');
  var content = disclosure.querySelector(".disclosure__content");
  var indicator = disclosure.querySelector(".disclosure__indicator");
  disclosure.setAttribute("data-expanded", String(expand));
  if (trigger) trigger.setAttribute("aria-expanded", String(expand));
  if (indicator) indicator.setAttribute("data-expanded", String(expand));
  if (content) {
    content.setAttribute("data-expanded", String(expand));
    syncDisclosureContent(content);
  }
}

document.addEventListener("click", function (e) {
  var trigger = e.target.closest('button[slot="trigger"]');
  if (!trigger || trigger.disabled) return;
  var disclosure = trigger.closest('[data-slot="disclosure"]');
  if (!disclosure) return;
  var group = disclosure.closest('[data-slot="disclosure-group"]');
  // Mevcut durum kökteki data-expanded'dan okunur; trigger'daki aria-expanded'a
  // güvenilmez çünkü Button slot="trigger" kalıbında bu attribute başta yoktur.
  var expand = disclosure.getAttribute("data-expanded") !== "true";
  // HeroUI default: allowsMultipleExpanded=false, açılan öğe diğerlerini kapatır.
  if (expand && group && !group.hasAttribute("data-allows-multiple-expanded")) {
    group.querySelectorAll('[data-slot="disclosure"]').forEach(function (other) {
      if (other !== disclosure) setDisclosureExpanded(other, false);
    });
  }
  setDisclosureExpanded(disclosure, expand);
});

document.addEventListener("DOMContentLoaded", function () {
  initDisclosures();
});

// htmx ile yeni içerik geldiğinde disclosure'ları hazırla.
document.body.addEventListener("htmx:afterSwap", function (e) {
  initDisclosures(e.target);
});
