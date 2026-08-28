// Package config loads application configuration from config.yaml, with
// environment variables able to override individual secret fields.
package config

import (
	"errors"
	"fmt"
	"time"

	"github.com/spf13/viper"
)

type Env string

const (
	EnvDevelopment Env = "development"
	EnvProduction  Env = "production"
)

type Config struct {
	Env     Env           `mapstructure:"env"`
	Log     LogConfig     `mapstructure:"log"`
	Server  ServerConfig  `mapstructure:"server"`
	Mongo   MongoConfig   `mapstructure:"mongo"`
	Redis   RedisConfig   `mapstructure:"redis"`
	Session SessionConfig `mapstructure:"session"`
	Google  GoogleConfig  `mapstructure:"google"`
}

type LogConfig struct {
	// Level is a slog.Level name (debug, info, warn, error), case-insensitive.
	// An empty or unrecognized value falls back to info — see
	// internal/platform/logging.
	Level string `mapstructure:"level"`
}

type ServerConfig struct {
	Port    string `mapstructure:"port"`
	BaseURL string `mapstructure:"base_url"`
}

type MongoConfig struct {
	URI string `mapstructure:"uri"`
	DB  string `mapstructure:"db"`
}

type RedisConfig struct {
	// URL is the standard redis:// connection string: redis://<user>:<pass>@host:port/<db>
	URL string `mapstructure:"url"`
}

type SessionConfig struct {
	// Secret signs/encrypts the session cookie. Generate with: openssl rand -base64 32
	Secret string `mapstructure:"secret"`
	// Idle is how long a session survives without activity before expiring.
	Idle         time.Duration `mapstructure:"idle"`
	GothicSecret string        `mapstructure:"gothic_secret"`
}

type GoogleConfig struct {
	ClientID     string `mapstructure:"client_id"`
	ClientSecret string `mapstructure:"client_secret"`
	CallbackURL  string `mapstructure:"callback_url"`
}

func (c Config) IsProduction() bool {
	return c.Env == EnvProduction
}

// Load reads config.yaml from the working directory (local dev) and layers
// environment variables on top for secrets — in production there is no
// config.yaml at all, and every value below comes from real env vars.
func Load() (Config, error) {
	v := viper.New()
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")

	v.SetDefault("env", string(EnvDevelopment))
	v.SetDefault("log.level", "info")
	v.SetDefault("server.port", "3000")
	v.SetDefault("server.base_url", "http://localhost:3000")
	v.SetDefault("mongo.uri", "mongodb://localhost:27017")
	v.SetDefault("mongo.db", "project-template")
	v.SetDefault("redis.url", "redis://localhost:6379/0")
	v.SetDefault("session.idle", "168h") // 7 days

	// Secrets have no default: bind them explicitly to env vars so
	// production can set SESSION_SECRET / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
	// without ever needing a config.yaml on disk.
	mustBindEnv(v, "env", "APP_ENV")
	mustBindEnv(v, "log.level", "LOG_LEVEL")
	mustBindEnv(v, "server.port", "PORT")
	mustBindEnv(v, "server.base_url", "BASE_URL")
	mustBindEnv(v, "mongo.uri", "MONGO_URI")
	mustBindEnv(v, "mongo.db", "MONGO_DB")
	mustBindEnv(v, "redis.url", "REDIS_URL")
	mustBindEnv(v, "session.secret", "SESSION_SECRET")
	mustBindEnv(v, "session.idle", "SESSION_IDLE")
	mustBindEnv(v, "session.gothic_secret", "GOTHIC_SECRET")
	mustBindEnv(v, "google.client_id", "GOOGLE_CLIENT_ID")
	mustBindEnv(v, "google.client_secret", "GOOGLE_CLIENT_SECRET")
	mustBindEnv(v, "google.callback_url", "GOOGLE_CALLBACK_URL")

	if err := v.ReadInConfig(); err != nil {
		var notFound viper.ConfigFileNotFoundError
		if !errors.As(err, &notFound) {
			return Config{}, fmt.Errorf("config: read config.yaml: %w", err)
		}
		// Missing config.yaml is expected in production.
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return Config{}, fmt.Errorf("config: unmarshal: %w", err)
	}

	if cfg.Session.Secret == "" {
		return Config{}, fmt.Errorf("config: session.secret (SESSION_SECRET) is required")
	}

	if cfg.Session.GothicSecret == "" {
		return Config{}, fmt.Errorf("config: session.gothic_secret (GOTHIC_SECRET) is required")
	}

	if cfg.Google.ClientID == "" || cfg.Google.ClientSecret == "" || cfg.Google.CallbackURL == "" {
		return Config{}, fmt.Errorf("config: google.client_id/client_secret/callback_url (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_CALLBACK_URL) are required")
	}

	return cfg, nil
}

func mustBindEnv(v *viper.Viper, key, env string) {
	if err := v.BindEnv(key, env); err != nil {
		panic(fmt.Sprintf("config: bind env %s: %v", env, err))
	}
}
