CREATE TABLE sentinel_alert_comments (
    id              BIGSERIAL PRIMARY KEY,
    alert_event_id  BIGINT NOT NULL REFERENCES sentinel_alert_events(id),
    author          VARCHAR(255) NOT NULL,
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
