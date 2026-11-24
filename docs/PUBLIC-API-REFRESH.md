# 공공 API 변경 후보 수집

복지자원 DB(data/*.csv)는 사람이 확인해서 고치는 원본입니다. 공공 API는 그 원본을 자동으로 바꾸지 않고, **바뀐 점을 찾아 알려 주는 용도**로만 씁니다.

## 흐름
1. `.github/workflows/public-api-refresh.yml`이 매주 월요일 06시(한국시각)에 실행됩니다. Actions 화면에서 바로 실행할 수도 있습니다.
2. `scripts/public_api_refresh.py`가 `data/public-api-sources.json`에 적힌 API를 부릅니다.
   - **경기도 오산시**: 필수(지자체복지서비스). 실패하면 실행이 빨간색으로 끝납니다. 시설 API 같은 보조 수집 실패는 기록만 합니다.
   - **경기도**: 도 단위 사업만 남깁니다(시·군 사업은 제외).
   - **전국**: 대표 영역(정신건강·자살·자해, 위기청소년·상담, 가출·쉼터, 학대·폭력 피해, 학업중단·학교폭력, 자립·고립은둔, 중독, 긴급 생계·의료)에 해당하는 것만 남깁니다.
3. 결과는 `docs/public-api/`에 저장됩니다.
   - `candidates.csv`: '신규 후보'(DB에 없는 사업·기관), '비슷한 항목 있음'(이름이 비슷한 기존 항목이 있어 사람이 같은지 판단), '정보 다름'(전화·주소 불일치)
   - `status.json`: 수집별 마지막 시도·성공·오류
4. 바뀐 점이 있으면 `automation/public-api-refresh` 브랜치로 초안 PR이 열립니다. 담당자가 공식 안내를 확인한 뒤 data/*.csv를 직접 고칩니다.

## 등록할 인증키 (저장소 Settings → Secrets and variables → Actions)
| 비밀값 이름 | 어디서 받나 | 쓰는 곳 |
|---|---|---|
| `DATA_GO_KR_KEY` | 공공데이터포털 마이페이지의 일반 인증키(Decoding 값). 아래 API를 각각 활용신청해야 같은 키로 호출됩니다. | 지자체복지서비스, 중앙부처복지서비스, 청소년상담복지센터, 청소년 쉼터, 사회복지시설 정보, 온통청년 청년센터 |
| `GG_OPENAPI_KEY` (선택) | 경기데이터드림(data.gg.go.kr) 회원가입 후 인증키 발급 | 경기도_소방_경찰_지구대_치안센터 현황처럼 공공데이터포털에 'LINK'로만 올라온 경기도 자료. 호출 인자 이름이 `KEY`라 `keyParam: "KEY"`로 적어 둠 |

또 저장소 Settings → Actions → General에서 "Allow GitHub Actions to create and approve pull requests"를 켜야 자동 PR이 열립니다.

## 새 API 켜기
`data/public-api-sources.json`에서 해당 항목의 `endpoint`(호출 주소)와 `fields`(응답 항목 이름)를 Swagger 문서대로 채우고 `enabled`를 `true`로 바꿉니다. 오프라인 시험은 `python -m unittest discover -s tests -p 'test_public_api_refresh.py'`입니다.

시험 호출(Actions 실행 화면의 probe 칸)에 `openapi.gg.go.kr/…` 주소를 넣으면 경기데이터드림 키(`KEY`, `pIndex`, `pSize`)로 부릅니다.

## API 등록정보로 DB에 넣은 세부 사업
2026-11-24 수집분 중 지자체·중앙부처 복지서비스는 사람이 대조한 뒤 서비스 ID `SVC-SSIS-<복지로 서비스ID>`로 넣었습니다(오산시청 22, 경기도청 61, 복지로 65). 모두 '사업별 확인 필요'이며 다음 점검일은 2027-02-24입니다. 같은 ID라 다음 수집부터는 '기존과 일치'로 잡힙니다.

## 지키는 원칙
- 인증키는 화면·파일·오류 문구에 남기지 않습니다(오류 문구에서 가림 처리).
- 응답 0건이나 API 오류는 성공으로 기록하지 않고, 이전 후보를 그대로 둡니다.
- '확인완료'는 자동으로 주지 않습니다.
