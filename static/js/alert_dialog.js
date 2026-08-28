// AlertDialog: React Aria DialogTrigger/Modal davranışının karşılığı.
// afterAnimations/lockScroll/viewport senkronu overlay altyapısıdır; ikinci bir
// overlay componenti (Modal, Drawer...) geldiğinde ortak bir dosyaya taşınır.

// React Aria'nın --visual-viewport-height değişkenini günceller (mobil klavye vb. için).
function syncVisualViewportHeight() {
  if (!window.visualViewport) return;
  document.documentElement.style.setProperty(
    "--visual-viewport-height",
    window.visualViewport.height + "px"
  );
}
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", syncVisualViewportHeight);
  syncVisualViewportHeight();
}

// Backdrop altındaki tüm CSS animasyonları bitince cb'yi çağırır (fallback 600ms).
function afterAnimations(el, cb) {
  var done = false;
  var finish = function () {
    if (done) return;
    done = true;
    cb();
  };
  requestAnimationFrame(function () {
    var anims = el.getAnimations ? el.getAnimations({ subtree: true }) : [];
    if (anims.length === 0) return finish();
    Promise.allSettled(anims.map(function (a) { return a.finished; })).then(finish);
  });
  setTimeout(finish, 600);
}

// afterAnimations gibi ama yalnızca verilen elemanların KENDİ animasyonlarını
// (subtree'siz) bekler. Kapanışta kullanılır: subtree:true, kapatan butonun
// kendi renk/press transition'ı gibi ALAKASIZ alt eleman animasyonlarını da
// bekleyip hidden'ı geciktiriyor; bu arada exit animasyonu (fill-mode: none)
// bitince eleman bir kare tekrar görünür oluyor (yeniden açılıp kapanma).
function afterOwnAnimations(elements, cb) {
  var done = false;
  var finish = function () {
    if (done) return;
    done = true;
    cb();
  };
  requestAnimationFrame(function () {
    var anims = [];
    elements.forEach(function (el) {
      if (el && el.getAnimations) anims = anims.concat(el.getAnimations());
    });
    if (anims.length === 0) return finish();
    Promise.allSettled(anims.map(function (a) { return a.finished; })).then(finish);
  });
  setTimeout(finish, 600);
}

// Scrollbar kaldırılınca içerik kaymasın diye genişliği padding ile telafi eder.
function lockScroll() {
  var sw = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.overflow = "hidden";
  if (sw > 0) document.body.style.paddingRight = sw + "px";
}

function unlockScroll() {
  document.documentElement.style.overflow = "";
  document.body.style.paddingRight = "";
}

function alertDialogOpen(backdrop) {
  var container = backdrop.querySelector('[data-slot="alert-dialog-container"]');
  backdrop.removeAttribute("hidden");
  lockScroll();
  backdrop.setAttribute("data-entering", "true");
  if (container) container.setAttribute("data-entering", "true");
  afterAnimations(backdrop, function () {
    backdrop.removeAttribute("data-entering");
    if (container) container.removeAttribute("data-entering");
  });
}

function alertDialogClose(backdrop) {
  var container = backdrop.querySelector('[data-slot="alert-dialog-container"]');
  backdrop.setAttribute("data-exiting", "true");
  if (container) container.setAttribute("data-exiting", "true");
  afterOwnAnimations([backdrop, container], function () {
    // Önce gizle, sonra state'i temizle; ters sıra kapanış anında bir karelik
    // görünürlüğe (yeniden açılıp kapanma) yol açar.
    backdrop.setAttribute("hidden", "");
    backdrop.removeAttribute("data-exiting");
    if (container) container.removeAttribute("data-exiting");
    unlockScroll();
  });
}

document.addEventListener("click", function (e) {
  // Trigger: root'un backdrop dışındaki ilk buton çocuğu
  var trigger = e.target.closest('[data-slot="alert-dialog-root"] > button');
  if (trigger && !trigger.closest('[data-slot="alert-dialog-backdrop"]')) {
    var backdrop = trigger
      .closest('[data-slot="alert-dialog-root"]')
      .querySelector('[data-slot="alert-dialog-backdrop"]');
    if (backdrop) alertDialogOpen(backdrop);
    return;
  }
  // slot="close" olan her element dialogu kapatır
  var closer = e.target.closest('[slot="close"]');
  if (closer) {
    var bd = closer.closest('[data-slot="alert-dialog-backdrop"]');
    if (bd) alertDialogClose(bd);
    return;
  }
  // Backdrop'a tıklama (yalnızca isDismissable)
  if (
    e.target.getAttribute &&
    e.target.getAttribute("data-slot") === "alert-dialog-backdrop" &&
    e.target.getAttribute("data-dismissable") === "true"
  ) {
    alertDialogClose(e.target);
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  var backdrop = document.querySelector('[data-slot="alert-dialog-backdrop"]:not([hidden])');
  if (backdrop && backdrop.getAttribute("data-keyboard-dismiss-disabled") !== "true") {
    alertDialogClose(backdrop);
  }
});
