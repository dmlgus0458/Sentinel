# Design — Sentinel

## 전체 아키텍처

```
[Alertmanager]
      |
      | POST /api/v1/webhook/alertmanager (신규)
      |
      ↓
[Sentinel Backend — Go/Echo]
      |         |          |
      |         |          └─ Prometheus HTTP API (PromQL)
      |         |
      |         └─ SSE broadcast → [Browser]
      |
      ↓
[PostgreSQL — usp-coredb]
  sentinel_alert_events
  sentinel_alert_ack
  sentinel_alert_comments
  sentinel_notification_settings
      |
      └─ SMTP → [Email]

[React Frontend]
  ← REST API → Sentinel Backend
  ← SSE      → Sentinel Backend
  ← PromQL   → Sentinel Backend (proxy)
```

## SSE 설계

- 클라이언트가 `/api/v1/notifications/stream` 연결 시 서버가 `text/event-stream` 응답 유지
- Alertmanager webhook 수신 시 `hub.Broadcast(event)` 호출
- Hub는 등록된 모든 SSE 클라이언트 채널에 이벤트 전송
- 이벤트 포맷:
  ```
  event: alert
  data: {"id":1,"alertName":"HighCPU","severity":"critical","status":"firing"}
  ```

## 이메일 알림 설계

- Alertmanager webhook 수신 → AlertService → NotificationService
- NotificationService: severity_filter 조건에 맞는 수신자 조회 → SMTP 발송
- 비동기 goroutine으로 발송 (webhook 응답 블로킹 방지)

## Prometheus 연동

- Sentinel Backend가 Prometheus HTTP API를 프록시
- `/api/v1/metrics/query` → `{PROMETHEUS_URL}/api/v1/query`
- `/api/v1/metrics/query_range` → `{PROMETHEUS_URL}/api/v1/query_range`
- `/api/v1/metrics/nodes` → 사전 정의된 PromQL 집합으로 노드 요약 메트릭 조회

## CORS 정책

- `CORS_ORIGINS` 환경변수로 허용 origin 관리
- 개발: `http://localhost:5173`
- 운영: Sentinel Frontend 배포 URL

## 인증

- Phase 1 범위 외 (추후 Keycloak SSO 연동 예정)
- 현재는 내부망 접근 제한으로 대체
