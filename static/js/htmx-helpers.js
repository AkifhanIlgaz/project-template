// Attaches the CSRF token (rendered server-side into a <meta name="csrf-token">
// tag by internal/shared/layout) to every htmx request, so unsafe requests
// pass internal/platform/csrf's header-only extractor.
document.addEventListener("htmx:configRequest", function (event) {
	var meta = document.querySelector('meta[name="csrf-token"]');
	if (meta) {
		event.detail.headers["X-Csrf-Token"] = meta.content;
	}
});
