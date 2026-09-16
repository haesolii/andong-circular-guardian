# 들녘 — 농촌환경 데이터 플랫폼

영농부산물을 예측하고, 청년 실무자가 현장을 검증해 분석보고서와 직무 산출물을 남기는 발표용 플랫폼입니다.
Mintlify 스타일 참조의 흰 배경, 검은 버튼, 절제된 초록색 활성 표시를 적용합니다.

## 분리된 서비스

- PC 분석 웹: app/ · PREDICT, MAP, DB, REPORT, CAREER
- 현장 모바일 앱: field-site/ · TASK, FIELD, GPS·사진, 개인 기록
- UI 전환 버튼 없이 별도 사이트로 배포합니다.
- 모바일은 PC 웹의 /api/environment를 호출합니다. API 서버는 D1에 기록·업무·보고서를 저장하고 R2에 사진을 저장합니다.
- GIS는 기존 카카오 등록 도메인의 /map-embed를 사용하므로 새 현장앱 도메인에 지도 키를 노출하지 않습니다.
- 데이터 갱신: 저장 직후 재조회 + 화면이 활성화된 동안 5초 주기. WebSocket 푸시 방식은 아닙니다.

## 시연 범위

- 12개 예시 마을, 36건의 예시 현장자료, 2027년 9–12월 데이터
- 면적·계수 수정, CSV 양식 다운로드 및 가져오기, 발생량 자동 재계산
- 마을·기간별 업무 배정, 중복 배정 방지
- GPS 권한 요청, 실제 좌표·정확도 기록, 사진 저장, 선택적 AI 작물 확인 보조
- 지도 5개 레이어, 월·지역 필터, 기록 상세 조회, CSV 내보내기
- 실무자가 직접 분석·제안을 작성하고 서버에 보고서를 저장
- 직접 입력한 기록과 보고서 기반의 직무 포트폴리오
- 선택적 표본량 기록: 조사면적·부산물량·계량/추정·전체/일부 확인을 함께 저장합니다. 같은 작물·발생 완료·예측 월·전체 표본인 경우에만 면적 기준 비교를 제공합니다.
- 직접 입력한 기록만 집계하는 데이터 품질 지표: GPS·사진 확보율, 핵심 상태 누락률, 정량 비교 가능률, 예측 마을 확인율. 정책 목표와 현재값을 구분합니다.
- GIS 원자료 GeoJSON 내보내기(경도·위도 순서, 유효 GPS가 없으면 null geometry). 메모·사진 URL·사용자 식별자는 제외합니다.
- 보고서 저장 시 입력자료·집계값을 서버에서 고정하여 저장본 내려받기에 사용합니다. 이전 보고서의 근거를 현재값으로 임의 복원하지 않습니다.
- 닫기·다음·다시보기 가능한 카드뉴스 안내
- 제안된 WebMCP 브라우저 API 기능 감지 및 도구 등록

현재는 발표용 공용 시연 계정입니다. 개인별 로그인·권한 검증, 공인 경력 인증, 공식 농업데이터 연동은 구현 범위에 포함되지 않습니다.
예시 데이터는 공식 관측값이 아닙니다. 계수는 가정값이며 마을 위치는 대략적인 배치입니다.
예측 일치율은 ‘예상과 유사’ 응답 비율입니다. 정량적 예측 정확도 또는 정책 효과를 의미하지 않습니다.
표본량으로 마을 총량을 외삽하거나 발생계수를 자동 보정하지 않습니다. 직접 입력도 공용 시연 계정의 미검수 자료입니다. 품질 집계는 선택 기간·지역과 API의 최근 1,000건 범위에 한정됩니다.
신고·단속·파쇄 접수·산불 위험 판정·지원 대상 선정 기능은 신규 화면에서 제공하지 않습니다. 기존 reports 테이블과 API는 이전 데이터 보존을 위해 유지합니다.

## 개발

app에서 npm install을 실행한 뒤 npm run dev (3000).
다른 터미널에서 field-site에서 npm run dev (3001).
현장 앱은 app의 설치된 의존성을 재사용하며, 독립 배포 산출물에 공통 UI를 번들링합니다.

app/.env.local:
- NEXT_PUBLIC_KAKAO_MAP_KEY: 카카오 JavaScript 키
- GEMINI_API_KEY: 서버에서만 사용하는 Gemini 키
- KAKAO_REST_API_KEY: 기존 역지오코딩 API용 서버 키

실제 키는 Git에 커밋하지 않습니다. 운영 환경의 서버 키는 Sites 비밀변수로 관리합니다.

## 확인

app:
- npx tsc --noEmit --incremental false
- node --test tests/environment.test.mjs
- node tests/environment-api.mjs (로컬 서버·스키마 필요; 생성한 임시 기록만 제거)
- npm run build

field-site:
- npm run build

Windows에서 한글/OneDrive 경로의 Vinext 프로덕션 빌드가 오류 없이 종료되는 문제가 있습니다.
배포 빌드는 소스를 ASCII 임시경로로 복사한 후 수행합니다. 기존 node_modules를 연결하고 공개 지도 키만 환경변수로 전달합니다.
원본 소스와 검증된 임시 빌드 소스가 같은지 확인한 후 패키징합니다.
분리된 현장 앱의 multipart 전송을 위해 next.config.ts의 정확한 현장 앱 호스트를 허용합니다. 개발용 localhost:3001은 개발 환경에만 포함되며, 사진 10MB와 폼 여유분에 맞춰 프레임워크 요청 한도를 11MB로 설정합니다. API의 출처·용량 검사는 별도로 유지합니다.

## WebMCP 범위

PC: get_environment_summary, navigate_environment_workspace, assign_field_verification
모바일: list_field_tasks, start_field_verification, list_my_field_records
시연 브라우저가 document.modelContext를 지원할 때 등록되며, 서버형 MCP 엔드포인트와는 구분됩니다.
공개 앱에서 get_environment_summary와 navigate_environment_workspace 호출을 확인했습니다. 집계 도구는 직접 입력 기반 dataQuality도 반환합니다. 업무 배정처럼 운영 데이터를 쓰는 도구는 공개 환경에서 테스트하지 않았습니다.

## 2026-09-16 공개 업데이트 기록

- 관리자 웹 v9: 소스 `223f4267575b57ee5c33d10070fe1aea5fa1fefb`, 배포 `appgdep_6aaa0fca1fc88191ba28424243f963d1` 성공.
- 현장 앱 v2: 소스 `56c5ade5fd9b65fab07feb003d8cef2fed6b8b07`, 배포 `appgdep_6aaa101d71888191a53886b082ce06e3` 성공.
- 빌더: Windows Node 24.11.0, 기존 Vinext 1.0.0-beta.9 / Vite 8.2.2, ASCII 임시 소스 사본에서 `npm run build`. Sites helper의 Windows npm/WSL 경로 오류로 동일 build 스크립트와 Git Bash 패키징 helper를 직접 실행했습니다.
- 저장된 아카이브 SHA256: 관리자 `287a4218d7f95ac79f8d617cf9e6a85c26d6d0ff772e675d56055c543f4326aa`, 현장 `d8afefd8a499c6c5ad412f2cb135a0e29c41765e03884e598fb7d1ef57d9ca44` (Sites 반환값).
- 검증: 타입 검사, 단위 테스트 12/12, 로컬 API 저장·재조회·중복 방지·보고서 근거 고정, multipart 공란/부분 입력/0톤/2MB 요청, 두 빌드 통과. 임시 DB 테스트 행만 제거하고 기존 데이터는 유지했습니다.
- 공개 확인: 안내 닫기, 표본량 입력 노출, 품질 지표의 예시 제외/빈 분모, 실기록 없는 경우 GIS 다운로드 비활성화, WebMCP 읽기·이동 호출. 현장 origin의 multipart 잘못된 ID 요청이 CORS 헤더와 JSON 400 응답을 반환하여 프레임워크 차단 없이 API 검증에 도달함을 확인했습니다. 운영 기록은 생성하지 않았습니다.
- 화면 확인: 현장 폼 390px/320px, 관리자 대시보드 1440px. 실기기 카메라·GPS로 촬영 후 저장하는 전체 경로는 미검증입니다.
- 복구 후보: 관리자 v8 `appgprj_6a9a9ba8fe24819180301d801e082084~appgver_a1aed50a2e748191911d98b89f7098f9`, 현장 v1 `appgprj_6a9d5312d0908191ba5cf19b55268b74~appgver_be24c2d05ff48191b88517f0e432f9cb`. 동일 공개 audience로 이전 버전을 재배포할 수 있으며 DB 스키마 변경은 없습니다. 실제 롤백 실행은 하지 않았습니다.
