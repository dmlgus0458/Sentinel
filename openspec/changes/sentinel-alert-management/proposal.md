# Proposal: Sentinel — 인프라 알림 관리 웹 플랫폼

## Why

Prometheus + Alertmanager 기반 인프라 모니터링 환경에서 알림 발생 시 담당자가 Grafana에 직접 접속해 확인해야 하며, 알림 확인(Ack) 처리·코멘트·이메일 통보 등 알림 라이프사이클 관리 기능이 없다. Sentinel은 Grafana에 의존하지 않는 자체 알림 관리 플랫폼을 제공한다.

## What Changes

- **New**: Alertmanager webhook을 수신하는 Go + Echo 백엔드 서비스 (Sentinel Backend)
- **New**: 알림 이벤트 저장·조회·Ack·코멘트 API
- **New**: Prometheus PromQL proxy API (실시간 메트릭 조회)
- **New**: SSE 기반 실시간 웹 인앱 알림 스트림
- **New**: SMTP 이메일 알림 발송 서비스
- **New**: React + TypeScript 프론트엔드 (Dashboard, Alert List/Detail, Metrics Explorer, Notification Settings)
- **New**: PostgreSQL sentinel_* 테이블 4개 (usp-coredb 내 신규)
- 기존 Backend 및 alert_webhook 테이블 — **변경 없음**

## Capabilities

### New Capabilities

- `webhook-receiver` — Alertmanager fired alert webhook 수신 및 저장
- `alert-management` — 알림 이벤트 CRUD, Ack 처리, 코멘트
- `metrics-proxy` — Prometheus PromQL HTTP API 프록시
- `realtime-stream` — SSE 기반 실시간 알림 스트림
- `notification-dispatch` — 이메일 + 웹 인앱 알림 발송
- `dashboard-ui` — 인프라 상태 요약 대시보드 UI
- `alert-list-ui` — 알림 이력 조회 및 관리 UI
- `metrics-explorer-ui` — PromQL 기반 메트릭 시각화 UI

## Out of Scope

- 기존 Alertmanager rule 설정 변경 (alertmanager.yml 내 규칙은 그대로 유지)
- 기존 Backend 소스 수정
- alert_webhook 테이블 수정
- Grafana 대체 (Sentinel은 알림 관리에 특화, 전체 Grafana 기능 대체 아님)
