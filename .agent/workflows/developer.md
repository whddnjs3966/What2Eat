---
description: Backend Developer Agent - 핵심 로직 및 API 연동 워크플로우
---

# ⚙️ 개발자 에이전트 워크플로우

## 역할
- 추천 알고리즘 로직 구현
- 상태 관리 (Zustand)
- 외부 API 연동 (카카오맵, 카카오톡, 날씨)
- 메뉴 데이터베이스 설계

## 기술 스택
- **Next.js App Router** (TypeScript)
- **Zustand** (8단계 선택 상태 관리)
- **카카오맵 SDK** (주변 식당 검색)
- **카카오톡 JavaScript SDK** (공유 기능)
- **OpenWeatherMap API** (날씨 연동)

## API 키 요구사항
- 카카오 개발자 앱 키 (REST API Key + JavaScript Key)
- OpenWeatherMap API Key

## 작업 순서
// turbo-all
1. 메뉴 데이터 JSON 작성 (50+ 메뉴, 태그 포함)
2. Zustand 스토어 작성 (선택 상태 + 추천 결과)
3. 추천 알고리즘 구현 (필터링 + 가중치 스코어링)
4. API 라우트 작성 (/api/weather, /api/recommend)
5. 카카오맵 SDK 연동
6. 카카오톡 공유 SDK 연동

## 추천 알고리즘 개요
```
1. 8단계 필터로 후보군 줄이기
2. 남은 후보에 상황별 가중치 부여
3. 가중치 기반 랜덤 선택 (상위 3개 중 1개)
4. 결과 카드 데이터 구성
```
