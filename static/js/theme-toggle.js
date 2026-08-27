// Applies the stored/system theme immediately (this script must load in
// <head> without defer/async) so there's no flash of the wrong theme, then
// delegates clicks on [data-theme-toggle] to flip and persist it.
(function () {
	function storedTheme() {
		try {
			return localStorage.getItem("theme");
		} catch (e) {
			return null;
		}
	}

	function systemTheme() {
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}

	function applyTheme(theme) {
		document.documentElement.setAttribute("data-theme", theme);
	}

	applyTheme(storedTheme() || systemTheme());

	document.addEventListener("click", function (event) {
		var toggle = event.target.closest("[data-theme-toggle]");
		if (!toggle) {
			return;
		}

		var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
		applyTheme(next);

		try {
			localStorage.setItem("theme", next);
		} catch (e) {
			// Storage unavailable (private mode, disabled) — the choice just
			// won't survive a reload.
		}
	});
})();
