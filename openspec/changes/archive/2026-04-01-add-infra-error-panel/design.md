## Context

Dashboard 화면의 Infrastructure Status 패널은 타입 탭 필터로 서비스를 탐색하는 구조다. 현재 `up: false` 서비스를 찾으려면 탭을 하나씩 전환해야 한다. 기존 `useInfraStatus('all')` hook과 `GET /api/v1/metrics/infra-status` API는 이미 모든 타입의 서비스 목록을 반환하므로 추가 API 호출 없이 클라이언트 필터링만으로 구현 가능하다.

## Goals / Non-Goals

**Goals:**
- `up: false`인 서비스만 모아 보여주는 `InfraErrorPanel` 컴포넌트 신규 추가
- Dashboard 레이아웃에 해당 패널을 배치 (기존 Infrastructure Status 패널 위 또는 아래)
- 장애 없을 시 "All systems operational" 상태 메시지 표시

**Non-Goals:**
- 백엔드 API 변경
- 클릭 시 상세 화면 이동 등 인터랙션 추가
- 실시간 polling 주기 변경 (기존 react-query 캐시 정책 그대로 사용)

## Decisions

### 1. 별도 컴포넌트 vs Dashboard 인라인 JSX
**결정**: `src/components/InfraErrorPanel.tsx`로 분리
**이유**: Dashboard.tsx가 이미 충분히 크고, 테스트 및 재사용을 고려해 컴포넌트로 분리하는 것이 적절하다. 대안(인라인 JSX)은 파일 길이를 더 늘릴 뿐 이점이 없다.

### 2. 데이터 소스
**결정**: Dashboard에서 이미 fetch 중인 `infraStatus` 데이터를 props로 전달
**이유**: `useInfraStatus('all')`를 중복 호출하면 불필요한 추가 요청이 생긴다. Dashboard에서 데이터를 받아 props로 내려주면 캐시를 공유한다.

### 3. "error" 판별 기준
**결정**: `InfraService.up === false`를 "error" 상태로 간주
**이유**: 현재 `InfraService` 타입에 별도의 `status` 필드가 없고, `up` 필드가 유일한 상태 지표다.

### 4. 패널 위치
**결정**: Infrastructure Status 패널과 Recent Alerts 패널이 있는 2-column 그리드 위에, full-width 패널로 배치
**이유**: 장애 항목은 우선순위가 높으므로 스크롤 없이 바로 보이는 상단 배치가 적합하다. 장애 없을 때는 최소 높이로 표시해 공간 낭비를 줄인다.

## Risks / Trade-offs

- **장애 항목 다수 시 패널이 길어질 수 있음** → `max-h` + `overflow-y-auto` 로 스크롤 제한
- **데이터 로딩 중 깜빡임** → `infraStatus`가 undefined일 때 skeleton/loading 처리 추가
