package service

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"sentinel-backend/internal/model"
	"sentinel-backend/internal/repository"
)

var ErrAlreadyAcked = errors.New("alert already acknowledged")
var ErrNotFound = errors.New("not found")
var ErrNoDB = errors.New("database not available")

type AlertService struct {
	repo *repository.AlertRepo
}

func NewAlertService(repo *repository.AlertRepo) *AlertService {
	return &AlertService{repo: repo}
}

type AlertmanagerWebhookPayload struct {
	Version  string               `json:"version"`
	GroupKey string               `json:"groupKey"`
	Status   string               `json:"status"`
	Alerts   []AlertmanagerAlert  `json:"alerts"`
}

type AlertmanagerAlert struct {
	Status      string            `json:"status"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
	StartsAt    time.Time         `json:"startsAt"`
	EndsAt      time.Time         `json:"endsAt"`
	Fingerprint string            `json:"fingerprint"`
}

func (s *AlertService) ProcessWebhook(ctx context.Context, payload *AlertmanagerWebhookPayload) ([]*model.AlertEvent, error) {
	if s.repo == nil {
		return nil, ErrNoDB
	}
	var results []*model.AlertEvent

	for _, a := range payload.Alerts {
		if a.Status == "resolved" {
			endsAt := a.EndsAt
			if endsAt.IsZero() {
				endsAt = time.Now()
			}
			if err := s.repo.UpdateAlertResolved(ctx, a.Fingerprint, endsAt); err != nil {
				return nil, err
			}
			continue
		}

		alertName := a.Labels["alertname"]
		if alertName == "" {
			alertName = "unknown"
		}
		severity := a.Labels["severity"]
		if severity == "" {
			severity = "info"
		}

		event := &model.AlertEvent{
			Fingerprint: a.Fingerprint,
			AlertName:   alertName,
			Severity:    severity,
			Status:      "firing",
			Labels:      a.Labels,
			Annotations: a.Annotations,
			StartsAt:    a.StartsAt,
		}

		id, err := s.repo.InsertAlertEvent(ctx, event)
		if err != nil {
			return nil, err
		}
		event.ID = id
		results = append(results, event)
	}

	return results, nil
}

func (s *AlertService) ListAlerts(ctx context.Context, params model.AlertListParams) (*model.AlertListResponse, error) {
	if s.repo == nil {
		return &model.AlertListResponse{Data: []*model.AlertEvent{}, Total: 0, Page: params.Page, Limit: params.Limit}, nil
	}
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 {
		params.Limit = 20
	}
	if params.Limit > 100 {
		params.Limit = 100
	}

	events, total, err := s.repo.ListAlerts(ctx, params)
	if err != nil {
		return nil, err
	}
	if events == nil {
		events = []*model.AlertEvent{}
	}

	return &model.AlertListResponse{
		Data:  events,
		Total: total,
		Page:  params.Page,
		Limit: params.Limit,
	}, nil
}

func (s *AlertService) GetAlert(ctx context.Context, id int64) (*model.AlertEvent, error) {
	if s.repo == nil {
		return nil, ErrNoDB
	}
	e, err := s.repo.GetAlertByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return e, nil
}

func (s *AlertService) AckAlert(ctx context.Context, alertEventID int64, req *model.AckRequest) (*model.AlertAck, error) {
	if s.repo == nil {
		return nil, ErrNoDB
	}
	existing, err := s.repo.GetAckByAlertID(ctx, alertEventID)
	if err == nil && existing != nil {
		return nil, ErrAlreadyAcked
	}

	ack := &model.AlertAck{
		AlertEventID: alertEventID,
		AckedBy:      req.AckedBy,
		Note:         req.Note,
	}
	return s.repo.InsertAck(ctx, ack)
}

func (s *AlertService) ListComments(ctx context.Context, alertEventID int64) ([]*model.AlertComment, error) {
	if s.repo == nil {
		return []*model.AlertComment{}, nil
	}
	comments, err := s.repo.ListComments(ctx, alertEventID)
	if err != nil {
		return nil, err
	}
	if comments == nil {
		comments = []*model.AlertComment{}
	}
	return comments, nil
}

func (s *AlertService) AddComment(ctx context.Context, alertEventID int64, req *model.CommentRequest) (*model.AlertComment, error) {
	if s.repo == nil {
		return nil, ErrNoDB
	}
	c := &model.AlertComment{
		AlertEventID: alertEventID,
		Author:       req.Author,
		Body:         req.Body,
	}
	return s.repo.InsertComment(ctx, c)
}

func (s *AlertService) GetDashboardStats(ctx context.Context) (map[string]int, error) {
	if s.repo == nil {
		return map[string]int{
			"totalFiring": 0, "totalCritical": 0, "totalWarning": 0, "totalResolved": 0,
		}, nil
	}
	return s.repo.GetDashboardStats(ctx)
}

func (s *AlertService) GetHeatmapData(ctx context.Context) ([]map[string]int, error) {
	if s.repo == nil {
		return []map[string]int{}, nil
	}
	return s.repo.GetHeatmapData(ctx)
}
