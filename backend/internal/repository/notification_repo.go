package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"sentinel-backend/internal/model"
)

type NotificationRepo struct {
	db *pgxpool.Pool
}

func NewNotificationRepo(db *pgxpool.Pool) *NotificationRepo {
	return &NotificationRepo{db: db}
}

func (r *NotificationRepo) ListSettings(ctx context.Context) ([]*model.NotificationSetting, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, channel, target, severity_filter, enabled, created_at
		 FROM sentinel_notification_settings ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var settings []*model.NotificationSetting
	for rows.Next() {
		s, err := scanNotificationSetting(rows)
		if err != nil {
			return nil, err
		}
		settings = append(settings, s)
	}
	return settings, nil
}

func (r *NotificationRepo) InsertSetting(ctx context.Context, s *model.NotificationSetting) (*model.NotificationSetting, error) {
	var id int64
	var createdAt time.Time
	err := r.db.QueryRow(ctx,
		`INSERT INTO sentinel_notification_settings (channel, target, severity_filter, enabled)
		 VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
		s.Channel, s.Target, s.SeverityFilter, s.Enabled,
	).Scan(&id, &createdAt)
	if err != nil {
		return nil, err
	}
	s.ID = id
	s.CreatedAt = createdAt
	return s, nil
}

func (r *NotificationRepo) UpdateSetting(ctx context.Context, id int64, req *model.NotificationSettingUpdateRequest) (*model.NotificationSetting, error) {
	existing, err := r.GetSettingByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Target != nil {
		existing.Target = *req.Target
	}
	if req.SeverityFilter != nil {
		existing.SeverityFilter = req.SeverityFilter
	}
	if req.Enabled != nil {
		existing.Enabled = *req.Enabled
	}

	_, err = r.db.Exec(ctx,
		`UPDATE sentinel_notification_settings
		 SET target=$1, severity_filter=$2, enabled=$3
		 WHERE id=$4`,
		existing.Target, existing.SeverityFilter, existing.Enabled, id,
	)
	if err != nil {
		return nil, err
	}
	return existing, nil
}

func (r *NotificationRepo) DeleteSetting(ctx context.Context, id int64) error {
	_, err := r.db.Exec(ctx,
		`DELETE FROM sentinel_notification_settings WHERE id=$1`, id)
	return err
}

func (r *NotificationRepo) GetSettingByID(ctx context.Context, id int64) (*model.NotificationSetting, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, channel, target, severity_filter, enabled, created_at
		 FROM sentinel_notification_settings WHERE id=$1`, id)
	var s model.NotificationSetting
	var severityFilter []string
	if err := row.Scan(&s.ID, &s.Channel, &s.Target, &severityFilter, &s.Enabled, &s.CreatedAt); err != nil {
		return nil, err
	}
	s.SeverityFilter = severityFilter
	return &s, nil
}

func (r *NotificationRepo) ListEnabledByChannel(ctx context.Context, channel string) ([]*model.NotificationSetting, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, channel, target, severity_filter, enabled, created_at
		 FROM sentinel_notification_settings WHERE channel=$1 AND enabled=true`,
		channel,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var settings []*model.NotificationSetting
	for rows.Next() {
		s, err := scanNotificationSetting(rows)
		if err != nil {
			return nil, err
		}
		settings = append(settings, s)
	}
	return settings, nil
}

type settingRow interface {
	Scan(dest ...any) error
}

func scanNotificationSetting(row settingRow) (*model.NotificationSetting, error) {
	var s model.NotificationSetting
	var severityFilter []string
	if err := row.Scan(&s.ID, &s.Channel, &s.Target, &severityFilter, &s.Enabled, &s.CreatedAt); err != nil {
		return nil, err
	}
	s.SeverityFilter = severityFilter
	if s.SeverityFilter == nil {
		s.SeverityFilter = []string{}
	}
	return &s, nil
}
