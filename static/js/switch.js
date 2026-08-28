// Switch: native input değişimini root'un data-selected'ine yansıtır (React
// Aria state'inin karşılığı). Thumb konumu ve renkler CSS'te
// .switch[data-selected="true"] üzerinden sürülür.
document.addEventListener("change", function (e) {
  var input = e.target;
  if (!input.matches || !input.matches('[data-slot="switch"] input[type="checkbox"]')) return;
  var root = input.closest('[data-slot="switch"]');
  if (input.checked) {
    root.setAttribute("data-selected", "true");
  } else {
    root.setAttribute("data-selected", "false");
  }
});
