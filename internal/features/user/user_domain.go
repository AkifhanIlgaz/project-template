// Package user is the user feature slice: the persisted user record and its
// Mongo-backed repository.
package user

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// User is the persisted record for an account, keyed by Email (the stable
// identifier Google OAuth gives us).
type User struct {
	ID        bson.ObjectID `bson:"_id,omitempty"`
	Email     string        `bson:"email"`
	Name      string        `bson:"name"`
	AvatarURL string        `bson:"avatar_url"`
	Roles     []string      `bson:"roles"`
	CreatedAt time.Time     `bson:"created_at"`
	UpdatedAt time.Time     `bson:"updated_at"`
}
