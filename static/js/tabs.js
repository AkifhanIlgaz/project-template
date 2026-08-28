// Tabs: React Aria Tabs davranışının portu. Seçili sekme DOM'da tutulur
// (data-selected + aria-selected); sekmeye tıklayınca/ok tuşlarıyla değişir.
// Seçili arka plan pill'i (.tabs__indicator) tek elemandır, seçilen sekmeye
// taşınır. Panel'ler data-key eşleşmesiyle gösterilir/gizlenir. document'a
// delege edilir; htmx swap'lerinden sonra da çalışır.

// FLIP: indicator başka sekmeye appendChild ile taşınınca transition tetiklenmez
// (parent değişir). Taşımadan önceki ekran konumunu (firstRect) alıp taşıdıktan
// sonra farkı ters translate + eski boyut olarak uygular (transition kapalı),
// sonraki frame'de sıfırlar; CSS bunları translate/width/height üzerinden animatler.
function tabsFlip(el, firstRect) {
  if (!firstRect) return;
  var lastRect = el.getBoundingClientRect();
  var dx = firstRect.left - lastRect.left;
  var dy = firstRect.top - lastRect.top;
  if (
    !dx &&
    !dy &&
    firstRect.width === lastRect.width &&
    firstRect.height === lastRect.height
  ) {
    return;
  }
  el.style.transition = "none";
  el.style.translate = dx + "px " + dy + "px";
  el.style.width = firstRect.width + "px";
  el.style.height = firstRect.height + "px";
  // Ölçümü flush et, sonra doğal konum/boyuta doğru animatle.
  requestAnimationFrame(function () {
    el.style.transition = "";
    el.style.translate = "";
    el.style.width = "";
    el.style.height = "";
  });
}

function tabsSelect(tab) {
  var root = tab.closest('[data-slot="tabs"]');
  if (!root) return;
  var list = tab.closest('[data-slot="tabs-list"]');
  var key = tab.getAttribute("data-key");

  // İndikatörü (varsa) seçilen sekmeye taşı; yoksa oluştur.
  var indicator = root.querySelector('[data-slot="tabs-indicator"]');
  var firstRect = null;
  if (!indicator) {
    indicator = document.createElement("span");
    indicator.className = "tabs__indicator";
    indicator.setAttribute("data-slot", "tabs-indicator");
    indicator.setAttribute("aria-hidden", "true");
  } else {
    // Taşımadan önceki konumu kaydet (FLIP için).
    firstRect = indicator.getBoundingClientRect();
  }

  // Sekmeler: yalnızca tıklanan seçili.
  (list || root).querySelectorAll('[data-slot="tabs-tab"]').forEach(function (t) {
    var on = t === tab;
    if (on) {
      t.setAttribute("data-selected", "true");
      t.setAttribute("aria-selected", "true");
      t.setAttribute("tabindex", "0");
      t.appendChild(indicator);
    } else {
      t.removeAttribute("data-selected");
      t.setAttribute("aria-selected", "false");
      t.setAttribute("tabindex", "-1");
    }
  });

  // Taşındıktan sonra kayarak geçiş animasyonunu uygula.
  tabsFlip(indicator, firstRect);

  // Panel'ler: yalnızca eşleşen görünür.
  root.querySelectorAll('[data-slot="tabs-panel"]').forEach(function (panel) {
    if (panel.getAttribute("data-key") === key) {
      panel.removeAttribute("hidden");
    } else {
      panel.setAttribute("hidden", "");
    }
  });
}

document.addEventListener("click", function (e) {
  if (!e.target.closest) return;
  var tab = e.target.closest('[data-slot="tabs-tab"]');
  if (!tab || tab.disabled || tab.getAttribute("data-disabled") === "true") return;
  tabsSelect(tab);
});

// Ok tuşlarıyla gezinme (roving tabindex): sekmeler arasında dolaş, seç.
document.addEventListener("keydown", function (e) {
  var tab = e.target.closest && e.target.closest('[data-slot="tabs-tab"]');
  if (!tab) return;
  var list = tab.closest('[data-slot="tabs-list"]');
  if (!list) return;

  var vertical = list.getAttribute("data-orientation") === "vertical";
  var nextKey = vertical ? "ArrowDown" : "ArrowRight";
  var prevKey = vertical ? "ArrowUp" : "ArrowLeft";
  if (e.key !== nextKey && e.key !== prevKey) return;

  var tabs = Array.prototype.filter.call(
    list.querySelectorAll('[data-slot="tabs-tab"]'),
    function (t) {
      return !t.disabled && t.getAttribute("data-disabled") !== "true";
    }
  );
  var idx = tabs.indexOf(tab);
  if (idx === -1) return;

  e.preventDefault();
  var delta = e.key === nextKey ? 1 : -1;
  var next = tabs[(idx + delta + tabs.length) % tabs.length];
  next.focus();
  tabsSelect(next);
});
