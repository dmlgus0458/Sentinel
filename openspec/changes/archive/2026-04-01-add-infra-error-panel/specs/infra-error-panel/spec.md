## ADDED Requirements

### Requirement: Infra Error Panel
The system SHALL display a dedicated panel on the Dashboard screen that lists only infrastructure services with `up: false` status.

#### Scenario: 장애 서비스 목록 표시
- **WHEN** Dashboard 진입 시 `GET /api/v1/metrics/infra-status` 응답에 `up: false`인 서비스가 1개 이상 존재
- **THEN** "Infra Errors" 패널에 해당 서비스들의 이름, 인스턴스, 타입을 목록으로 표시

#### Scenario: 장애 없을 때 정상 상태 메시지 표시
- **WHEN** Dashboard 진입 시 모든 인프라 서비스의 `up` 값이 `true`
- **THEN** "Infra Errors" 패널에 "All systems operational" 메시지를 표시

#### Scenario: 데이터 로딩 중 상태
- **WHEN** `infra-status` API 응답 대기 중
- **THEN** 패널에 로딩 인디케이터를 표시

#### Scenario: 목록 스크롤
- **WHEN** `up: false`인 서비스가 많아 패널 최대 높이를 초과
- **THEN** 패널 내부가 스크롤 가능하며 레이아웃이 깨지지 않음
