// ListBox: React Aria seçim davranışının karşılığı (aria-selected +
// data-selected + checkmark stroke-dashoffset animasyonu).

function setListBoxItemSelected(item, selected) {
  item.setAttribute("aria-selected", String(selected));
  if (selected) {
    item.setAttribute("data-selected", "true");
  } else {
    item.removeAttribute("data-selected");
  }
  var indicator = item.querySelector('[data-slot="list-box-item-indicator"]');
  if (!indicator) return;
  if (selected) {
    indicator.setAttribute("data-visible", "true");
  } else {
    indicator.removeAttribute("data-visible");
  }
  var check = indicator.querySelector('[data-slot="list-box-item-indicator--checkmark"]');
  if (check) check.setAttribute("stroke-dashoffset", selected ? "44" : "66");
}

document.addEventListener("click", function (e) {
  var item = e.target.closest('[data-slot="list-box-item"]');
  if (!item || item.getAttribute("data-disabled") === "true") return;
  var listBox = item.closest('[data-slot="list-box"]');
  if (!listBox) return;
  var mode = listBox.getAttribute("data-selection-mode");
  if (mode === "single") {
    listBox.querySelectorAll('[data-slot="list-box-item"]').forEach(function (other) {
      if (other !== item) setListBoxItemSelected(other, false);
    });
    setListBoxItemSelected(item, true);
  } else if (mode === "multiple") {
    setListBoxItemSelected(item, item.getAttribute("data-selected") !== "true");
  }
});
