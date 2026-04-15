## ADDED Requirements

### Requirement: Alertmanager Webhook 수신
The system SHALL receive Alertmanager fired alerts via POST /api/v1/webhook/alertmanager and persist them to the sentinel_alert_events table.

#### Scenario: firing alert 수신 및 저장
- **WHEN** Alertmanager가 status=firing 인 alert를 POST 전송
- **THEN** sentinel_alert_events 에 레코드 저장, SSE 브로드캐스트 발생, severity 조건 충족 시 이메일 발송

#### Scenario: resolved alert 수신 시 ends_at 업데이트
- **WHEN** Alertmanager가 동일 fingerprint 로 status=resolved 인 alert를 POST 전송
- **THEN** 기존 레코드의 ends_at 업데이트, status=resolved 로 변경

### Requirement: Alert 목록 조회
The system SHALL provide GET /api/v1/alerts supporting severity, status, date range filters and pagination.

#### Scenario: severity 필터 조회
- **WHEN** GET /api/v1/alerts?severity=critical 요청
- **THEN** severity=critical 인 레코드만 반환

#### Scenario: 기간 필터 조회
- **WHEN** GET /api/v1/alerts?from=2026-03-01&to=2026-03-26 요청
- **THEN** 해당 기간 내 starts_at 을 가진 레코드만 반환

### Requirement: Alert Ack 처리
The system SHALL allow operators to acknowledge alerts via POST /api/v1/alerts/:id/ack and MUST reject duplicate ack requests.

#### Scenario: 정상 Ack 처리
- **WHEN** POST /api/v1/alerts/1/ack { "ackedBy": "admin", "note": "확인함" } 요청
- **THEN** sentinel_alert_ack 에 레코드 저장, 200 OK 반환

#### Scenario: 이미 Ack된 알림 재요청
- **WHEN** 이미 ack 처리된 alert_event_id 로 POST /ack 재요청
- **THEN** 409 Conflict 반환

### Requirement: Alert 코멘트 관리
The system SHALL provide GET/POST /api/v1/alerts/:id/comments for per-alert comment management.

#### Scenario: 코멘트 추가
- **WHEN** POST /api/v1/alerts/1/comments { "author": "admin", "body": "조치 중" } 요청
- **THEN** sentinel_alert_comments 에 저장, 201 Created 반환

#### Scenario: 코멘트 목록 조회
- **WHEN** GET /api/v1/alerts/1/comments 요청
- **THEN** created_at 오름차순으로 코멘트 목록 반환

### Requirement: Prometheus PromQL Proxy
The system SHALL proxy Prometheus HTTP API via GET /api/v1/metrics/query and /api/v1/metrics/query_range.

#### Scenario: instant query 프록시
- **WHEN** GET /api/v1/metrics/query?query=up&time=2026-03-26T10:00:00Z 요청
- **THEN** Prometheus /api/v1/query 응답을 그대로 클라이언트에 반환

#### Scenario: range query 프록시
- **WHEN** GET /api/v1/metrics/query_range?query=node_cpu_seconds_total&start=...&end=...&step=60 요청
- **THEN** Prometheus /api/v1/query_range 응답 반환

### Requirement: SSE 실시간 알림 스트림
The system SHALL maintain SSE connections on GET /api/v1/notifications/stream and MUST broadcast new alert events to all connected clients immediately.

#### Scenario: SSE 연결 수립
- **WHEN** 클라이언트가 GET /api/v1/notifications/stream 요청
- **THEN** text/event-stream Content-Type 으로 연결 유지

#### Scenario: 신규 alert 브로드캐스트
- **WHEN** Alertmanager webhook 으로 신규 firing alert 수신
- **THEN** 연결된 모든 SSE 클라이언트에 event:alert 메시지 전송

### Requirement: 이메일 알림 발송
The system SHALL send SMTP email notifications asynchronously to recipients whose severity_filter matches the received alert severity.

#### Scenario: 조건 충족 시 이메일 발송
- **WHEN** severity_filter=['critical'] 설정된 수신자, critical alert webhook 수신
- **THEN** 해당 수신자에게 비동기 goroutine으로 이메일 발송

#### Scenario: 조건 미충족 시 미발송
- **WHEN** severity_filter=['critical'] 설정된 수신자, warning alert webhook 수신
- **THEN** 이메일 미발송

### Requirement: Notification Settings CRUD
The system SHALL provide full CRUD via GET/POST/PUT/DELETE /api/v1/notification-settings for managing alert notification recipients.

#### Scenario: 수신자 추가
- **WHEN** POST /api/v1/notification-settings { "channel": "email", "target": "ops@example.com", "severityFilter": ["critical"] } 요청
- **THEN** sentinel_notification_settings 에 저장, 201 Created 반환

#### Scenario: 수신자 비활성화
- **WHEN** PUT /api/v1/notification-settings/1 { "enabled": false } 요청
- **THEN** enabled=false 업데이트, 이후 해당 수신자 이메일 미발송
