// Package logging builds the application's structured logger: colored,
// human-readable output in development (via lmittmann/tint) and JSON on
// stdout in production, so a container log collector can parse it directly.
package logging

import (
	"log/slog"
	"os"
	"time"

	"github.com/AkifhanIlgaz/project-template/internal/config"
	"github.com/lmittmann/tint"
)

// New builds the application logger from cfg.Env and cfg.Log.Level. It does
// not call slog.SetDefault — the caller decides whether package-level
// slog.* calls should route through the returned logger.
func New(cfg config.Config) *slog.Logger {
	level := parseLevel(cfg.Log.Level)

	if cfg.IsProduction() {
		return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level:     level,
			AddSource: true,
		}))
	}

	return slog.New(tint.NewTextHandler(os.Stdout, &tint.Options{
		Level:      level,
		TimeFormat: time.Kitchen,
	}))
}

// parseLevel falls back to Info for an empty or unrecognized cfg.Log.Level
// rather than failing startup over a typo in config.yaml.
func parseLevel(level string) slog.Level {
	var l slog.Level
	if err := l.UnmarshalText([]byte(level)); err != nil {
		return slog.LevelInfo
	}
	return l
}
