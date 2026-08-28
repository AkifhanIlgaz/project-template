// Dropdown: React Aria MenuTrigger/Popover/Menu davranışının karşılığı.
// Popover animasyonları (data-entering/exiting) alert_dialog.js'teki
// afterAnimations yardımcısını kullanır; layout.templ'de alert_dialog.js
// bu dosyadan ÖNCE yüklenmelidir.

function dropdownTriggerOf(root) {
  var buttons = root.querySelectorAll("button");
  for (var i = 0; i < buttons.length; i++) {
    if (!buttons[i].closest('[data-slot="dropdown-popover"]')) return buttons[i];
  }
  return null;
}

function dropdownOpen(root) {
  var popover = root.querySelector('[data-slot="dropdown-popover"]');
  var trigger = dropdownTriggerOf(root);
  if (!popover || !popover.hasAttribute("hidden")) return;
  // Popover, trigger'ın altına konumlanır (React'teki floating portal yerine).
  root.style.position = "relative";
  popover.style.position = "absolute";
  popover.style.zIndex = "50";
  if (trigger) {
    popover.style.top = trigger.offsetTop + trigger.offsetHeight + 4 + "px";
    popover.style.left = trigger.offsetLeft + "px";
    trigger.setAttribute("aria-expanded", "true");
  }
  popover.removeAttribute("hidden");
  popover.setAttribute("data-entering", "true");
  afterAnimations(popover, function () {
    popover.removeAttribute("data-entering");
  });
}

function dropdownClose(root) {
  var popover = root.querySelector('[data-slot="dropdown-popover"]');
  var trigger = dropdownTriggerOf(root);
  if (!popover || popover.hasAttribute("hidden")) return;
  if (trigger) trigger.setAttribute("aria-expanded", "false");
  popover.setAttribute("data-exiting", "true");
  // afterOwnAnimations (alert_dialog.js): subtree beklemez; tek seçimde şık
  // seçince tetiklenen menu-item checkmark animasyonunu beklemeyip popover'ı
  // zamanında gizler (aksi halde kapanıp bir an tekrar açılır).
  afterOwnAnimations([popover], function () {
    popover.setAttribute("hidden", "");
    popover.removeAttribute("data-exiting");
  });
}

function dropdownCloseAll(except) {
  document.querySelectorAll('[data-slot="dropdown"]').forEach(function (root) {
    if (root !== except) dropdownClose(root);
  });
}

function setMenuItemSelected(item, selected) {
  item.setAttribute("aria-checked", String(selected));
  if (selected) {
    item.setAttribute("data-selected", "true");
  } else {
    item.removeAttribute("data-selected");
  }
  var indicator = item.querySelector('[data-slot="menu-item-indicator"]');
  if (!indicator) return;
  if (selected) {
    indicator.setAttribute("data-visible", "true");
  } else {
    indicator.removeAttribute("data-visible");
  }
  var check = indicator.querySelector('[data-slot="menu-item-indicator--checkmark"]');
  if (check) check.setAttribute("stroke-dashoffset", selected ? "44" : "66");
}

document.addEventListener("click", function (e) {
  var root = e.target.closest('[data-slot="dropdown"]');
  // Dışarı tıklama: açık dropdownları kapat
  if (!root) {
    dropdownCloseAll(null);
    return;
  }
  dropdownCloseAll(root);
  // Menü öğesine tıklama
  var item = e.target.closest('[data-slot="menu-item"]');
  if (item) {
    if (item.getAttribute("data-disabled") === "true") return;
    var mode = item.getAttribute("data-selection-mode");
    if (mode === "single") {
      var menu = item.closest('[data-slot="dropdown-menu"]');
      menu.querySelectorAll('[data-slot="menu-item"]').forEach(function (other) {
        if (other !== item) setMenuItemSelected(other, false);
      });
      setMenuItemSelected(item, true);
    } else if (mode === "multiple") {
      setMenuItemSelected(item, item.getAttribute("data-selected") !== "true");
    }
    // React Aria: multiple dışında menü aksiyonla kapanır.
    if (mode !== "multiple") dropdownClose(root);
    return;
  }
  // Trigger'a tıklama: aç/kapa
  var trigger = e.target.closest("button");
  if (trigger && !trigger.closest('[data-slot="dropdown-popover"]') && trigger === dropdownTriggerOf(root)) {
    var popover = root.querySelector('[data-slot="dropdown-popover"]');
    if (popover && popover.hasAttribute("hidden")) {
      dropdownOpen(root);
    } else {
      dropdownClose(root);
    }
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") dropdownCloseAll(null);
});
