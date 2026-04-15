## ADDED Requirements

### Requirement: 공통 레이아웃 및 실시간 알림 뱃지
The system SHALL provide a Sidebar + Header + content layout and MUST display real-time unread alert count on the AlertBell component in the Header.

#### Scenario: 네비게이션
- **WHEN** 사용자가 Sidebar의 메뉴 항목 클릭
- **THEN** Dashboard / Alerts / Metrics / Settings 중 해당 페이지로 라우팅

#### Scenario: 실시간 알림 뱃지 갱신
- **WHEN** SSE로 신규 firing alert 이벤트 수신
- **THEN** Header AlertBell의 미확인 카운트 1 증가

### Requirement: Dashboard 화면
The system SHALL provide a Dashboard screen that summarizes the overall infrastructure status with stat cards, event heatmap, infra error panel, and node status grid.

#### Scenario: 상태 카드 표시
- **WHEN** /dashboard 진입 시 API 데이터 로드 완료
- **THEN** 총 firing 수, critical 수, warning 수를 스탯 카드로 표시

#### Scenario: 이벤트 히트맵 렌더링
- **WHEN** /dashboard 진입
- **THEN** 최근 4주 알림 이력을 요일×시간대 히트맵으로 시각화

#### Scenario: Infra Error 패널 표시
- **WHEN** /dashboard 진입 시 infra-status 데이터 로드 완료
- **THEN** 히트맵 아래, Infrastructure Status 패널 위에 full-width "Infra Errors" 패널을 표시하며 `up: false` 서비스 목록 또는 "All systems operational" 메시지를 보여줌

#### Scenario: 노드 상태 그리드
- **WHEN** /dashboard 진입 시 Prometheus 메트릭 조회 완료
- **THEN** 노드별 CPU/메모리/디스크 수치와 임계값 초과 여부를 색상으로 표시

### Requirement: Alert List 화면
The system SHALL provide an Alert List screen with a filterable, paginated table of alert history.

#### Scenario: 기본 목록 표시
- **WHEN** /alerts 진입
- **THEN** alertName, severity(Badge), status(StatusDot), startsAt, Ack 여부 컬럼 표시

#### Scenario: severity 필터 적용
- **WHEN** severity 드롭다운에서 'critical' 선택
- **THEN** critical 알림만 필터링하여 목록 즉시 갱신

#### Scenario: 행 클릭 시 상세 이동
- **WHEN** 알림 테이블 행 클릭
- **THEN** /alerts/:id 로 라우팅

### Requirement: Alert Detail 화면
The system SHALL provide an Alert Detail screen with alert metadata, Ack form, and comment thread.

#### Scenario: 상세 정보 표시
- **WHEN** /alerts/1 진입
- **THEN** labels, annotations, 시작/종료 시각 표시

#### Scenario: Ack 처리
- **WHEN** 처리자명 + 메모 입력 후 Ack 버튼 클릭
- **THEN** POST /alerts/1/ack 호출, 성공 시 UI가 Ack 완료 상태로 갱신

#### Scenario: 코멘트 추가
- **WHEN** 코멘트 입력 후 제출
- **THEN** POST /alerts/1/comments 호출, 코멘트 목록에 즉시 반영

### Requirement: Metrics Explorer 화면
The system SHALL provide a Metrics Explorer screen where users can execute PromQL queries or select presets and view results as line charts.

#### Scenario: 프리셋 쿼리 실행
- **WHEN** 'CPU Usage' 프리셋 버튼 클릭
- **THEN** 해당 PromQL이 입력창에 채워지고 자동 실행, LineChart에 결과 표시

#### Scenario: 시간 범위 변경
- **WHEN** 'Last 6h' 시간 범위 버튼 클릭
- **THEN** 동일 쿼리를 새 시간 범위로 재요청, 차트 갱신

#### Scenario: 사용자 정의 PromQL 실행
- **WHEN** 입력창에 PromQL 직접 입력 후 실행 버튼 클릭
- **THEN** GET /api/v1/metrics/query_range 호출, 결과를 LineChart로 렌더링

### Requirement: Notification Settings 화면
The system SHALL provide a Notification Settings screen for managing email alert recipients with severity filters.

#### Scenario: 수신자 추가
- **WHEN** 이메일 주소 + severity 필터 선택 후 저장
- **THEN** POST /notification-settings 호출, 목록에 즉시 반영

#### Scenario: 수신자 비활성화
- **WHEN** 수신자 행의 enabled 토글 클릭
- **THEN** PUT /notification-settings/:id 호출, 토글 상태 즉시 변경

### Requirement: SSE 실시간 연결 및 자동 재연결
The system SHALL maintain SSE connection and MUST automatically reconnect within 3 seconds after disconnection.

#### Scenario: 자동 재연결
- **WHEN** 네트워크 일시 단절로 SSE 연결 끊김
- **THEN** 3초 후 자동 재연결 시도

#### Scenario: 알림 수신 시 카운트 증가
- **WHEN** SSE로 신규 firing alert 이벤트 수신
- **THEN** useAlertStore의 unreadCount 1 증가, AlertBell 뱃지 즉시 갱신
