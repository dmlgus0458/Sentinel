CREATE TABLE sentinel_alert_ack (
    id              BIGSERIAL PRIMARY KEY,
    alert_event_id  BIGINT NOT NULL REFERENCES sentinel_alert_events(id),
    acked_by        VARCHAR(255) NOT NULL,
    acked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note            TEXT
);
