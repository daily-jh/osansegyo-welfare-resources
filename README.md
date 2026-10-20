# 함께찾는 복지자원 | 오산시·경기도·전국 민간자원 통합검색

2026년 10월 기준 **1차 조사·편집본**으로 제작된 정적 검색 홈페이지입니다. **기관명 기준으로 동일 기관의 서비스를 하나로 묶어** 보여줍니다. 최초 등록 데이터는 **46개 기관·체계 / 111개 서비스**입니다.

**기획·편집·웹사이트 제작 표기:** 오산세교종합사회복지관 김지훈 팀장  
**저작권 표기:** © 2026 오산세교종합사회복지관 김지훈 팀장. All rights reserved.  
자세한 권리 범위는 [COPYRIGHT.md](COPYRIGHT.md)를 확인하십시오.

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

## 엑셀(CSV)로 정보 수정하기

1. `data/resources.csv`를 Excel로 열어 서비스를 추가/수정합니다.
2. 같은 기관의 여러 서비스를 각각 한 줄씩 입력하고, **범주와 기관명을 같은 표기**로 유지합니다.
3. CSV를 UTF-8로 저장하고 프로젝트 루트에서 아래 명령을 실행합니다.

```bash
python scripts/build_data.py
```

4. 수정된 `data/resources.csv`, `docs/resources.csv`, `docs/assets/data.js` 3개 파일을 GitHub에 커밋합니다. `docs/` 변경사항은 GitHub Pages에서 다시 배포됩니다.

### 파일 배치

```text
├── README.md
├── COPYRIGHT.md
├── data/
│   └── resources.csv       # Excel 편집용 원본 (기관당 여러 서비스 행)
├── scripts/
│   └── build_data.py       # 기관명·범주 단위로 데이터를 묶어 웹용 변환
└── docs/                 # GitHub Pages 공개 루트
    ├── .nojekyll
    ├── index.html
    ├── resources.csv
    ├── robots.txt
    └── assets/
        ├── app.js
        ├── data.js
        ├── styles.css
        └── favicon.svg
```

## 운영상 주의사항

- 공개 사이트입니다. **대상자 성명, 연락처, 건강·부채·상담기록 등 개인정보를 등록하지 마십시오.**
- 사이트 자료는 2026년 10월의 **실무용 1차 자원 목록**이지, 모든 프로그램의 운영 및 접수 가능 여부를 개별적으로 검증한 공인 자료가 아닙니다. **정확한 신청 기준·지원 한도·접수기한·사업 존속 여부는 반드시 각 기관의 최신 공식 안내를 확인**하십시오.
- `data/resources.csv`에는 기관별 출처 URL과 최종검토일이 있어 자료 검증·추적에 활용할 수 있습니다.
- 전체 사이트의 코드·디자인 및 독창적 자료 편집에 대한 권리 표기는 외부 기관의 명칭·상표·원자료나 법적 사실에 대한 배타적 권리를 의미하지 않습니다. 직원이 업무상 제작한 저작물의 법적 권리 귀속은 근로규정·계약 등 추가 검토가 필요할 수 있습니다.
- 누구나 링크로 열 수 있는 **공개형 GitHub Pages**입니다. 비공개 접근 제한 기능은 포함하지 않았습니다.
