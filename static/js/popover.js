// Popover: React Aria DialogTrigger/Popover davranışının karşılığı.
// data-entering/exiting animasyonları alert_dialog.js'teki afterAnimations
// yardımcısını kullanır; layout.templ'de alert_dialog.js bu dosyadan ÖNCE
// yüklenmelidir. Content, portal yerine root'a göre absolute konumlanır.

function popoverTriggerOf(root) {
  var custom = root.querySelector('[data-slot="popover-trigger"]');
  if (custom && !custom.closest('[data-slot="popover-content"]')) return custom;
  var buttons = root.querySelectorAll("button");
  for (var i = 0; i < buttons.length; i++) {
    if (!buttons[i].closest('[data-slot="popover-content"]')) return buttons[i];
  }
  return null;
}

// Content'i trigger'a göre yerleştirir; oku ve transform-origin'i placement'a
// göre ayarlar (React Aria'nın floating konumlandırmasının basit karşılığı).
function popoverPosition(root, content, trigger) {
  var placement = content.getAttribute("data-placement") || "bottom";
  var offset = parseInt(content.getAttribute("data-offset") || "8", 10);
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
  var arrow = content.querySelector('[data-slot="popover-overlay-arrow-group"]');
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

function popoverOpen(root) {
  var content = root.querySelector('[data-slot="popover-content"]');
  var trigger = popoverTriggerOf(root);
  if (!content || !content.hasAttribute("hidden")) return;
  // Boyut ölçümü için önce görünmez şekilde aç, konumla, sonra göster.
  content.style.visibility = "hidden";
  content.removeAttribute("hidden");
  if (trigger) {
    popoverPosition(root, content, trigger);
    trigger.setAttribute("aria-expanded", "true");
  }
  content.style.visibility = "";
  content.setAttribute("data-entering", "true");
  afterAnimations(content, function () {
    content.removeAttribute("data-entering");
  });
}

function popoverClose(root) {
  var content = root.querySelector('[data-slot="popover-content"]');
  var trigger = popoverTriggerOf(root);
  if (!content || content.hasAttribute("hidden")) return;
  if (trigger) trigger.setAttribute("aria-expanded", "false");
  content.setAttribute("data-exiting", "true");
  // afterOwnAnimations (alert_dialog.js): subtree beklemez; content içindeki
  // alakasız transition'lar hidden'ı geciktirip bir karelik yeniden görünürlüğe
  // yol açmasın diye yalnızca content'in kendi exit animasyonunu bekler.
  afterOwnAnimations([content], function () {
    content.setAttribute("hidden", "");
    content.removeAttribute("data-exiting");
  });
}

function popoverCloseAll(except) {
  document.querySelectorAll('[data-slot="popover-root"]').forEach(function (root) {
    if (root !== except) popoverClose(root);
  });
}

function popoverToggle(root) {
  var content = root.querySelector('[data-slot="popover-content"]');
  if (content && content.hasAttribute("hidden")) {
    popoverOpen(root);
  } else {
    popoverClose(root);
  }
}

document.addEventListener("click", function (e) {
  var root = e.target.closest('[data-slot="popover-root"]');
  if (!root) {
    popoverCloseAll(null);
    return;
  }
  popoverCloseAll(root);
  // Content içine tıklama popover'ı kapatmaz.
  if (e.target.closest('[data-slot="popover-content"]')) return;
  var trigger = popoverTriggerOf(root);
  if (trigger && trigger.contains(e.target)) popoverToggle(root);
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    popoverCloseAll(null);
    return;
  }
  // Özel (buton olmayan) trigger için Enter/Space
  if (e.key === "Enter" || e.key === " ") {
    var trigger = e.target.closest('[data-slot="popover-trigger"]');
    if (trigger) {
      e.preventDefault();
      popoverToggle(trigger.closest('[data-slot="popover-root"]'));
    }
  }
});
