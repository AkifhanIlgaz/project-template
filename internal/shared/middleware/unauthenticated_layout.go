package middleware

import (
	"github.com/AkifhanIlgaz/project-template/internal/platform/session"
	"github.com/gofiber/fiber/v3"
)

// UnauthenticatedLayout guards routes meant only for signed-out visitors
// (e.g. /login), redirecting an already-logged-in user to /me instead of
// re-rendering the page.
func UnauthenticatedLayout() fiber.Handler {
	return func(c fiber.Ctx) error {
		if _, ok := session.GetCurrentUser(c); ok {
			return c.Redirect().To("/me")
		}

		return c.Next()
	}
}
