CREATE TABLE sentinel_notification_settings (
    id               BIGSERIAL PRIMARY KEY,
    channel          VARCHAR(20) NOT NULL,
    target           VARCHAR(255) NOT NULL,
    severity_filter  TEXT[] NOT NULL DEFAULT '{}',
    enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
