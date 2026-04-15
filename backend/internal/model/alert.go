package model

import "time"

type AlertEvent struct {
	ID          int64              `json:"id"`
	Fingerprint string             `json:"fingerprint"`
	AlertName   string             `json:"alertName"`
	Severity    string             `json:"severity"`
	Status      string             `json:"status"`
	Labels      map[string]string  `json:"labels"`
	Annotations map[string]string  `json:"annotations"`
	StartsAt    time.Time          `json:"startsAt"`
	EndsAt      *time.Time         `json:"endsAt"`
	CreatedAt   time.Time          `json:"createdAt"`
	Ack         *AlertAck          `json:"ack"`
}

type AlertAck struct {
	ID           int64      `json:"id"`
	AlertEventID int64      `json:"alertEventId"`
	AckedBy      string     `json:"ackedBy"`
	AckedAt      time.Time  `json:"ackedAt"`
	Note         *string    `json:"note"`
}

type AlertComment struct {
	ID           int64     `json:"id"`
	AlertEventID int64     `json:"alertEventId"`
	Author       string    `json:"author"`
	Body         string    `json:"body"`
	CreatedAt    time.Time `json:"createdAt"`
}

type AlertListParams struct {
	Severity string
	Status   string
	From     string
	To       string
	Page     int
	Limit    int
}

type AlertListResponse struct {
	Data  []*AlertEvent `json:"data"`
	Total int64         `json:"total"`
	Page  int           `json:"page"`
	Limit int           `json:"limit"`
}

type AckRequest struct {
	AckedBy string  `json:"ackedBy"`
	Note    *string `json:"note"`
}

type CommentRequest struct {
	Author string `json:"author"`
	Body   string `json:"body"`
}

type SseAlertEvent struct {
	ID        int64  `json:"id"`
	AlertName string `json:"alertName"`
	Severity  string `json:"severity"`
	Status    string `json:"status"`
	Instance  string `json:"instance"`
	StartsAt  string `json:"startsAt"`
}
