// TagGroup: React Aria TagGroup davranışının portu. Seçim DOM'da tutulur
// (data-selected); kaldırma butonu etiketi DOM'dan siler. selectionMode
// (none/single/multiple) list'in data-selection-mode'undan okunur. document'a
// delege edilir; htmx swap'lerinden sonra da çalışır.

function tagGroupSet(tag, selected) {
  if (selected) {
    tag.setAttribute("data-selected", "true");
    tag.setAttribute("aria-selected", "true");
  } else {
    tag.removeAttribute("data-selected");
    tag.setAttribute("aria-selected", "false");
  }
}

document.addEventListener("click", function (e) {
  if (!e.target.closest) return;

  // Kaldırma butonu: etiketi sil, seçime düşme.
  var removeBtn = e.target.closest('[data-slot="tag-remove-button"]');
  if (removeBtn) {
    e.stopPropagation();
    var toRemove = removeBtn.closest('[data-slot="tag"]');
    if (toRemove) toRemove.remove();
    return;
  }

  var tag = e.target.closest('[data-slot="tag"]');
  if (!tag || tag.getAttribute("data-disabled") === "true") return;
  var list = tag.closest('[data-slot="tag-group-list"]');
  if (!list) return;

  var mode = list.getAttribute("data-selection-mode") || "none";
  if (mode === "none") return;

  var selected = tag.getAttribute("data-selected") === "true";
  if (mode === "single") {
    if (selected) {
      tagGroupSet(tag, false);
      return;
    }
    list.querySelectorAll('[data-slot="tag"]').forEach(function (other) {
      tagGroupSet(other, other === tag);
    });
  } else {
    tagGroupSet(tag, !selected);
  }
});

// Enter/Space ile seçim (klavye erişilebilirliği).
document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter" && e.key !== " ") return;
  var tag = e.target.closest && e.target.closest('[data-slot="tag"]');
  if (!tag || !tag.getAttribute("role")) return;
  e.preventDefault();
  tag.click();
});
