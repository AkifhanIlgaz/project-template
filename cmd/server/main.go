// Command server runs the application's HTTP server.
package main

import (
	"log"

	"github.com/AkifhanIlgaz/project-template/internal/config"
	"github.com/gofiber/fiber/v3"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config.Load: %v", err)
	}

	app := fiber.New()

	app.Get("/healthz", func(c fiber.Ctx) error {
		return c.SendString("ok")
	})

	if err := app.Listen(":" + cfg.Server.Port); err != nil {
		log.Fatalf("app.Listen: %v", err)
	}
}
