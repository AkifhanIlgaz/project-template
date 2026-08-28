// Tooltip: React Aria Tooltip davranışının karşılığı. Hover/focus + gecikme ile
// açılır; konumlandırma ve ok yerleşimi popover.js'tekiyle aynı mantıktadır.
// data-entering/exiting animasyonları alert_dialog.js'teki afterAnimations/
// afterOwnAnimations'ı kullanır; layout.templ'de alert_dialog.js bu dosyadan ÖNCE
// yüklenmelidir. Zamanlayıcılar root başına WeakMap'te tutulur.

var tooltipTimers = new WeakMap();

function tooltipTriggerOf(root) {
  var custom = root.querySelector('[data-slot="tooltip-trigger"]');
  if (custom && !custom.closest('[data-slot="tooltip-content"]')) return custom;
  var buttons = root.querySelectorAll("button");
  for (var i = 0; i < buttons.length; i++) {
    if (!buttons[i].closest('[data-slot="tooltip-content"]')) return buttons[i];
  }
  return null;
}

function tooltipContentOf(root) {
  return root.querySelector('[data-slot="tooltip-content"]');
}

// e.target'tan tooltip root+trigger'ı çözer; content üstündeyken veya trigger
// dışındayken null döner.
function tooltipHit(target) {
  if (!target || !target.closest) return null;
  var root = target.closest('[data-slot="tooltip-root"]');
  if (!root || root.getAttribute("data-disabled") === "true") return null;
  var content = tooltipContentOf(root);
  if (content && content.contains(target)) return null;
  var trigger = tooltipTriggerOf(root);
  if (!trigger || !trigger.contains(target)) return null;
  return { root: root, trigger: trigger };
}

// Content'i trigger'a göre yerleştirir; oku ve transform-origin'i placement'a göre
// ayarlar (popover.js'teki popoverPosition ile aynı yaklaşım).
function tooltipPosition(root, content, trigger) {
  var placement = content.getAttribute("data-placement") || "top";
  var offset = parseInt(content.getAttribute("data-offset") || "3", 10);
  var t = trigger, c = content;
  content.style.position = "absolute";
  content.style.zIndex = "50";
  var centerX = t.offsetLeft + t.offsetWidth / 2 - c.offsetWidth / 2;
  var centerY = t.offsetTop + t.offsetHeight / 2 - c.offsetHeight / 2;
  var origin = "center";
  if (placement === "top") {
    content.style.top = t.offsetTop - c.offsetHeight - offset + "px";
    content.style.left = centerX + "px";
    origin = "center bottom";
  } else if (placement === "bottom") {
    content.style.top = t.offsetTop + t.offsetHeight + offset + "px";
    content.style.left = centerX + "px";
    origin = "center top";
  } else if (placement === "left") {
    content.style.left = t.offsetLeft - c.offsetWidth - offset + "px";
    content.style.top = centerY + "px";
    origin = "right center";
  } else if (placement === "right") {
    content.style.left = t.offsetLeft + t.offsetWidth + offset + "px";
    content.style.top = centerY + "px";
    origin = "left center";
  }
  content.style.setProperty("--trigger-anchor-point", origin);
  var arrow = content.querySelector('[data-slot="tooltip-overlay-arrow-group"]');
  if (arrow) {
    arrow.style.top = arrow.style.bottom = arrow.style.left = arrow.style.right = "";
    if (placement === "top") {
      arrow.style.top = "100%";
      arrow.style.left = "50%";
      arrow.style.transform = "translateX(-50%)";
    } else if (placement === "bottom") {
      arrow.style.bottom = "100%";
      arrow.style.left = "50%";
      arrow.style.transform = "translateX(-50%)";
    } else if (placement === "left") {
      arrow.style.left = "100%";
      arrow.style.top = "50%";
      arrow.style.transform = "translateY(-50%)";
    } else if (placement === "right") {
      arrow.style.right = "100%";
      arrow.style.top = "50%";
      arrow.style.transform = "translateY(-50%)";
    }
  }
}

function tooltipShow(root) {
  var content = tooltipContentOf(root);
  var trigger = tooltipTriggerOf(root);
  if (!content || !content.hasAttribute("hidden")) return;
  // Boyut ölçümü için önce görünmez şekilde aç, konumla, sonra göster.
  content.style.visibility = "hidden";
  content.removeAttribute("hidden");
  if (trigger) tooltipPosition(root, content, trigger);
  content.style.visibility = "";
  content.setAttribute("data-entering", "true");
  afterAnimations(content, function () {
    content.removeAttribute("data-entering");
  });
}

function tooltipHide(root) {
  var content = tooltipContentOf(root);
  if (!content || content.hasAttribute("hidden")) return;
  content.setAttribute("data-exiting", "true");
  // afterOwnAnimations (alert_dialog.js): subtree beklemez; içerideki alakasız
  // transition'lar hidden'ı geciktirip bir karelik yeniden görünürlüğe yol açmasın.
  afterOwnAnimations([content], function () {
    content.setAttribute("hidden", "");
    content.removeAttribute("data-exiting");
  });
}

function tooltipTimersOf(root) {
  var t = tooltipTimers.get(root);
  if (!t) {
    t = { show: null, hide: null };
    tooltipTimers.set(root, t);
  }
  return t;
}

function tooltipScheduleShow(root) {
  var timers = tooltipTimersOf(root);
  clearTimeout(timers.hide);
  timers.hide = null;
  var content = tooltipContentOf(root);
  if (!content || !content.hasAttribute("hidden") || timers.show) return;
  var delay = parseInt(root.getAttribute("data-delay") || "700", 10);
  timers.show = setTimeout(function () {
    timers.show = null;
    tooltipShow(root);
  }, delay);
}

function tooltipScheduleHide(root) {
  var timers = tooltipTimersOf(root);
  clearTimeout(timers.show);
  timers.show = null;
  if (timers.hide) return;
  var delay = parseInt(root.getAttribute("data-close-delay") || "300", 10);
  timers.hide = setTimeout(function () {
    timers.hide = null;
    tooltipHide(root);
  }, delay);
}

function tooltipHideNow(root) {
  var timers = tooltipTimersOf(root);
  clearTimeout(timers.show);
  clearTimeout(timers.hide);
  timers.show = timers.hide = null;
  tooltipHide(root);
}

// Hover (bubbling mouseover/mouseout ile htmx swap'lerinden sonra da çalışır).
document.addEventListener("mouseover", function (e) {
  var hit = tooltipHit(e.target);
  if (!hit || hit.root.getAttribute("data-trigger") === "focus") return;
  tooltipScheduleShow(hit.root);
});

document.addEventListener("mouseout", function (e) {
  var hit = tooltipHit(e.target);
  if (!hit || hit.root.getAttribute("data-trigger") === "focus") return;
  // Trigger içindeki elemanlar arası geçişte kapatma.
  if (e.relatedTarget && hit.trigger.contains(e.relatedTarget)) return;
  tooltipScheduleHide(hit.root);
});

// Focus (klavye erişilebilirliği): hover modunda da focus ile açılır.
document.addEventListener("focusin", function (e) {
  var hit = tooltipHit(e.target);
  if (!hit) return;
  tooltipScheduleShow(hit.root);
});

document.addEventListener("focusout", function (e) {
  var hit = tooltipHit(e.target);
  if (!hit) return;
  if (e.relatedTarget && hit.trigger.contains(e.relatedTarget)) return;
  tooltipScheduleHide(hit.root);
});

document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  document.querySelectorAll('[data-slot="tooltip-content"]:not([hidden])').forEach(function (content) {
    var root = content.closest('[data-slot="tooltip-root"]');
    if (root) tooltipHideNow(root);
  });
});
