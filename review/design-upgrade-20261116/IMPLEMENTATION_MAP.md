# IMPLEMENTATION_MAP · 2026-11-16 디자인 고도화

판정 계산(CORE 25문항, YouthCriteria, OYDecision, 5단계 지표)은 바꾸지 않았습니다. 보여 주는 방식·공유 이미지·접근성만 바꿨습니다.

## 우선순위 (지침 10장: 영향 × 빈도 × 확신 ÷ 비용)

| # | 개선안 | 영향 | 빈도 | 확신 | 비용 | 점수 | 결과 |
|---|---|---|---|---|---|---|---|
| 1 | 통합 사정의견 1부 단계 반복 줄이기 | 4 | 5 | 4 | 2 | 40 | 구현 |
| 2 | 접근성 위반 3종(axe) 수정 | 3 | 5 | 5 | 1 | 75 (접근성 결함 → 최우선) | 구현 |
| 3 | 공유 썸네일(OG) 다시 그리기 | 3 | 3 | 4 | 2 | 18 | 구현 |
| 4 | 파비콘·홈 화면 아이콘을 실제 표지와 맞춤 | 2 | 3 | 5 | 1 | 30 | 구현 |
| 5 | 결과 탭 전환 움직임·누름 반응 | 2 | 5 | 3 | 1 | 30 | 구현 |
| 6 | 휴대폰 레이더 축 글자 크기(기존 남은 과제) | 3 | 3 | 2 | 3 | 6 | 보류(카드 여백까지 함께 바꿔야 함) |
| 7 | CSS 중복·!important 정리 | 1 | — | — | 4 | — | 보류(지훈 "최종 디자인" 말할 때까지) |

## 레퍼런스 → 화면 → 파일

| 레퍼런스 원리 | 현재 화면·부품 | 바꾼 파일 | 라이브러리 | 시험 |
|---|---|---|---|---|
| 지침 5.2 단계적 노출, admiretheweb 카드→상세 | 01 결과 › 통합 사정의견 › 1부 「지원 단계와 판단 근거」 | `docs/youth-risk/journey-v88.js` (`stageFold`), `oy-polish-v16.css` | 없음(`<details>`) | e2e `youth-ui-browser-regression` 접힘 시작·요약에 단계·펼친 뒤 내용 확인 |
| umanmade Tabs·Micro interaction | 결과 세 탭(척도 해석·서술기록 분석·통합 사정의견) | `journey-v88.js` (탭 누를 때 `.j88-enter`), `oy-polish-v16.css` | 없음(CSS) | 움직임 줄이기 켜면 `animation:none` 확인 |
| 지침 9장 접근성(대비) | 결과 화면의 「AI에 묻기」 버튼 | `oy-polish-v16.css` (`opacity:1`) | — | axe color-contrast 0 |
| 지침 9장 접근성(ARIA) | 한 장 03 칸 점 표시 `.oy1-dots` | `oy-onepage-v1.js` (`role="img"`) | — | axe aria-prohibited-attr 0 |
| 지침 9장 접근성(중첩 조작) | 레이더 그림(점마다 누를 수 있음) | `stage-insights-v1.js` (`role="group"`) | — | axe nested-interactive 0 |
| ogfolio OG 카드, 지침 8장 | 두 사이트 공유 미리보기 | `scripts/build-share-images.cjs`, `docs/assets/og-home-20261116.png`, `docs/youth-risk/images/og-youth-20261116.png`, HTML 14곳 `og:image` | Playwright(만들 때만) | 1200×630 확인, 가장자리 84px 안쪽 |
| brandlogo 작은 크기 판독 | 파비콘·iOS 홈 화면 아이콘 | `docs/assets/favicon.svg`(머리말 세 잎과 같게), `favicon-32.png`, `apple-touch-icon.png`, `youth-risk/images/favicon-32.png`, `apple-touch-icon.png` | — | 32·180px 미리보기 |
| 지침 6.2 모션 토큰 | 전체 | `oy-polish-v16.css` `:root --oy-dur-fast 150ms / --oy-dur 240ms / --oy-ease` | — | — |

CSS는 원본 `oy-polish-v16.css`를 `oy-css-manifest.json`에 추가하고 `node scripts/build-youth-css.cjs`로 `oy-bundle-v13.css`를 다시 만들었습니다(시험 `youth-entry-popups`가 팝업 층을 맨 끝으로 요구해 그 앞에 둠). 캐시 갱신용 주소 꼬리 `?v=20261116-design16`.

## 바꾸지 않은 것

- 복지관 로고(`osan-segyo-logo.png`)와 공식 명칭, 글꼴 SUIT.
- 예전 OG 이미지 파일(`og-home-20261023.png`, `youth-support-share-20261022.png`)은 지우지 않고 남겨 둠(다른 곳에서 링크했을 수 있음).
