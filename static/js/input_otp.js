// InputOTP: guilhermerodz/input-otp davranışının karşılığı. Görünmez tek bir
// native <input> değeri, seçim (caret) konumu ve odak durumundan slot'ların
// karakterini, data-active/data-filled durumunu ve caret görünürlüğünü türetir.
// Controlled state yoktur; değer DOM input'unda tutulur.

(function () {
  function patternRe(input) {
    var p = input.getAttribute("data-pattern");
    if (!p) return null;
    try {
      return new RegExp(p);
    } catch (e) {
      return null;
    }
  }

  // İzin verilmeyen karakterleri (ör. rakam-dışı) girişten temizler.
  function filterValue(input) {
    var re = patternRe(input);
    if (!re) return;
    var v = input.value;
    var out = "";
    for (var i = 0; i < v.length; i++) {
      if (re.test(v[i])) out += v[i];
    }
    if (out !== v) input.value = out;
  }

  function render(input) {
    var root = input.closest('[data-slot="input-otp"]');
    if (!root) return;
    filterValue(input);

    var value = input.value;
    var max = parseInt(input.getAttribute("maxlength"), 10) || value.length;
    var focused = document.activeElement === input;
    var selStart = input.selectionStart;
    var selEnd = input.selectionEnd;
    var collapsed = selStart === selEnd;

    // Caret son slot'un dışına taşarsa son slot'u aktif göster.
    var caretIdx = collapsed && selStart === max ? max - 1 : selStart;

    var slots = root.querySelectorAll('[data-slot="input-otp-slot"]');
    slots.forEach(function (slot) {
      var idx = parseInt(slot.getAttribute("data-index"), 10);
      var ch = idx < value.length ? value[idx] : "";

      var valueEl = slot.querySelector('[data-slot="input-otp-slot-value"]');
      if (valueEl && valueEl.textContent !== ch) valueEl.textContent = ch;
      slot.setAttribute("data-filled", ch !== "" ? "true" : "false");

      var active = false;
      if (focused) {
        active = collapsed ? idx === caretIdx : idx >= selStart && idx < selEnd;
      }
      slot.setAttribute("data-active", active ? "true" : "false");

      var caret = slot.querySelector('[data-slot="input-otp-caret"]');
      if (caret) {
        if (active && ch === "" && collapsed) caret.removeAttribute("hidden");
        else caret.setAttribute("hidden", "");
      }
    });
  }

  function handle(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var input = t.closest('[data-slot="input-otp-input"]');
    if (!input) return;
    render(input);
  }

  // focus/blur kabarcıklanmaz → capture fazında dinle.
  ["input", "focus", "blur", "keyup", "keydown", "click", "pointerup", "select"].forEach(
    function (ev) {
      document.addEventListener(ev, handle, true);
    }
  );

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('[data-slot="input-otp-input"]').forEach(render);
  });
})();
