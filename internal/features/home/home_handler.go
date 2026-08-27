// Package home holds the throwaway pages used to manually exercise the
// Google OAuth flow end to end: a login link and a page that shows the
// logged-in user's session snapshot.
package home

import (
	"github.com/AkifhanIlgaz/project-template/internal/features/home/views"
	"github.com/AkifhanIlgaz/project-template/internal/platform/csrf"
	"github.com/AkifhanIlgaz/project-template/internal/platform/session"
	"github.com/a-h/templ"
	"github.com/gofiber/fiber/v3"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) RegisterRoutes(app *fiber.App) {
	app.Get("/login", h.Login)
	app.Get("/me", h.Me)
}

func (h *Handler) Login(c fiber.Ctx) error {
	return render(c, views.Login(csrf.Token(c)))
}

func (h *Handler) Me(c fiber.Ctx) error {
	u, ok := session.GetCurrentUser(c)
	if !ok {
		return c.Redirect().To("/login")
	}

	return render(c, views.Me(u, csrf.Token(c)))
}

func render(c fiber.Ctx, component templ.Component) error {
	c.Set(fiber.HeaderContentType, fiber.MIMETextHTMLCharsetUTF8)
	return component.Render(c.Context(), c.Response().BodyWriter())
}
