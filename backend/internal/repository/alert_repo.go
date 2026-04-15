package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"sentinel-backend/internal/model"
)

type AlertRepo struct {
	db *pgxpool.Pool
}

func NewAlertRepo(db *pgxpool.Pool) *AlertRepo {
	return &AlertRepo{db: db}
}

func (r *AlertRepo) InsertAlertEvent(ctx context.Context, e *model.AlertEvent) (int64, error) {
	labels, _ := json.Marshal(e.Labels)
	annotations, _ := json.Marshal(e.Annotations)

	var id int64
	err := r.db.QueryRow(ctx,
		`INSERT INTO sentinel_alert_events
			(fingerprint, alert_name, severity, status, labels, annotations, starts_at, ends_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id`,
		e.Fingerprint, e.AlertName, e.Severity, e.Status,
		labels, annotations, e.StartsAt, e.EndsAt,
	).Scan(&id)
	return id, err
}

func (r *AlertRepo) UpdateAlertResolved(ctx context.Context, fingerprint string, endsAt time.Time) error {
	_, err := r.db.Exec(ctx,
		`UPDATE sentinel_alert_events SET status='resolved', ends_at=$1
		 WHERE fingerprint=$2 AND status='firing'`,
		endsAt, fingerprint,
	)
	return err
}

func (r *AlertRepo) GetAlertByID(ctx context.Context, id int64) (*model.AlertEvent, error) {
	row := r.db.QueryRow(ctx,
		`SELECT id, fingerprint, alert_name, severity, status, labels, annotations, starts_at, ends_at, created_at
		 FROM sentinel_alert_events WHERE id=$1`, id)

	e, err := scanAlertEvent(row)
	if err != nil {
		return nil, err
	}

	ack, err := r.getAckByAlertID(ctx, e.ID)
	if err == nil {
		e.Ack = ack
	}

	return e, nil
}

func (r *AlertRepo) ListAlerts(ctx context.Context, params model.AlertListParams) ([]*model.AlertEvent, int64, error) {
	offset := (params.Page - 1) * params.Limit
	args := []interface{}{}
	where := "WHERE 1=1"
	i := 1

	if params.Severity != "" {
		where += fmt.Sprintf(" AND severity=$%d", i)
		args = append(args, params.Severity)
		i++
	}
	if params.Status != "" {
		where += fmt.Sprintf(" AND status=$%d", i)
		args = append(args, params.Status)
		i++
	}
	if params.From != "" {
		where += fmt.Sprintf(" AND starts_at>=$%d", i)
		args = append(args, params.From)
		i++
	}
	if params.To != "" {
		where += fmt.Sprintf(" AND starts_at<=$%d", i)
		args = append(args, params.To)
		i++
	}

	var total int64
	err := r.db.QueryRow(ctx,
		"SELECT COUNT(*) FROM sentinel_alert_events "+where, args...,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	args = append(args, params.Limit, offset)
	rows, err := r.db.Query(ctx,
		`SELECT id, fingerprint, alert_name, severity, status, labels, annotations, starts_at, ends_at, created_at
		 FROM sentinel_alert_events `+where+
			fmt.Sprintf(` ORDER BY starts_at DESC LIMIT $%d OFFSET $%d`, i, i+1),
		args...,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var events []*model.AlertEvent
	for rows.Next() {
		e, err := scanAlertEventRows(rows)
		if err != nil {
			return nil, 0, err
		}
		events = append(events, e)
	}

	// attach acks
	for _, e := range events {
		ack, err := r.getAckByAlertID(ctx, e.ID)
		if err == nil {
			e.Ack = ack
		}
	}

	return events, total, nil
}

func (r *AlertRepo) InsertAck(ctx context.Context, ack *model.AlertAck) (*model.AlertAck, error) {
	var id int64
	var ackedAt time.Time
	err := r.db.QueryRow(ctx,
		`INSERT INTO sentinel_alert_ack (alert_event_id, acked_by, note)
		 VALUES ($1, $2, $3) RETURNING id, acked_at`,
		ack.AlertEventID, ack.AckedBy, ack.Note,
	).Scan(&id, &ackedAt)
	if err != nil {
		return nil, err
	}
	ack.ID = id
	ack.AckedAt = ackedAt
	return ack, nil
}

func (r *AlertRepo) GetAckByAlertID(ctx context.Context, alertEventID int64) (*model.AlertAck, error) {
	return r.getAckByAlertID(ctx, alertEventID)
}

func (r *AlertRepo) getAckByAlertID(ctx context.Context, alertEventID int64) (*model.AlertAck, error) {
	var ack model.AlertAck
	err := r.db.QueryRow(ctx,
		`SELECT id, alert_event_id, acked_by, acked_at, note
		 FROM sentinel_alert_ack WHERE alert_event_id=$1`,
		alertEventID,
	).Scan(&ack.ID, &ack.AlertEventID, &ack.AckedBy, &ack.AckedAt, &ack.Note)
	if err != nil {
		return nil, err
	}
	return &ack, nil
}

func (r *AlertRepo) ListComments(ctx context.Context, alertEventID int64) ([]*model.AlertComment, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, alert_event_id, author, body, created_at
		 FROM sentinel_alert_comments WHERE alert_event_id=$1 ORDER BY created_at ASC`,
		alertEventID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*model.AlertComment
	for rows.Next() {
		var c model.AlertComment
		if err := rows.Scan(&c.ID, &c.AlertEventID, &c.Author, &c.Body, &c.CreatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, &c)
	}
	return comments, nil
}

func (r *AlertRepo) InsertComment(ctx context.Context, c *model.AlertComment) (*model.AlertComment, error) {
	var id int64
	var createdAt time.Time
	err := r.db.QueryRow(ctx,
		`INSERT INTO sentinel_alert_comments (alert_event_id, author, body)
		 VALUES ($1, $2, $3) RETURNING id, created_at`,
		c.AlertEventID, c.Author, c.Body,
	).Scan(&id, &createdAt)
	if err != nil {
		return nil, err
	}
	c.ID = id
	c.CreatedAt = createdAt
	return c, nil
}

func scanAlertEvent(row pgx.Row) (*model.AlertEvent, error) {
	var e model.AlertEvent
	var labelsRaw, annotationsRaw []byte
	if err := row.Scan(
		&e.ID, &e.Fingerprint, &e.AlertName, &e.Severity, &e.Status,
		&labelsRaw, &annotationsRaw,
		&e.StartsAt, &e.EndsAt, &e.CreatedAt,
	); err != nil {
		return nil, err
	}
	_ = json.Unmarshal(labelsRaw, &e.Labels)
	_ = json.Unmarshal(annotationsRaw, &e.Annotations)
	if e.Labels == nil {
		e.Labels = map[string]string{}
	}
	if e.Annotations == nil {
		e.Annotations = map[string]string{}
	}
	return &e, nil
}

func (r *AlertRepo) GetDashboardStats(ctx context.Context) (map[string]int, error) {
	var totalFiring, totalCritical, totalWarning, totalResolved int
	err := r.db.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE status='firing') as total_firing,
			COUNT(*) FILTER (WHERE status='firing' AND severity='critical') as total_critical,
			COUNT(*) FILTER (WHERE status='firing' AND severity='warning') as total_warning,
			COUNT(*) FILTER (WHERE status='resolved' AND ends_at >= NOW() - INTERVAL '24 hours') as total_resolved
		FROM sentinel_alert_events
	`).Scan(&totalFiring, &totalCritical, &totalWarning, &totalResolved)
	if err != nil {
		return nil, err
	}
	return map[string]int{
		"totalFiring":   totalFiring,
		"totalCritical": totalCritical,
		"totalWarning":  totalWarning,
		"totalResolved": totalResolved,
	}, nil
}

func (r *AlertRepo) GetHeatmapData(ctx context.Context) ([]map[string]int, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			((EXTRACT(DOW FROM starts_at AT TIME ZONE 'UTC')::int + 6) % 7) as day,
			EXTRACT(HOUR FROM starts_at AT TIME ZONE 'UTC')::int as hour,
			COUNT(*)::int as count
		FROM sentinel_alert_events
		WHERE starts_at >= NOW() - INTERVAL '28 days'
		GROUP BY day, hour
		ORDER BY day, hour
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cells []map[string]int
	for rows.Next() {
		var day, hour, count int
		if err := rows.Scan(&day, &hour, &count); err != nil {
			return nil, err
		}
		cells = append(cells, map[string]int{"day": day, "hour": hour, "count": count})
	}
	if cells == nil {
		cells = []map[string]int{}
	}
	return cells, nil
}

func scanAlertEventRows(rows pgx.Rows) (*model.AlertEvent, error) {
	var e model.AlertEvent
	var labelsRaw, annotationsRaw []byte
	if err := rows.Scan(
		&e.ID, &e.Fingerprint, &e.AlertName, &e.Severity, &e.Status,
		&labelsRaw, &annotationsRaw,
		&e.StartsAt, &e.EndsAt, &e.CreatedAt,
	); err != nil {
		return nil, err
	}
	_ = json.Unmarshal(labelsRaw, &e.Labels)
	_ = json.Unmarshal(annotationsRaw, &e.Annotations)
	if e.Labels == nil {
		e.Labels = map[string]string{}
	}
	if e.Annotations == nil {
		e.Annotations = map[string]string{}
	}
	return &e, nil
}
