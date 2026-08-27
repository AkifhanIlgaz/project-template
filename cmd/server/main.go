// Command server runs the application's HTTP server.
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/AkifhanIlgaz/project-template/internal/config"
	"github.com/AkifhanIlgaz/project-template/internal/features/auth"
	"github.com/AkifhanIlgaz/project-template/internal/features/home"
	"github.com/AkifhanIlgaz/project-template/internal/features/user"
	"github.com/AkifhanIlgaz/project-template/internal/platform/csrf"
	db "github.com/AkifhanIlgaz/project-template/internal/platform/mongo"
	"github.com/AkifhanIlgaz/project-template/internal/platform/session"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/static"
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
	app.Use("/static", static.New("./static"))

	app.Get("/healthz", func(c fiber.Ctx) error {
		return c.SendString("ok")
	})

	authHandler.RegisterRoutes(app)
	home.NewHandler().RegisterRoutes(app)

	go func() {
		if err := app.Listen(":" + cfg.Server.Port); err != nil {
			log.Fatalf("app.Listen: %v", err)
		}
	}()

	// air (and any other process manager) sends SIGINT/SIGTERM on rebuild
	// and expects the port back — without this, app.Listen never returns,
	// the process lingers past its parent, and the next build fails with
	// "address already in use".
	shutdownCtx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()
	<-shutdownCtx.Done()
	stop()

	if err := app.ShutdownWithTimeout(5 * time.Second); err != nil {
		log.Printf("app.Shutdown: %v", err)
	}
}
