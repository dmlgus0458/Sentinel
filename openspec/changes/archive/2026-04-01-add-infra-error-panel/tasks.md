## 1. InfraErrorPanel 컴포넌트 구현

- [x] 1.1 `src/components/InfraErrorPanel.tsx` 파일 생성 — `InfraStatusResponse | undefined`를 props로 받아 `up: false` 서비스 목록 렌더링
- [x] 1.2 장애 항목 없을 때 "All systems operational" 메시지 표시
- [x] 1.3 데이터 로딩 중(undefined) 일 때 로딩 인디케이터 표시
- [x] 1.4 장애 목록에 서비스명 · 인스턴스 · 타입(InfraType) 정보 표시
- [x] 1.5 목록 최대 높이(`max-h`) + `overflow-y-auto` 적용으로 스크롤 처리

## 2. Dashboard 레이아웃 통합

- [x] 2.1 `Dashboard.tsx`에 `InfraErrorPanel` import 및 삽입 — 히트맵 아래, 2-column 그리드 위에 full-width로 배치
- [x] 2.2 기존 `infraStatus` 데이터를 `InfraErrorPanel`에 props로 전달 (중복 fetch 없이 재사용)

## 3. 검증

- [x] 3.1 빌드 통과 확인 (`npm run build`)
- [x] 3.2 타입 체크 통과 확인 (`tsc -b`)
- [x] 3.3 개발 서버에서 장애 항목 있을 때 패널 정상 표시 확인
- [x] 3.4 개발 서버에서 장애 없을 때 "All systems operational" 표시 확인
