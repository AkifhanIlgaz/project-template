// Command server runs the application's HTTP server.
package main

import (
	"context"
	"log"

	"github.com/AkifhanIlgaz/project-template/internal/config"
	"github.com/AkifhanIlgaz/project-template/internal/features/auth"
	"github.com/AkifhanIlgaz/project-template/internal/features/home"
	"github.com/AkifhanIlgaz/project-template/internal/features/user"
	"github.com/AkifhanIlgaz/project-template/internal/platform/csrf"
	db "github.com/AkifhanIlgaz/project-template/internal/platform/mongo"
	"github.com/AkifhanIlgaz/project-template/internal/platform/session"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config.Load: %v", err)
	}

	ctx := context.Background()

	mongoClient, err := db.Connect(ctx, cfg.Mongo)
	if err != nil {
		log.Fatalf("mongo.Connect: %v", err)
	}
	defer func() {
		if err := mongoClient.Disconnect(ctx); err != nil {
			log.Printf("mongo.Disconnect: %v", err)
		}
	}()

	users := user.NewRepository(mongoClient)
	if err := users.EnsureIndexes(ctx); err != nil {
		log.Fatalf("users.EnsureIndexes: %v", err)
	}

	authHandler := auth.NewAuthHandler(users)
	authHandler.RegisterProviders(cfg)

	sessionStore := session.NewStore(cfg)

	app := fiber.New()
	app.Use(logger.New())
	app.Use(session.New(sessionStore))
	app.Use(csrf.New(cfg, sessionStore))

	app.Get("/healthz", func(c fiber.Ctx) error {
		return c.SendString("ok")
	})

	authHandler.RegisterRoutes(app)
	home.NewHandler().RegisterRoutes(app)

	if err := app.Listen(":" + cfg.Server.Port); err != nil {
		log.Fatalf("app.Listen: %v", err)
	}
}
