// Package mongo wraps the mongo-driver client lifecycle for the app.
package mongo

import (
	"context"
	"fmt"
	"time"

	"github.com/AkifhanIlgaz/project-template/internal/config"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type Client struct {
	client *mongo.Client
	db     *mongo.Database
}

func Connect(ctx context.Context, config config.MongoConfig) (*Client, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(options.Client().ApplyURI(config.URI))
	if err != nil {
		return nil, fmt.Errorf("mongo: connect: %w", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("mongo: ping: %w", err)
	}

	return &Client{
		client: client,
		db:     client.Database(config.DB),
	}, nil
}

func (c *Client) Database() *mongo.Database {
	return c.db
}

func (c *Client) Disconnect(ctx context.Context) error {
	return c.client.Disconnect(ctx)
}
