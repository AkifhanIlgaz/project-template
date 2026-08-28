// Package middleware holds route-group guards that decide whether a
// request may reach its handler based on session auth state.
package middleware

import (
	"github.com/AkifhanIlgaz/project-template/internal/platform/session"
	"github.com/gofiber/fiber/v3"
)

// AuthenticatedLayout guards routes that require a logged-in user,
// redirecting anonymous requests to /login. When roles are given, the
// user must hold at least one of them or the request is rejected with
// 403 — pass none to only require being logged in.
func AuthenticatedLayout(roles ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		u, ok := session.GetCurrentUser(c)
		if !ok {
			return c.Redirect().To("/login")
		}

		if len(roles) > 0 && !hasAnyRole(u, roles) {
			return c.SendStatus(fiber.StatusForbidden)
		}

		return c.Next()
	}
}

func hasAnyRole(u session.User, roles []string) bool {
	for _, role := range roles {
		if u.HasRole(role) {
			return true
		}
	}

	return false
}
