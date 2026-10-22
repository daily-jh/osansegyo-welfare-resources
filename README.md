# 함께찾는 복지자원 | 오산시·경기도·전국 민간자원 통합검색

2026년 10월 기준 **1차 조사·편집본**으로 제작된 정적 검색 홈페이지입니다. **기관명 기준으로 동일 기관의 서비스를 하나로 묶어** 보여줍니다. 최초 등록 데이터는 **46개 기관·체계 / 111개 서비스**입니다.

**기획·편집·웹사이트 제작 표기:** 오산세교종합사회복지관 김지훈 팀장  
**저작권 표기:** © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved.  
자세한 권리 범위는 [COPYRIGHT.md](COPYRIGHT.md)를 확인하십시오.

**청소년 위기징후 평가연계 시스템 별도 표시:** 기획·개발·저작권자 김지훈(소속: 오산세교종합사회복지관 지역사랑팀 팀장). 공익적 비영리 이용은 무료이며, 상세 조건은 [청소년 시스템 이용조건](docs/youth-risk/usage-terms.html)을 따릅니다. 저장소의 일반 복지자원 홈페이지와 별도로 구분하여 적용합니다.

## 기능

- 기관명, 서비스명, 지원대상, 분야, 사업내용을 한 번에 검색
- 오산시 / 경기도 / 전국 민간자원 분류
- 의료·긴급·교육·주거·장애·노인 등 분야별 필터와 대상별 필터
- 동일 기관 다수 서비스를 기관 카드 하나에 통합하여 상세보기
- 개인 브라우저에만 저장되는 즐겨찾기, 기관별 링크 공유
- Excel에서 열 수 있는 CSV 다운로드
- 반응형 화면 (PC·스마트폰); 외부 API·회원가입·유료 서버 불필요

## GitHub Pages 배포 — 준비해 둔 `docs/` 폴더 사용

**GitHub 계정:** `daily-jh`  
**추천 저장소명:** `osansegyo-welfare-resources`

1. <https://github.com/new> 에서 Repository name을 `osansegyo-welfare-resources`로 정하고 **Public** 저장소를 만듭니다. (가능하면 README 생성 없이 빈 저장소를 만듭니다.)
2. 프로젝트 압축을 풀고 루트에 있는 `README.md`, `COPYRIGHT.md`, `data/`, `docs/`, `scripts/`를 저장소 루트에 업로드·커밋합니다. GitHub 화면에서는 **Add file → Upload files**를 이용합니다. **ZIP 파일 자체를 올리는 것이 아니라 압축을 푼 파일·폴더를 올려야 합니다.**
3. 저장소의 **Settings → Pages → Build and deployment → Source: Deploy from a branch**로 설정합니다.
4. **Branch: `main` / Folder: `/docs` → Save**로 설정합니다.
5. 배포가 완료되면 주소는 `https://daily-jh.github.io/osansegyo-welfare-resources/` 형태입니다. **저장소 생성·배포 이전에는 이 주소가 작동하지 않습니다.**

GitHub 공식 설명: <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>

### 로컬 미리보기

`docs/index.html`을 브라우저로 열거나, 프로젝트 루트에서:

```bash
python -m http.server 8080 --directory docs
```

브라우저에서 <http://localhost:8080>에 접속합니다.

## 데이터 수정·검사·월간 운영 (2026-10-22 전환)

- 편집 원본: `data/organizations.csv`(기관), `data/services.csv`(서비스), `data/contacts.csv`(연락·접수 창구), `data/applications.csv`(공모 회차). UTF-8 BOM CSV입니다.
- 생성물: `data/resources.csv`, `docs/resources.csv`, `docs/assets/data.js`, `docs/review-queue.csv`, `docs/coverage.json`, 메인 통계·자료 정리일. 생성물을 직접 편집하지 마십시오.
- `org_id`는 기존 10자리 ID를 유지합니다. 기관명·범주를 바꾸어도 ID를 바꾸지 마십시오. 신규 기관·서비스에는 중복되지 않는 ID를 한 번만 부여합니다. `id-registry.csv`는 최초 ID 대응 기록입니다. 서비스 ID도 개명·행 순서 변경과 무관하게 유지합니다.
- `row_order`는 호환 CSV 출력 순서입니다. 기존 한글 14열·기관명·서비스명은 청소년 도구와 연결됩니다. 개명 전 `docs/youth-risk/`의 routes·profiles·resource-links 의존성과 테스트를 함께 검토하십시오.
- 다중 태그는 `|`로 구분합니다. 허용 어휘와 기존 분류 대응은 `data/taxonomy.json`에 있습니다. 빈 태그를 임의 자격으로 채우지 마십시오. 기존 분류에서 옮긴 태그는 검색용이며 공식 검증이 아닙니다.
- `최종검토일`은 기존 자료 정리일을 보존하는 호환 열입니다. 실제 확인일은 `verified_on`, 상태는 `verification_status`, 근거는 `source_url`, 방법·공개 담당 역할은 `verification_method`·`verified_by`, 재점검일은 `next_check_on`에 기록합니다. 확인완료에는 날짜·방법·담당 역할·근거가 모두 필요합니다.
- 접수 가능·운영 형태는 미확인 기본값을 유지합니다. 공모형 확인 시 operation_type을 공모형으로 하고 applications.csv에 회차·기간·출처·확인일을 추가합니다. 마감은 한국시간 일자 기준이며 공식 공고의 시각 제한을 별도 확인합니다.
- contacts.csv의 owner_type은 organization 또는 service, owner_id는 해당 ID입니다. 기관 대표전화에는 note를 대표전화로 두고 기관당 1개만 지정합니다. 서비스별 추가 접수처는 서비스 ID에 연결합니다.
- 확인 내역은 `data/verification_log.csv`에 이전 내역을 지우지 않고 추가합니다. target_type/target_id로 기관 또는 서비스를 연결하고 날짜·방법·공개 담당 역할·결과·근거·다음 점검일을 기록합니다.
- 확인완료 여부와 별개로 기관 status가 중단·폐지이면 검색 후보에서 제외됩니다. 원본과 변경 이력은 보존합니다.

```bash
python scripts/build_data.py
python scripts/build_data.py --check
python -m unittest discover -s tests -p 'test_resources.py'
node tests/resource-search.cjs
python scripts/audit_resources.py --links
```

`--check`는 불완전 행·중복 ID·참조 오류·생성물 차이를 실패로 처리하며 데이터를 건너뛰지 않습니다. audit은 확인 목록만 `artifacts/resource-audit/`에 생성하고 원본을 변경하지 않습니다. 링크 응답 200은 정확성 검증이 아니며 403·429·시간초과도 폐지 근거가 아닙니다.

GitHub Actions의 **Welfare resource checks**가 매월 1일 09:00 KST에 자동점검을 실행합니다. 실행이 지연·누락되면 **Run workflow**로 수동 실행합니다. 실행 페이지의 요약·resource-audit 첨부 보고서를 내려받아 공식 출처와 대조하십시오. 예약 검사 자체는 사이트를 갱신하거나 자료를 삭제하지 않습니다. 실제 확인·수정 후 생성물 검사, 청소년 회귀검사, `docs/changelog.html` 이력 기록을 거쳐 배포하십시오.

공개 기준·이용조건: `docs/data-guide.html`. 오류 제보: GitHub Issue 양식. 개인정보를 입력하거나 비공개 확인자 명단을 저장소에 올리지 마십시오. CSV의 CC·공공누리 이용허락은 새로 부여하지 않았습니다.

## 운영상 주의사항

- 공개 사이트입니다. **대상자 성명, 연락처, 건강·부채·상담기록 등 개인정보를 등록하지 마십시오.**
- 사이트 자료는 2026년 10월의 **실무용 1차 자원 목록**이지, 모든 프로그램의 운영 및 접수 가능 여부를 개별적으로 검증한 공인 자료가 아닙니다. **정확한 신청 기준·지원 한도·접수기한·사업 존속 여부는 반드시 각 기관의 최신 공식 안내를 확인**하십시오.
- `data/resources.csv`에는 기관별 출처 URL과 최종검토일이 있어 자료 검증·추적에 활용할 수 있습니다.
- 전체 사이트의 코드·디자인 및 독창적 자료 편집에 대한 권리 표기는 외부 기관의 명칭·상표·원자료나 법적 사실에 대한 배타적 권리를 의미하지 않습니다. 직원이 업무상 제작한 저작물의 법적 권리 귀속은 근로규정·계약 등 추가 검토가 필요할 수 있습니다.
- 누구나 링크로 열 수 있는 **공개형 GitHub Pages**입니다. 비공개 접근 제한 기능은 포함하지 않았습니다.

## 기관 연락정보 갱신

contacts.csv의 fax·email·source_url·verified_on 열에서 공식 공개 연락정보를 관리합니다. 생성되는 docs/contacts.csv는 연락처 전용 내려받기 자료입니다. 기존 14열 resources.csv는 유지합니다. data/contact_sources.json에 이번 기관별 근거와 확인 범위를 기록했습니다. 대표 이메일이 없는 경우 개인 담당자 주소·채용전용 주소·개인정보보호 담당자 주소를 대신 입력하지 마십시오. 화면의 —는 대표 공개정보 미확보를 의미합니다. 서비스 검증 메타데이터는 관리 원본에 유지하고 상세 카드에는 노출하지 않습니다.

## 기관별 사업 안내와 주간 갱신 (2026-10-22)

`docs/programs.json`에 오산 복지정보 프로그램 목록에서 확인한 사업의 최소 사실정보와 원문 링크를 수록합니다. `docs/assets/program-feed.js`가 별도 사업 검색·상태 필터와 기관명 일치에 따른 카드 내 사업 연결을 제공합니다. 원문을 읽지 못한 초기 상태에는 수집 실패 안내와 빈 목록을 표시합니다. 본문·사진·첨부파일을 복제하거나 실시간 API 연동을 주장하지 않습니다.

ChatGPT의 기존 복지자원 갱신 예약을 매주 월요일 오전 9시(Asia/Seoul) 기준으로 변경했습니다. 예약 서비스의 지연이 있을 수 있으며 예약은 저장소 GitHub Actions와 별개입니다. 매월 첫 실행에서 전체 복지자원 검토도 진행합니다. 수집 실패 시 기존 사업과 마지막 성공일을 유지하고 시도일·오류만 갱신합니다. 저장소의 월간 GitHub 링크 감사 워크플로는 별도로 유지됩니다.

복지자원 자료실의 창작물 이용조건은 `docs/usage-terms.html`, 제3자 자료는 원권리자의 조건을 따릅니다.
