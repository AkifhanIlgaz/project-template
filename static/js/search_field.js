// SearchField: React Aria SearchField davranışının karşılığı. Giriş boşken
// temizle butonu gizlenir (root'ta data-empty). Temizle butonu girişi boşaltır
// ve 'input' event'i tetikler ki Autocomplete gibi tüketiciler filtreyi
// güncelleyebilsin. Controlled state yoktur; değer DOM input'unda tutulur.

function searchFieldSyncEmpty(input) {
  var root = input.closest('[data-slot="search-field"]');
  if (!root) return;
  if (input.value === "") {
    root.setAttribute("data-empty", "true");
  } else {
    root.removeAttribute("data-empty");
  }
}

document.addEventListener("input", function (e) {
  var input = e.target.closest('[data-slot="search-field-input"]');
  if (!input) return;
  searchFieldSyncEmpty(input);
});

document.addEventListener("click", function (e) {
  var clear = e.target.closest('[data-slot="search-field-clear-button"]');
  if (!clear) return;
  var root = clear.closest('[data-slot="search-field"]');
  if (!root) return;
  var input = root.querySelector('[data-slot="search-field-input"]');
  if (!input) return;
  input.value = "";
  searchFieldSyncEmpty(input);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
});

document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelectorAll('[data-slot="search-field-input"]')
    .forEach(searchFieldSyncEmpty);
});
