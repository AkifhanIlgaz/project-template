package auth

import (
	"fmt"
	"net/http"

	"github.com/AkifhanIlgaz/project-template/internal/config"
	"github.com/AkifhanIlgaz/project-template/internal/features/user"
	"github.com/AkifhanIlgaz/project-template/internal/platform/csrf"
	"github.com/AkifhanIlgaz/project-template/internal/platform/session"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/adaptor"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
)

type AuthHandler struct {
	users user.Repository
}

func NewAuthHandler(users user.Repository) *AuthHandler {
	return &AuthHandler{users: users}
}

// RegisterProviders points gothic at its own short-lived cookie store for the
// OAuth handshake state — separate from the app's Redis-backed session store,
// since the handshake never outlives the redirect round-trip.
func (h *AuthHandler) RegisterProviders(cfg config.Config) {
	const handshakeMaxAge = 10 * 60 // the handshake never outlives the redirect round-trip

	store := sessions.NewCookieStore([]byte(cfg.Session.GothicSecret))
	store.MaxAge(handshakeMaxAge)
	store.Options.Path = "/"
	store.Options.HttpOnly = true
	store.Options.Secure = cfg.IsProduction()
	// gorilla/sessions defaults new cookie stores to SameSite=None, which
	// browsers silently drop unless Secure is also true — breaking the
	// handshake entirely over plain http in dev. Match the app's other
	// cookies (session, csrf) at Lax instead.
	store.Options.SameSite = http.SameSiteLaxMode

	gothic.Store = store

	goth.UseProviders(google.New(cfg.Google.ClientID, cfg.Google.ClientSecret, cfg.Google.CallbackURL))
}

func (h *AuthHandler) RegisterRoutes(app *fiber.App) {
	authRoute := app.Group("/auth")

	authRoute.Get("/:provider", h.Login)
	authRoute.Get("/:provider/callback", h.Callback)
	authRoute.Post("/logout", h.Logout)
}

// Login and Callback take the provider from Fiber's :provider route param
// (c.Params) rather than r.PathValue: the request handed to the wrapped
// net/http handler is built by fasthttpadaptor.ConvertRequest, which never
// populates http.Request's ServeMux-only PathValue data. The provider name
// only reaches gothic through the query string it injects here.
func (h *AuthHandler) Login(c fiber.Ctx) error {
	provider := c.Params("provider")

	return adaptor.HTTPHandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		q.Add("provider", provider)
		r.URL.RawQuery = q.Encode()

		gothic.BeginAuthHandler(w, r)
	})(c)
}

// Callback completes the OAuth handshake, then upserts the provider's user
// info into Mongo and logs the app in via its own Redis-backed session —
// entirely separate from gothic's short-lived handshake cookie, which
// gothic.CompleteUserAuth already clears on success.
func (h *AuthHandler) Callback(c fiber.Ctx) error {
	provider := c.Params("provider")

	var gothUser goth.User
	var authErr error

	err := adaptor.HTTPHandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		q.Add("provider", provider)
		r.URL.RawQuery = q.Encode()

		gothUser, authErr = gothic.CompleteUserAuth(w, r)
	})(c)
	if err != nil {
		return err
	}
	if authErr != nil {
		return fmt.Errorf("auth: complete user auth: %w", authErr)
	}

	u, err := h.users.Upsert(c.Context(), gothUser.Email, gothUser.Name, gothUser.AvatarURL)
	if err != nil {
		return fmt.Errorf("auth: upsert user: %w", err)
	}

	sessUser := session.User{ID: u.ID, Email: u.Email, Roles: u.Roles}
	if err := session.Login(c, sessUser); err != nil {
		return fmt.Errorf("auth: login: %w", err)
	}

	// A CSRF token observed before authentication must not be reusable
	// after it — regenerate alongside the session.
	if err := csrf.Rotate(c); err != nil {
		return fmt.Errorf("auth: rotate csrf: %w", err)
	}

	return c.Redirect().To("/me")
}

// Logout is a POST since it has a side effect (destroying the session), and
// so it's called via hx-post from the Me page. htmx follows a plain 3xx
// redirect via XHR and swaps the target page's body in as a fragment, which
// renders wrong for a full page like Login — the HX-Redirect header instead
// tells htmx to do a real browser navigation.
func (h *AuthHandler) Logout(c fiber.Ctx) error {
	if err := session.Logout(c); err != nil {
		return fmt.Errorf("auth: logout: %w", err)
	}

	if err := csrf.Rotate(c); err != nil {
		return fmt.Errorf("auth: rotate csrf: %w", err)
	}

	if c.Get("HX-Request") == "true" {
		c.Set("HX-Redirect", "/login")
		return nil
	}

	return c.Redirect().To("/login")
}
