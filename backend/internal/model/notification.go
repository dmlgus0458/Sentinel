package model

import "time"

type NotificationSetting struct {
	ID             int64     `json:"id"`
	Channel        string    `json:"channel"`
	Target         string    `json:"target"`
	SeverityFilter []string  `json:"severityFilter"`
	Enabled        bool      `json:"enabled"`
	CreatedAt      time.Time `json:"createdAt"`
}

type NotificationSettingRequest struct {
	Channel        string   `json:"channel"`
	Target         string   `json:"target"`
	SeverityFilter []string `json:"severityFilter"`
	Enabled        *bool    `json:"enabled"`
}

type NotificationSettingUpdateRequest struct {
	Target         *string  `json:"target"`
	SeverityFilter []string `json:"severityFilter"`
	Enabled        *bool    `json:"enabled"`
}
