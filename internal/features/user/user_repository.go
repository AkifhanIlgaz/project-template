package user

import (
	"context"
	"errors"
	"fmt"
	"time"

	db "github.com/AkifhanIlgaz/project-template/internal/platform/mongo"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const collectionName = "users"

type Repository interface {
	EnsureIndexes(ctx context.Context) error
	FindByID(ctx context.Context, id bson.ObjectID) (User, error)
	FindByEmail(ctx context.Context, email string) (User, error)
	Upsert(ctx context.Context, email, name, avatarURL string) (User, error)
}

type mongoRepository struct {
	collection *mongo.Collection
}

func NewRepository(client *db.Client) Repository {
	return &mongoRepository{
		collection: client.Database().Collection(collectionName),
	}
}

// EnsureIndexes creates the unique index on email. Call once at startup.
func (r *mongoRepository) EnsureIndexes(ctx context.Context) error {
	idx := mongo.IndexModel{
		Keys: bson.D{
			{Key: "email", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	}

	_, err := r.collection.Indexes().CreateOne(ctx, idx)
	if err != nil {
		return fmt.Errorf("user: ensure indexes: %w", err)
	}

	return nil
}

func (r *mongoRepository) FindByID(ctx context.Context, id bson.ObjectID) (User, error) {
	var u User

	filter := bson.M{
		"_id": id,
	}

	err := r.collection.FindOne(ctx, filter).Decode(&u)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return User{}, ErrNotFound
		}

		return User{}, fmt.Errorf("user: find by id: %w", err)
	}

	return u, nil
}

func (r *mongoRepository) FindByEmail(ctx context.Context, email string) (User, error) {
	var u User

	filter := bson.M{
		"email": email,
	}

	err := r.collection.FindOne(ctx, filter).Decode(&u)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return User{}, ErrNotFound
		}

		return User{}, fmt.Errorf("user: find by email: %w", err)
	}

	return u, nil
}

// Upsert creates the user on first login, or updates name/avatar on
// subsequent logins — email is the stable key Google OAuth gives us.
// Roles is left untouched on update: role changes are managed separately,
// not overwritten by whatever Google returns.
func (r *mongoRepository) Upsert(ctx context.Context, email, name, avatarURL string) (User, error) {
	var u User

	now := time.Now()

	filter := bson.M{
		"email": email,
	}

	update := bson.M{
		"$set": bson.M{
			"name":       name,
			"avatar_url": avatarURL,
			"updated_at": now,
		},
		"$setOnInsert": bson.M{
			"email":      email,
			"roles":      []string{},
			"created_at": now,
		},
	}

	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)

	err := r.collection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&u)
	if err != nil {
		return User{}, fmt.Errorf("user: upsert: %w", err)
	}

	return u, nil
}
