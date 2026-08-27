// Package session wires Fiber's session middleware to Redis-backed storage
// and defines the shape of what this app keeps in a session.
package session

import (
	"slices"

	"github.com/AkifhanIlgaz/project-template/internal/config"
	"github.com/gofiber/fiber/v3"
	fsession "github.com/gofiber/fiber/v3/middleware/session"
	"github.com/gofiber/storage/redis/v3"
	"go.mongodb.org/mongo-driver/v2/bson"
)

const userKey = "user"

// User is the snapshot stored in the session on login: enough to render
// nav/UI and authorize requests without a Mongo round-trip on every request.
// ID mirrors the Mongo _id of the persisted user record.
type User struct {
	ID    bson.ObjectID
	Email string
	Roles []string
}

func (u User) HasRole(role string) bool {
	return slices.Contains(u.Roles, role)
}

// NewStore builds the session store backed by Redis.
func NewStore(cfg config.Config) *fsession.Store {
	storage := redis.New(redis.Config{
		URL: cfg.Redis.URL,
	})

	store := fsession.NewStore(fsession.Config{
		Storage:           storage,
		IdleTimeout:       cfg.Session.Idle,
		CookieSecure:      cfg.IsProduction(),
		CookieHTTPOnly:    true,
		CookieSameSite:    "Lax",
		CookieSessionOnly: false,
	})

	store.RegisterType(User{})

	return store
}

// New returns the Fiber middleware that loads/saves the session on every request.
func New(store *fsession.Store) fiber.Handler {
	return fsession.New(fsession.Config{Store: store})
}

// Get returns the logged-in user snapshot for the current request, if any.
func GetCurrentUser(c fiber.Ctx) (User, bool) {
	sess := fsession.FromContext(c)
	if sess == nil {
		return User{}, false
	}

	u, ok := sess.Get(userKey).(User)

	return u, ok
}

// Login stores the user snapshot in the session, regenerating the session ID
// first to prevent session fixation.
func Login(c fiber.Ctx, u User) error {
	sess := fsession.FromContext(c)
	if sess == nil {
		return fsession.ErrEmptySessionID
	}

	if err := sess.Regenerate(); err != nil {
		return err
	}

	sess.Set(userKey, u)

	return nil
}

// Logout destroys the current session.
func Logout(c fiber.Ctx) error {
	sess := fsession.FromContext(c)
	if sess == nil {
		return nil
	}

	return sess.Destroy()
}
