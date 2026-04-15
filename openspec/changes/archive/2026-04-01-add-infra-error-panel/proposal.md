## Why

Dashboard의 Infrastructure Status 패널은 전체 서비스 목록을 타입별 탭으로 보여주는 구조라, `up: false`인 장애 항목을 빠르게 식별하기 어렵다. 운영자가 장애 서비스만 즉시 확인할 수 있는 전용 패널이 필요하다.

## What Changes

- Dashboard에 **Infra Errors** 패널 추가 — `up: false`인 서비스만 필터링해서 표시
- 장애 항목이 없을 경우 "All systems operational" 메시지 표시
- 장애 항목이 있을 경우 서비스명 · 인스턴스 · 타입 정보를 목록으로 표시

## Capabilities

### New Capabilities
- `infra-error-panel`: Dashboard 화면에 인프라 장애 서비스만 모아서 보여주는 패널

### Modified Capabilities
- `frontend/dashboard`: Dashboard 화면에 새 패널 추가 (기존 레이아웃 변경)

## Impact

- `frontend/src/pages/Dashboard.tsx` — 새 패널 컴포넌트 삽입
- `frontend/src/components/` — `InfraErrorPanel` 컴포넌트 신규 추가
- 백엔드/API 변경 없음 (기존 `GET /api/v1/metrics/infra-status` 재사용)
