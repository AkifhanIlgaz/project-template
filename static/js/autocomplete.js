// Autocomplete: React Aria Autocomplete davranışının karşılığı (filtrelemeli
// Select). Açma/kapama, konumlandırma, trigger'daki değer metni, arama girişiyle
// liste filtreleme ve temizle butonunu bu dosya yönetir; öğe seçimi/checkmark
// toggle'ı list_box.js'in click delegasyonunu paylaşır. Arama girişinin
// data-empty toggle'ı ve temizle butonu search_field.js'te. layout.templ'de
// alert_dialog.js, list_box.js ve search_field.js bu dosyadan ÖNCE yüklenmeli.

function acTriggerOf(root) {
  return root.querySelector('[data-slot="autocomplete-trigger"]');
}

function acPopoverOf(root) {
  return root.querySelector('[data-slot="autocomplete-popover"]');
}

function acPositionPopover(trigger, popover) {
  var root = trigger.closest('[data-slot="autocomplete"]');
  root.style.position = "relative";
  popover.style.position = "absolute";
  popover.style.zIndex = "50";
  popover.style.setProperty("--trigger-width", trigger.offsetWidth + "px");
  popover.style.top = trigger.offsetTop + trigger.offsetHeight + 4 + "px";
  popover.style.left = trigger.offsetLeft + "px";
}

// Arama girişini ve filtreyi sıfırlar (tüm öğeleri gösterir).
function acResetFilter(root) {
  var popover = acPopoverOf(root);
  if (!popover) return;
  var input = popover.querySelector('[data-slot="search-field-input"]');
  if (input) {
    input.value = "";
    var field = input.closest('[data-slot="search-field"]');
    if (field) field.setAttribute("data-empty", "true");
  }
  acApplyFilter(root, "");
}

// query'ye göre list-box öğelerini/section'ları filtreler ve empty-state'i
// görünürlüğe göre günceller.
function acApplyFilter(root, query) {
  var popover = acPopoverOf(root);
  if (!popover) return;
  var q = query.trim().toLowerCase();
  var items = popover.querySelectorAll('[data-slot="list-box-item"]');
  var visible = 0;
  items.forEach(function (item) {
    var text = (item.textContent || "").trim().toLowerCase();
    var match = q === "" || text.indexOf(q) !== -1;
    if (match) {
      item.removeAttribute("hidden");
      visible++;
    } else {
      item.setAttribute("hidden", "");
    }
  });
  // Öğesi kalmayan section'ları ve arama sırasında separator'ları gizle.
  popover.querySelectorAll('[data-slot="list-box-section"]').forEach(function (section) {
    var hasVisible = section.querySelector('[data-slot="list-box-item"]:not([hidden])');
    if (hasVisible) {
      section.removeAttribute("hidden");
    } else {
      section.setAttribute("hidden", "");
    }
  });
  popover.querySelectorAll('[role="separator"]').forEach(function (sep) {
    if (q === "") {
      sep.removeAttribute("hidden");
    } else {
      sep.setAttribute("hidden", "");
    }
  });
  var empty = popover.querySelector('[data-slot="empty-state"]');
  if (empty) {
    if (visible === 0) {
      empty.removeAttribute("hidden");
    } else {
      empty.setAttribute("hidden", "");
    }
  }
}

function acOpen(root) {
  var trigger = acTriggerOf(root);
  var popover = acPopoverOf(root);
  if (!trigger || !popover || !popover.hasAttribute("hidden")) return;
  acResetFilter(root);
  popover.removeAttribute("hidden");
  acPositionPopover(trigger, popover);
  trigger.setAttribute("aria-expanded", "true");
  var indicator = trigger.querySelector('[data-slot^="autocomplete-"][data-slot$="indicator"]');
  if (indicator) indicator.setAttribute("data-open", "true");
  popover.setAttribute("data-entering", "true");
  afterAnimations(popover, function () {
    popover.removeAttribute("data-entering");
  });
  // autoFocus: arama girişine odaklan.
  var input = popover.querySelector('[data-slot="search-field-input"]');
  if (input) input.focus();
}

function acClose(root) {
  var trigger = acTriggerOf(root);
  var popover = acPopoverOf(root);
  if (!popover || popover.hasAttribute("hidden")) return;
  if (trigger) trigger.setAttribute("aria-expanded", "false");
  var indicator = trigger && trigger.querySelector('[data-slot^="autocomplete-"][data-slot$="indicator"]');
  if (indicator) indicator.setAttribute("data-open", "false");
  popover.setAttribute("data-exiting", "true");
  // afterOwnAnimations (alert_dialog.js): subtree beklemez; seçimle tetiklenen
  // checkmark animasyonunu beklemeyip popover'ı zamanında gizler.
  afterOwnAnimations([popover], function () {
    popover.setAttribute("hidden", "");
    popover.removeAttribute("data-exiting");
  });
}

function acCloseAll(except) {
  document.querySelectorAll('[data-slot="autocomplete"]').forEach(function (root) {
    if (root !== except) acClose(root);
  });
}

// Seçili list-box-item(ler)in metnini autocomplete__value'ya ve temizle
// butonunun görünürlüğüne yansıtır.
function acSyncValue(root) {
  var listBox = root.querySelector('[data-slot="autocomplete-popover"] [data-slot="list-box"]');
  var value = root.querySelector('[data-slot="autocomplete-value"]');
  var clear = root.querySelector('[data-slot="autocomplete-clear-button"]');
  if (!listBox || !value) return;
  var selected = Array.from(
    listBox.querySelectorAll('[data-slot="list-box-item"][data-selected="true"]')
  );
  if (selected.length === 0) {
    value.setAttribute("data-placeholder", "true");
    value.textContent = value.getAttribute("data-placeholder-text") || "";
    if (clear) clear.setAttribute("data-empty", "true");
    return;
  }
  value.removeAttribute("data-placeholder");
  value.textContent = selected
    .map(function (item) {
      return (item.textContent || "").trim();
    })
    .join(", ");
  if (clear) clear.removeAttribute("data-empty");
}

function acClearSelection(root) {
  var listBox = root.querySelector('[data-slot="autocomplete-popover"] [data-slot="list-box"]');
  if (listBox) {
    listBox.querySelectorAll('[data-slot="list-box-item"][data-selected="true"]').forEach(function (item) {
      item.setAttribute("aria-selected", "false");
      item.removeAttribute("data-selected");
      var indicator = item.querySelector('[data-slot="list-box-item-indicator"]');
      if (indicator) {
        indicator.removeAttribute("data-visible");
        var check = indicator.querySelector('[data-slot="list-box-item-indicator--checkmark"]');
        if (check) check.setAttribute("stroke-dashoffset", "66");
      }
    });
  }
  acSyncValue(root);
}

document.addEventListener("input", function (e) {
  var input = e.target.closest('[data-slot="search-field-input"]');
  if (!input) return;
  var root = input.closest('[data-slot="autocomplete"]');
  if (!root) return;
  acApplyFilter(root, input.value);
});

document.addEventListener("click", function (e) {
  var root = e.target.closest('[data-slot="autocomplete"]');
  if (!root) {
    acCloseAll(null);
    return;
  }
  acCloseAll(root);

  // Trigger'daki temizle butonu: seçimi sıfırla, popover'ı açma.
  var clear = e.target.closest('[data-slot="autocomplete-clear-button"]');
  if (clear && !clear.closest('[data-slot="autocomplete-popover"]')) {
    e.stopPropagation();
    acClearSelection(root);
    return;
  }

  var item = e.target.closest('[data-slot="list-box-item"]');
  if (item && item.closest('[data-slot="autocomplete-popover"]')) {
    // list_box.js aynı click'te selection state'i günceller; sonraki
    // mikrotask'te DOM güncellenmiş olur.
    Promise.resolve().then(function () {
      acSyncValue(root);
      var listBox = item.closest('[data-slot="list-box"]');
      if (listBox && listBox.getAttribute("data-selection-mode") !== "multiple") {
        acClose(root);
      }
    });
    return;
  }

  // Popover içindeki diğer tıklamalar (arama alanı vb.) popover'ı açık tutar.
  if (e.target.closest('[data-slot="autocomplete-popover"]')) return;

  var trigger = acTriggerOf(root);
  if (trigger && trigger.contains(e.target)) {
    var popover = acPopoverOf(root);
    if (popover && popover.hasAttribute("hidden")) {
      acOpen(root);
    } else {
      acClose(root);
    }
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") acCloseAll(null);
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('[data-slot="autocomplete-value"]').forEach(function (value) {
    if (value.getAttribute("data-placeholder") === "true") {
      value.setAttribute("data-placeholder-text", value.textContent || "");
    }
  });
  // Başlangıçta seçili öğe(ler)e göre değeri ve temizle butonunu senkronla.
  document.querySelectorAll('[data-slot="autocomplete"]').forEach(function (root) {
    acSyncValue(root);
  });
});
