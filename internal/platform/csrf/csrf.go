// Package csrf wires Fiber's CSRF middleware to the app's own session store,
// so the CSRF token lives in the same Redis-backed session record as the
// logged-in user snapshot rather than a separate cookie/storage.
//
// The app is entirely HTMX-driven: every unsafe request goes through
// htmx, and a small client-side script (see internal/shared/layout)
// attaches the token as the X-Csrf-Token header on every htmx request. There
// are no plain <form> submissions, so only the header extractor is needed —
// no hidden form inputs anywhere.
package csrf

import (
	"github.com/AkifhanIlgaz/project-template/internal/config"
	"github.com/gofiber/fiber/v3"
	fcsrf "github.com/gofiber/fiber/v3/middleware/csrf"
	fsession "github.com/gofiber/fiber/v3/middleware/session"
)

// New returns the Fiber middleware that issues/validates CSRF tokens,
// bound to the given session store.
func New(cfg config.Config, store *fsession.Store) fiber.Handler {
	// The __Host- prefix is a browser-enforced guarantee that the cookie was
	// set by this exact host over HTTPS (no Domain attribute, Path=/) — but
	// browsers only honor it on Secure cookies, so it only applies once
	// CookieSecure is true in production.
	cookieName := "csrf_"
	if cfg.IsProduction() {
		cookieName = "__Host-csrf"
	}

	return fcsrf.New(fcsrf.Config{
		Session:        store,
		CookieName:     cookieName,
		CookieSecure:   cfg.IsProduction(),
		CookieHTTPOnly: true,
		CookieSameSite: "Lax",
		TrustedOrigins: []string{cfg.Server.BaseURL},
	})
}

// Token returns the current request's CSRF token, for embedding in the
// page (e.g. a <meta name="csrf-token"> tag) so client-side JS can attach
// it to htmx requests.
func Token(c fiber.Ctx) string {
	return fcsrf.TokenFromContext(c)
}

// Rotate discards the current CSRF token so a fresh one is issued on the
// next request. Call this right after an authentication state change
// (login/logout) so a token observed before authentication can't be reused
// after it — the doc-recommended practice of regenerating CSRF tokens
// alongside session regeneration.
func Rotate(c fiber.Ctx) error {
	h := fcsrf.HandlerFromContext(c)
	if h == nil {
		return nil
	}

	return h.DeleteToken(c)
}
