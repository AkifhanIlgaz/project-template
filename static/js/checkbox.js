// Checkbox: native input değişimini root data attribute'larına ve
// varsayılan ikonlara yansıtır (React Aria state'inin karşılığı).
document.addEventListener("change", function (e) {
  var input = e.target;
  if (!input.matches || !input.matches('[data-slot="checkbox"] input[type="checkbox"]')) return;
  var root = input.closest('[data-slot="checkbox"]');
  // İlk etkileşimde indeterminate temizlenir (React davranışı)
  root.removeAttribute("data-indeterminate");
  if (input.checked) {
    root.setAttribute("data-selected", "true");
  } else {
    root.removeAttribute("data-selected");
  }
  var line = root.querySelector('[data-slot="checkbox-default-indicator--indeterminate"]');
  var check = root.querySelector('[data-slot="checkbox-default-indicator--checkmark"]');
  if (line) line.setAttribute("hidden", "");
  if (check) {
    check.removeAttribute("hidden");
    check.setAttribute("stroke-dashoffset", input.checked ? "44" : "66");
  }
});
