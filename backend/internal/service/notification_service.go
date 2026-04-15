package service

import (
	"context"
	"fmt"
	"log"
	"net/smtp"

	"sentinel-backend/internal/config"
	"sentinel-backend/internal/model"
	"sentinel-backend/internal/repository"
)

type NotificationService struct {
	repo *repository.NotificationRepo
	cfg  *config.Config
}

func NewNotificationService(repo *repository.NotificationRepo, cfg *config.Config) *NotificationService {
	return &NotificationService{repo: repo, cfg: cfg}
}

func (s *NotificationService) ListSettings(ctx context.Context) ([]*model.NotificationSetting, error) {
	if s.repo == nil {
		return []*model.NotificationSetting{}, nil
	}
	settings, err := s.repo.ListSettings(ctx)
	if err != nil {
		return nil, err
	}
	if settings == nil {
		settings = []*model.NotificationSetting{}
	}
	return settings, nil
}

func (s *NotificationService) CreateSetting(ctx context.Context, req *model.NotificationSettingRequest) (*model.NotificationSetting, error) {
	if s.repo == nil {
		return nil, ErrNoDB
	}
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	setting := &model.NotificationSetting{
		Channel:        req.Channel,
		Target:         req.Target,
		SeverityFilter: req.SeverityFilter,
		Enabled:        enabled,
	}
	return s.repo.InsertSetting(ctx, setting)
}

func (s *NotificationService) UpdateSetting(ctx context.Context, id int64, req *model.NotificationSettingUpdateRequest) (*model.NotificationSetting, error) {
	if s.repo == nil {
		return nil, ErrNoDB
	}
	return s.repo.UpdateSetting(ctx, id, req)
}

func (s *NotificationService) DeleteSetting(ctx context.Context, id int64) error {
	if s.repo == nil {
		return ErrNoDB
	}
	return s.repo.DeleteSetting(ctx, id)
}

func (s *NotificationService) SendAlertEmail(ctx context.Context, event *model.AlertEvent) {
	if s.repo == nil {
		return
	}
	settings, err := s.repo.ListEnabledByChannel(ctx, "email")
	if err != nil {
		log.Printf("notification: list email settings error: %v", err)
		return
	}

	for _, setting := range settings {
		if !matchesSeverityFilter(setting.SeverityFilter, event.Severity) {
			continue
		}
		go s.sendEmail(setting.Target, event)
	}
}

func matchesSeverityFilter(filter []string, severity string) bool {
	if len(filter) == 0 {
		return true
	}
	for _, f := range filter {
		if f == severity {
			return true
		}
	}
	return false
}

func (s *NotificationService) sendEmail(to string, event *model.AlertEvent) {
	if s.cfg.SMTPHost == "" {
		log.Printf("notification: SMTP_HOST not configured, skipping email to %s", to)
		return
	}

	subject := fmt.Sprintf("[Sentinel] %s - %s (%s)", event.Severity, event.AlertName, event.Status)
	body := fmt.Sprintf("Alert: %s\nSeverity: %s\nStatus: %s\nStarted: %s\nInstance: %s",
		event.AlertName, event.Severity, event.Status,
		event.StartsAt.Format("2006-01-02T15:04:05Z07:00"),
		event.Labels["instance"],
	)

	msg := []byte("To: " + to + "\r\n" +
		"From: " + s.cfg.SMTPFrom + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"\r\n" + body)

	addr := fmt.Sprintf("%s:%d", s.cfg.SMTPHost, s.cfg.SMTPPort)
	var auth smtp.Auth
	if s.cfg.SMTPUser != "" {
		auth = smtp.PlainAuth("", s.cfg.SMTPUser, s.cfg.SMTPPassword, s.cfg.SMTPHost)
	}

	if err := smtp.SendMail(addr, auth, s.cfg.SMTPFrom, []string{to}, msg); err != nil {
		log.Printf("notification: send email to %s error: %v", to, err)
	}
}
