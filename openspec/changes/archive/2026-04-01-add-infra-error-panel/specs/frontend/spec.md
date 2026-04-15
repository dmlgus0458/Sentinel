## MODIFIED Requirements

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
