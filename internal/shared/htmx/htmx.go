// Package htmx holds small server-side helpers for reacting to htmx
// requests — currently just enough to redirect correctly whether a request
// came from htmx or a plain browser. Add more headers/helpers here as the
// app actually needs them (HX-Trigger, HX-Retarget, HX-Reswap, ...).
package htmx

import "github.com/gofiber/fiber/v3"

const (
	// HeaderRequest is set by htmx on every request it makes.
	HeaderRequest = "HX-Request"
	// HeaderRedirect tells htmx to navigate the browser to a new URL,
	// instead of swapping the response into the current page.
	HeaderRedirect = "HX-Redirect"
)

// IsRequest reports whether the current request was made by htmx.
func IsRequest(c fiber.Ctx) bool {
	return c.Get(HeaderRequest) == "true"
}

// Redirect sends the client to location. For an htmx request this sets
// HX-Redirect so the browser does a real navigation — htmx otherwise follows
// a plain 3xx via XHR and swaps the target page's HTML into the current one,
// which renders wrong for a full page like a login screen.
func Redirect(c fiber.Ctx, location string) error {
	if IsRequest(c) {
		c.Set(HeaderRedirect, location)
		return nil
	}

	return c.Redirect().To(location)
}
