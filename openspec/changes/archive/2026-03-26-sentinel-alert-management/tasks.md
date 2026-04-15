# Tasks — Sentinel

## Backend (Go + Echo)

### [BE-1] 프로젝트 초기화 (독립)
- [x] Go 모듈 초기화 (`go mod init sentinel-backend`)
- [x] Echo, pgx, golang-migrate, godotenv 의존성 추가
- [x] 디렉토리 구조 생성 (cmd/, internal/, migrations/)
- [x] .env.example 작성
- [x] Dockerfile 작성

### [BE-2] DB 연결 및 마이그레이션 (BE-1 완료 후)
- [x] `internal/db/db.go` — pgxpool 연결 설정
- [x] `migrations/001_create_sentinel_alert_events.up.sql`
- [x] `migrations/002_create_sentinel_alert_ack.up.sql`
- [x] `migrations/003_create_sentinel_alert_comments.up.sql`
- [x] `migrations/004_create_sentinel_notification_settings.up.sql`
- [x] 마이그레이션 실행 로직 (main.go 기동 시 자동 적용)

### [BE-3] 모델 및 Repository (BE-2 완료 후)
- [x] `internal/model/alert.go` — AlertEvent, AlertAck, AlertComment 구조체
- [x] `internal/model/notification.go` — NotificationSetting 구조체
- [x] `internal/repository/alert_repo.go` — CRUD 쿼리
- [x] `internal/repository/notification_repo.go` — CRUD 쿼리

### [BE-4] Service 레이어 (BE-3 완료 후)
- [x] `internal/service/alert_service.go` — 알림 저장/조회/Ack/코멘트 로직
- [x] `internal/service/stream_service.go` — SSE Hub (broadcast, register, unregister)
- [x] `internal/service/notification_service.go` — 이메일 발송 (net/smtp)
- [x] `internal/service/metrics_service.go` — Prometheus HTTP API 호출

### [BE-5] Handler 및 Router (BE-4 완료 후)
- [x] `internal/handler/webhook.go` — POST /api/v1/webhook/alertmanager
- [x] `internal/handler/alert.go` — GET/POST alerts, ack, comments
- [x] `internal/handler/metrics.go` — GET metrics/query, query_range, nodes
- [x] `internal/handler/stream.go` — GET /api/v1/notifications/stream (SSE)
- [x] `internal/handler/notification.go` — GET/POST/PUT/DELETE notification-settings
- [x] `cmd/server/main.go` — Echo 라우터 등록, CORS 설정, 서버 기동

### [BE-6] 빌드 및 스모크 테스트 (BE-5 완료 후)
- [x] `go build ./...` — 컴파일 오류 없음 확인
- [x] 서버 기동 확인
- [x] `curl POST /api/v1/webhook/alertmanager` — 수신 및 DB 저장 확인
- [x] `curl GET /api/v1/alerts` — 목록 조회 확인
- [x] SSE 연결 확인

---

## Frontend (React + TypeScript)

### [FE-1] 프로젝트 초기화 (독립)
- [x] `npm create vite@latest sentinel-frontend -- --template react-ts`
- [x] Tailwind CSS, React Router, TanStack Query, Zustand, Axios, Recharts, Lucide React 설치
- [x] `vite.config.ts` — API proxy 설정 (dev: `/api` → `http://localhost:8080`)
- [x] `tailwind.config.ts` — 다크 테마, 커스텀 컬러 설정
- [x] `src/router.tsx` — 라우트 정의

### [FE-2] 타입 및 API 레이어 (FE-1 완료 후)
- [x] `src/types/alert.ts`
- [x] `src/types/metrics.ts`
- [x] `src/types/notification.ts`
- [x] `src/api/alertApi.ts`
- [x] `src/api/metricsApi.ts`
- [x] `src/api/notificationApi.ts`

### [FE-3] 공통 컴포넌트 (FE-2 완료 후)
- [x] `src/components/layout/Layout.tsx` — Sidebar + Header + Outlet
- [x] `src/components/layout/Sidebar.tsx` — 네비게이션
- [x] `src/components/layout/Header.tsx` — 타이틀 + AlertBell
- [x] `src/components/ui/Badge.tsx` — severity 뱃지
- [x] `src/components/ui/StatusDot.tsx` — firing/resolved 상태
- [x] `src/components/ui/AlertBell.tsx` — 미확인 알림 카운트
- [x] `src/components/ui/Card.tsx`

### [FE-4] Store 및 Hook (FE-3 완료 후)
- [x] `src/store/useAlertStore.ts`
- [x] `src/store/useNotificationStore.ts`
- [x] `src/hooks/useSSEStream.ts` — SSE 연결/재연결
- [x] `src/hooks/useAlerts.ts` — TanStack Query
- [x] `src/hooks/useAlertDetail.ts`
- [x] `src/hooks/useMetrics.ts`

### [FE-5] 페이지 구현 (FE-4 완료 후)
- [x] `src/pages/Dashboard.tsx`
  - [x] 스탯 카드 (활성 알림, critical/warning 카운트)
  - [x] EventHeatmap 컴포넌트
  - [x] 인프라 노드 상태 그리드
  - [x] 최근 알림 5건
- [x] `src/pages/AlertList.tsx`
  - [x] 필터 (severity, status, 기간)
  - [x] 알림 테이블 + 페이지네이션
- [x] `src/pages/AlertDetail.tsx`
  - [x] 알림 메타정보
  - [x] Ack 처리 폼
  - [x] 코멘트 스레드
- [x] `src/pages/MetricsExplorer.tsx`
  - [x] PromQL 입력 + 시간범위 선택
  - [x] MetricChart (Recharts)
  - [x] 프리셋 쿼리 버튼
- [x] `src/pages/NotificationSettings.tsx`
  - [x] 이메일 수신자 목록 + CRUD
  - [x] severity_filter 체크박스

### [FE-6] 빌드 및 스모크 테스트 (FE-5 완료 후)
- [x] `npm run build` — 빌드 오류 없음 확인
- [x] `npm run dev` — 로컬 기동 확인
- [x] Dashboard 화면 렌더링 확인
- [x] Alert List 데이터 로드 확인
- [x] SSE 연결 및 AlertBell 카운트 업데이트 확인

---

## 병렬 실행 가능 작업

```
[독립 — 동시 시작 가능]
  BE-1: 백엔드 프로젝트 초기화
  FE-1: 프론트엔드 프로젝트 초기화

[순차]
  BE-1 → BE-2 → BE-3 → BE-4 → BE-5 → BE-6
  FE-1 → FE-2 → FE-3 → FE-4 → FE-5 → FE-6

[통합 테스트]
  BE-6 + FE-6 완료 후 → E2E 연동 확인
```
