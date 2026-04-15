CREATE TABLE sentinel_alert_events (
    id            BIGSERIAL PRIMARY KEY,
    fingerprint   VARCHAR(64) NOT NULL,
    alert_name    VARCHAR(255) NOT NULL,
    severity      VARCHAR(20) NOT NULL,
    status        VARCHAR(20) NOT NULL,
    labels        JSONB NOT NULL DEFAULT '{}',
    annotations   JSONB NOT NULL DEFAULT '{}',
    starts_at     TIMESTAMPTZ NOT NULL,
    ends_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sentinel_alert_events_fingerprint ON sentinel_alert_events(fingerprint);
CREATE INDEX idx_sentinel_alert_events_severity ON sentinel_alert_events(severity);
CREATE INDEX idx_sentinel_alert_events_status ON sentinel_alert_events(status);
CREATE INDEX idx_sentinel_alert_events_starts_at ON sentinel_alert_events(starts_at);
