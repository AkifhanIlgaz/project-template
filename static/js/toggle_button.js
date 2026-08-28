// ToggleButton: React Aria ToggleButton/ToggleButtonGroup davranışının portu.
// Seçili durum DOM'da tutulur (data-selected + aria-pressed); click ile toggle
// edilir. Group içindeyken data-selection-mode (single/multiple) ve
// data-disallow-empty-selection'a göre tekil/çoklu seçim uygulanır.
// document'a delege edilir; htmx swap'lerinden sonra da çalışır.

function toggleButtonSet(btn, selected) {
  if (selected) {
    btn.setAttribute("data-selected", "true");
  } else {
    btn.removeAttribute("data-selected");
  }
  btn.setAttribute("aria-pressed", selected ? "true" : "false");
}

function toggleButtonIsSelected(btn) {
  return btn.getAttribute("data-selected") === "true";
}

document.addEventListener("click", function (e) {
  if (!e.target.closest) return;
  var btn = e.target.closest('[data-slot="toggle-button"]');
  if (!btn || btn.disabled) return;

  var group = btn.closest('[data-slot="toggle-button-group"]');
  if (!group) {
    // Tek başına: basit toggle.
    toggleButtonSet(btn, !toggleButtonIsSelected(btn));
    return;
  }

  var mode = group.getAttribute("data-selection-mode") || "single";
  var selected = toggleButtonIsSelected(btn);

  if (mode === "multiple") {
    toggleButtonSet(btn, !selected);
    return;
  }

  // single: en fazla bir buton seçili olabilir.
  if (selected) {
    // Zaten seçili — boş seçime izin yoksa dokunma.
    if (group.getAttribute("data-disallow-empty-selection") === "true") return;
    toggleButtonSet(btn, false);
    return;
  }
  group.querySelectorAll('[data-slot="toggle-button"]').forEach(function (other) {
    toggleButtonSet(other, other === btn);
  });
});
