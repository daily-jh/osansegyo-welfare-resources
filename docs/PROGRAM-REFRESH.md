# 프로그램 갱신 운영 · 2026-11-09

## 확인한 경로

- 웰인포 공개 목록: <https://osan.welinfo.kr/?board=programList>. 이번 웹 열람 실패. 기존 10건과 `lastSuccessAt=2026-10-22T22:28:56+09:00` 보존. 이 성공일도 이용자 캡처 확인일이며 직접 수집 성공일이 아니다.
- 오산시가족센터 공식 [프로그램신청 목록](https://osan.familynet.or.kr/center/lay1/program/S295T322C451/recruitReceipt/list.do) 및 [홈페이지](https://osan.familynet.or.kr/center/index.do): 11월 프로그램명·접수기간 확인. 홍보 목록은 이전 자료가 표시되므로 신청 목록을 우선한다.
- [긍정양육법 부모교육 상세](https://osan.familynet.or.kr/center/lay1/program/S295T322C451/recruitReceipt/view.do?seq=285962), [자조모임 상세](https://osan.familynet.or.kr/center/lay1/program/S295T322C451/recruitReceipt/view.do?seq=285152): 이번 열람 결과 대상·행사내용 등이 비어 있어 신규 게시 보류. HTTP 200·목록의 접수중 표시는 검증 완료 근거가 아니다. 공개 일반 브라우저에서 내용을 확인할 수 있을 때 대상·신청방법까지 직접 대조한다. 로그인·보안 우회·비공개 API 추측은 하지 않는다.

## 검증 후 반영

`data/program-sources.json`에 검토한 공식 출처와 연결할 기존 기관 ID를 관리한다. 추가 출처는 먼저 도메인 소유와 기관 ID를 확인한다. 신규 기관 자동 생성이나 유사 기관명 매칭은 하지 않는다.

`scripts/program_refresh.py`는 자동 수집기가 아니라 **개별 공고를 직접 검토한 결과만 적용하는 도구**다. `--input`은 프로그램 객체의 JSON 배열이다. 각 객체에는 `id`, `sourceId`, `organizationId`, `organization`, `title`, `target`, `summary`, `method`, `periodText`, `verifiedOn`, `sourceUrl`, `evidenceType=official_notice`, `evidenceNote`, `status`가 필요하다. 접수일은 실제 확인된 경우에만 `opensOn`/`closesOn`으로 추가한다. 신청 마감 시각은 `periodText`에 명시하고, 날짜 기준 상태가 실제 신청 가능을 보증하지 않음을 유지한다. 상세 내용이 없거나 자격이 불명확한 공고는 입력하지 않는다.

```sh
python scripts/program_refresh.py --source osan-family --at 2026-11-09T09:37:00+09:00 --input reviewed-notices.json
python scripts/program_refresh.py --source welinfo --at 2026-11-09T09:37:00+09:00 --error "목록 접근 실패"
```

실패는 종료코드 1이며 해당 출처의 `lastAttemptAt`/`lastError`만 바꾼다. 기존 사업과 마지막 성공일은 그대로다. 대체 출처는 `sources.<출처ID>`에 독립 기록하며 웰인포의 최상위 기록은 건드리지 않는다. 신규 출처의 실패에는 성공일을 만들지 않는다. 빈 배열·필수 근거 누락·기관 불일치·ID 충돌·잘못된 접수일도 실패로 처리한다. 성공 시에도 목록에서 사라진 기존 사업을 삭제하지 않고 검증된 ID만 추가·갱신한다.

`program-feed.js`가 원본 기관의 서비스 안으로 병합한다. `data.js`는 259개 기본 서비스의 생성물이므로 직접 수정하지 않는다. 원본 기관 ID와 이름을 함께 확인하며 기본 서비스와 같은 원문·사업명은 중복 표시하지 않는다. 웰인포 실패는 웰인포 항목에만 적용하고 대체 출처의 상태는 따로 적용한다. 출처 ID를 알 수 없거나 실패 기록이 있으면 모집중으로 표시하지 않는다. 기존 통합 검색·기관 상세·인쇄는 같은 병합 데이터를 사용한다.

## 주간·월간 분기

매 실행에 프로그램을 검토한다. 한국시간 기준 **그 달의 첫 실제 실행**에는 전체 복지자원 점검도 포함한다. 달력상의 첫 월요일만 검사하면 실행 지연·누락 때 월간 점검이 빠지므로 이전 전체 실행 시각과 월을 비교한다. 실행 시작 전에 계획을 판별하고 실행 후 전체 실행 이력과 월간 미완료 사항을 보고서에 남긴다. 개별 출처의 성공일을 전체 실행일로 대신 쓰지 않는다. 월간 작업이 실패했다면 완료로 기록하지 않고 다음 실행에서 재시도한다.

```sh
python scripts/program_refresh.py --plan --at 2026-11-09T09:37:00+09:00 --previous-at 2026-11-02T09:00:00+09:00
```

결과는 `weekly`이며 프로그램 점검만 포함한다. 이전 실행이 10월이면 11월 9일도 `monthly+weekly`다. `--previous-at`을 모르면 보수적으로 생략하여 월간 점검을 포함한다. 연도 변경·UTC/KST 월 경계·지연 실행·같은 달 재실행은 단위검사로 검증한다. 이 명령은 실행 분기만 계산하며 일정 예약이나 전체 점검 완료를 자동 기록하지 않는다.

GitHub Actions `resource-check.yml`의 매주 월요일 09:00 KST 및 매월 1일 09:00 KST 예약은 **읽기 전용 품질·링크 감사**다. 사업 내용을 자동으로 수정하거나 커밋하지 않는다. 매월 1일 감사와 ChatGPT의 월간 첫 실행 점검은 별개다. 두 일정이 같은 날이면 감사가 두 번 실행될 수 있으나 데이터 변경은 없다. 이번 환경에는 기존 ChatGPT 예약의 설정을 읽고 수정하는 연결이 없어 해당 예약의 실제 프롬프트·활성 상태는 확인하지 못했다. 새 중복 예약은 만들지 않았다.

## 검증·배포

```sh
python -m unittest discover -s tests -p test_program_refresh.py
node tests/institution-programs.cjs
python scripts/build_data.py --check
python scripts/sync_service_review_queue.py --check
python -m unittest discover -s tests -p test_resources.py
node tests/resource-search.cjs
node tests/resource-overview.cjs
node tests/service-guide.cjs
node tests/site-security.cjs
node tests/site-integrity.cjs
```

변경 전후의 `programs`와 `lastSuccessAt`을 비교하여 실패 시 보존을 확인한다. 커밋 후 해당 SHA의 품질검사와 Pages 배포 성공을 확인하고 공개된 `programs.json`과 `program-feed.js`가 커밋 내용과 일치하는지 대조한다. 확인하지 못하면 배포 완료로 보고하지 않는다.
