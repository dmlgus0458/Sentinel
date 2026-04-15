package main

import (
	"context"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"sentinel-backend/internal/config"
	"sentinel-backend/internal/db"
	"sentinel-backend/internal/handler"
	"sentinel-backend/migrations"
	"sentinel-backend/internal/repository"
	"sentinel-backend/internal/service"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()

	// DB connection
	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL())
	if err != nil {
		log.Printf("WARNING: DB connection failed: %v", err)
	} else {
		defer pool.Close()
		log.Println("DB connected")

		// Run migrations via embedded FS (Windows/Linux/컨테이너 모두 호환)
		d, err := iofs.New(migrations.FS, ".")
		if err != nil {
			log.Printf("WARNING: migration source init failed: %v", err)
		} else {
			m, err := migrate.NewWithSourceInstance("iofs", d, cfg.DatabaseURL())
			if err != nil {
				log.Printf("WARNING: migration init failed: %v", err)
			} else {
				if err := m.Up(); err != nil && err != migrate.ErrNoChange {
					log.Printf("WARNING: migration failed: %v", err)
				} else {
					log.Println("Migrations applied")
				}
			}
		}
	}

	// Services
	hub := service.NewHub()
	go hub.Run()

	var alertRepo *repository.AlertRepo
	var notificationRepo *repository.NotificationRepo
	if pool != nil {
		alertRepo = repository.NewAlertRepo(pool)
		notificationRepo = repository.NewNotificationRepo(pool)
	}

	alertSvc := service.NewAlertService(alertRepo)
	dashboardH := handler.NewDashboardHandler(alertSvc)
	metricsSvc := service.NewMetricsService(cfg.PrometheusURL)
	notificationSvc := service.NewNotificationService(notificationRepo, cfg)

	// Handlers
	webhookH := handler.NewWebhookHandler(alertSvc, notificationSvc, hub)
	alertH := handler.NewAlertHandler(alertSvc)
	metricsH := handler.NewMetricsHandler(metricsSvc)
	streamH := handler.NewStreamHandler(hub)
	notificationH := handler.NewNotificationHandler(notificationSvc)

	// Echo
	e := echo.New()
	e.HideBanner = true

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: cfg.CORSOrigins,
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Content-Type", "Authorization"},
	}))

	// Routes
	api := e.Group("/api/v1")

	// Webhook
	api.POST("/webhook/alertmanager", webhookH.HandleAlertmanager)

	// Alerts
	api.GET("/alerts", alertH.ListAlerts)
	api.GET("/alerts/:id", alertH.GetAlert)
	api.POST("/alerts/:id/ack", alertH.AckAlert)
	api.GET("/alerts/:id/comments", alertH.ListComments)
	api.POST("/alerts/:id/comments", alertH.AddComment)

	// Dashboard
	api.GET("/dashboard/stats", dashboardH.GetStats)
	api.GET("/dashboard/heatmap", dashboardH.GetHeatmap)

	// Metrics
	api.GET("/metrics/query", metricsH.QueryInstant)
	api.GET("/metrics/query_range", metricsH.QueryRange)
	api.GET("/metrics/nodes", metricsH.GetNodes)

	// Infra Status
	api.GET("/metrics/infra-status", metricsH.GetInfraStatus)

	// SSE Stream
	api.GET("/notifications/stream", streamH.Stream)

	// Notification Settings
	api.GET("/notification-settings", notificationH.ListSettings)
	api.POST("/notification-settings", notificationH.CreateSetting)
	api.PUT("/notification-settings/:id", notificationH.UpdateSetting)
	api.DELETE("/notification-settings/:id", notificationH.DeleteSetting)

	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("Starting Sentinel Backend on %s", addr)
	if err := e.Start(addr); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
