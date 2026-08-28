// Toolbar: React Aria Toolbar davranışının portu — ok tuşlarıyla, toolbar
// içindeki odaklanabilir kontroller arasında gezinme. Tab tuşu normal çalışmaya
// devam eder; bu yalnızca ok tuşlarını ekler. document'a delege edilir.

function toolbarFocusables(toolbar) {
  var sel = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.prototype.filter.call(toolbar.querySelectorAll(sel), function (el) {
    // Görünür ve etkin olanlar (kapalı/gizli değil).
    return el.offsetParent !== null || el === document.activeElement;
  });
}

document.addEventListener("keydown", function (e) {
  var toolbar = e.target.closest && e.target.closest('[data-slot="toolbar"]');
  if (!toolbar) return;

  var vertical = toolbar.getAttribute("data-orientation") === "vertical";
  var nextKey = vertical ? "ArrowDown" : "ArrowRight";
  var prevKey = vertical ? "ArrowUp" : "ArrowLeft";
  if (e.key !== nextKey && e.key !== prevKey) return;

  var items = toolbarFocusables(toolbar);
  var idx = items.indexOf(document.activeElement);
  if (idx === -1) return;

  e.preventDefault();
  var delta = e.key === nextKey ? 1 : -1;
  var next = (idx + delta + items.length) % items.length;
  items[next].focus();
});
