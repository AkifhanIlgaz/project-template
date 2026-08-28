// Package dashboard demonstrates the authenticated sidebar+navbar shell
// (internal/shared/layout.Dashboard): a handful of pages behind
// middleware.AuthenticatedLayout so cloning this template starts with a
// worked example of protected dashboard routes and sidebar navigation.
package dashboard

import (
	"fmt"

	"github.com/AkifhanIlgaz/project-template/internal/features/dashboard/views"
	"github.com/AkifhanIlgaz/project-template/internal/platform/csrf"
	"github.com/AkifhanIlgaz/project-template/internal/platform/session"
	"github.com/AkifhanIlgaz/project-template/internal/shared/htmx"
	"github.com/AkifhanIlgaz/project-template/internal/shared/layout"
	"github.com/AkifhanIlgaz/project-template/internal/shared/middleware"
	"github.com/a-h/templ"
	"github.com/gofiber/fiber/v3"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) RegisterRoutes(app *fiber.App) {
	guard := middleware.AuthenticatedLayout()

	app.Get("/dashboard", guard, h.Dashboard)
	app.Get("/dashboard/reports", guard, h.Reports)
	app.Get("/dashboard/orders", guard, h.page("Siparişler"))
	app.Get("/dashboard/orders/pending", guard, h.page("Beklemede", layout.Crumb{Label: "Siparişler", Href: "/dashboard/orders"}))
	app.Get("/dashboard/customers", guard, h.Customers)
	app.Get("/dashboard/settings", guard, h.Settings)
	app.Post("/dashboard/settings", guard, h.SaveSettings)
}

func (h *Handler) Dashboard(c fiber.Ctx) error {
	u, _ := session.GetCurrentUser(c)

	return render(c, views.Dashboard(u, c.Path(), csrf.Token(c)))
}

func (h *Handler) Reports(c fiber.Ctx) error {
	u, _ := session.GetCurrentUser(c)

	return render(c, views.Reports(u, c.Path(), csrf.Token(c)))
}

func (h *Handler) Customers(c fiber.Ctx) error {
	u, _ := session.GetCurrentUser(c)

	return render(c, views.Customers(u, c.Path(), csrf.Token(c)))
}

func (h *Handler) Settings(c fiber.Ctx) error {
	u, _ := session.GetCurrentUser(c)

	return render(c, views.Settings(u, c.Path(), csrf.Token(c)))
}

// SaveSettings demonstrates internal/shared/htmx.Toast: nothing is actually
// persisted, it just shows how a POST hands back a toast instead of a body.
func (h *Handler) SaveSettings(c fiber.Ctx) error {
	err := htmx.Toast(c, htmx.ToastOptions{
		Title:       "Ayarlar kaydedildi",
		Description: "Bildirim tercihlerin güncellendi.",
		Variant:     htmx.ToastSuccess,
	})
	if err != nil {
		return fmt.Errorf("dashboard: save settings toast: %w", err)
	}

	return nil
}

// page returns a handler for one of the demo pages in views.navItems:
// title becomes both the <title> and the active breadcrumb, and ancestors
// (e.g. "Siparişler" above "Beklemede") are given as parents in order.
func (h *Handler) page(title string, parents ...layout.Crumb) fiber.Handler {
	return func(c fiber.Ctx) error {
		u, _ := session.GetCurrentUser(c)

		trail := append([]layout.Crumb{{Label: "Panel", Href: "/dashboard"}}, parents...)
		trail = append(trail, layout.Crumb{Label: title})

		return render(c, views.Placeholder(u, c.Path(), csrf.Token(c), title, trail))
	}
}

func render(c fiber.Ctx, component templ.Component) error {
	c.Set(fiber.HeaderContentType, fiber.MIMETextHTMLCharsetUTF8)
	return component.Render(c.Context(), c.Response().BodyWriter())
}
