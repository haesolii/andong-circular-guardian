# 안동 순환지킴이

사진·GPS 신고부터 수거 배정, 자원화, 탄소 및 일자리 성과까지 연결하는 안동형 농촌 환경관리 발표용 MVP입니다.

## 구현된 기능

- 휴대폰 카메라 촬영 및 사진 업로드
- GPS 현재 위치 자동 첨부와 권한 거부 시 시연 위치 대체
- AI 사진 유형 추천 시연 및 Gemini API 연결 준비
- 카카오맵 JavaScript SDK와 마커 클러스터 연결 준비
- 유형별 지도 필터 및 신고 현황
- 소각 ZERO 마을 순위
- 탄소감축량·자원화량·노인 및 청년 일자리 성과
- 첫 접속 카드뉴스와 자동 시연 흐름
- 환경 신고 접수 및 현황 조회 WebMCP 도구
- 브라우저 로컬 저장을 통한 발표 중 신고 데이터 유지

## 로컬 실행

```bash
cd app
npm install
npm run dev
```

`app/.env.example`을 복사해 `app/.env.local`을 만들고 필요한 키를 입력합니다. 실제 키 파일은 Git에 포함되지 않습니다.

```env
NEXT_PUBLIC_KAKAO_MAP_KEY=
KAKAO_REST_API_KEY=
GEMINI_API_KEY=
```

카카오맵 키가 없으면 발표용 예비 지도가 표시되고, 키가 있으면 실제 카카오맵으로 자동 전환됩니다.
