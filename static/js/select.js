// Select: React Aria Select/Popover/ListBox davranışının karşılığı.
// Öğe seçimi/checkmark toggle'ı list_box.js'in click delegasyonunu paylaşır;
// bu dosya yalnızca açma/kapama, konumlandırma ve trigger'daki değer metnini
// yönetir. data-entering/exiting animasyonları alert_dialog.js'teki
// afterAnimations'ı kullanır; layout.templ'de alert_dialog.js ve list_box.js
// bu dosyadan ÖNCE yüklenmelidir.

function selectTriggerOf(root) {
  return root.querySelector('[data-slot="select-trigger"]');
}

function selectPopoverOf(root) {
  return root.querySelector('[data-slot="select-popover"]');
}

function selectPositionPopover(trigger, popover) {
  var root = trigger.closest('[data-slot="select"]');
  root.style.position = "relative";
  popover.style.position = "absolute";
  popover.style.zIndex = "50";
  popover.style.setProperty("--trigger-width", trigger.offsetWidth + "px");
  popover.style.minWidth = trigger.offsetWidth + "px";
  popover.style.top = trigger.offsetTop + trigger.offsetHeight + 4 + "px";
  popover.style.left = trigger.offsetLeft + "px";
}

function selectOpen(root) {
  var trigger = selectTriggerOf(root);
  var popover = selectPopoverOf(root);
  if (!trigger || !popover || !popover.hasAttribute("hidden")) return;
  popover.removeAttribute("hidden");
  selectPositionPopover(trigger, popover);
  trigger.setAttribute("aria-expanded", "true");
  var indicator = trigger.querySelector('[data-slot^="select-"][data-slot$="indicator"]');
  if (indicator) indicator.setAttribute("data-open", "true");
  popover.setAttribute("data-entering", "true");
  afterAnimations(popover, function () {
    popover.removeAttribute("data-entering");
  });
}

function selectClose(root) {
  var trigger = selectTriggerOf(root);
  var popover = selectPopoverOf(root);
  if (!popover || popover.hasAttribute("hidden")) return;
  if (trigger) trigger.setAttribute("aria-expanded", "false");
  var indicator = trigger && trigger.querySelector('[data-slot^="select-"][data-slot$="indicator"]');
  if (indicator) indicator.setAttribute("data-open", "false");
  popover.setAttribute("data-exiting", "true");
  // afterOwnAnimations (alert_dialog.js): subtree beklemez; seçimle tetiklenen
  // list-box-item checkmark animasyonunu beklemeyip popover'ı zamanında gizler.
  afterOwnAnimations([popover], function () {
    popover.setAttribute("hidden", "");
    popover.removeAttribute("data-exiting");
  });
}

function selectCloseAll(except) {
  document.querySelectorAll('[data-slot="select"]').forEach(function (root) {
    if (root !== except) selectClose(root);
  });
}

// Seçili list-box-item(ler)in metnini select__value'ya yansıtır.
function selectSyncValue(root) {
  var listBox = root.querySelector('[data-slot="select-popover"] [data-slot="list-box"]');
  var value = root.querySelector('[data-slot="select-value"]');
  if (!listBox || !value) return;
  var selected = Array.from(
    listBox.querySelectorAll('[data-slot="list-box-item"][data-selected="true"]')
  );
  if (selected.length === 0) {
    value.setAttribute("data-placeholder", "true");
    value.textContent = value.getAttribute("data-placeholder-text") || "";
    return;
  }
  value.removeAttribute("data-placeholder");
  value.textContent = selected
    .map(function (item) {
      return (item.textContent || "").trim();
    })
    .join(", ");
}

document.addEventListener("click", function (e) {
  var root = e.target.closest('[data-slot="select"]');
  if (!root) {
    selectCloseAll(null);
    return;
  }
  selectCloseAll(root);
  var item = e.target.closest('[data-slot="list-box-item"]');
  if (item && item.closest('[data-slot="select-popover"]')) {
    // list_box.js aynı click'te selection state'i günceller; sonraki
    // mikrotask'te DOM güncellenmiş olur.
    Promise.resolve().then(function () {
      selectSyncValue(root);
      var listBox = item.closest('[data-slot="list-box"]');
      if (listBox && listBox.getAttribute("data-selection-mode") !== "multiple") {
        selectClose(root);
      }
    });
    return;
  }
  if (e.target.closest('[data-slot="select-popover"]')) return;
  var trigger = selectTriggerOf(root);
  if (trigger && trigger.contains(e.target)) {
    var popover = selectPopoverOf(root);
    if (popover && popover.hasAttribute("hidden")) {
      selectOpen(root);
    } else {
      selectClose(root);
    }
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") selectCloseAll(null);
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('[data-slot="select-value"]').forEach(function (value) {
    if (value.getAttribute("data-placeholder") === "true") {
      value.setAttribute("data-placeholder-text", value.textContent || "");
    }
  });
});
