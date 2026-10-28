# 이용현황 집계 운영
2026-10-21 Cloudflare Worker와 D1을 연결했습니다. 엔드포인트: https://osan-youth-usage.daily-89.workers.dev/ . 홈페이지 접속 시 방문, 25문항 결과 최초 생성 시 평가 완료를 집계합니다. 연결 이전 수치는 포함하지 않습니다. 계정 토큰은 사이트 코드에 저장하지 않습니다.

## 관리자 연결 절차
1. 운영자 Cloudflare 계정에서 Workers/D1 사용 가능 여부와 무료 플랜 한도를 확인합니다. 유료 전환은 별도 승인 사항입니다.
2. 이 폴더에서 Wrangler 로그인 후 `npx wrangler d1 create osan-youth-usage`를 실행합니다.
3. 반환된 database_id를 wrangler.toml에 설정합니다. 계정 토큰은 GitHub·사이트 코드에 넣지 않습니다.
4. `npx wrangler d1 execute osan-youth-usage --remote --file=schema.sql`로 테이블을 준비합니다.
5. `npx wrangler deploy` 후 생성된 HTTPS 주소를 docs/youth-risk/usage-config.js의 YOUTH_USAGE_ENDPOINT에 넣고 사이트를 배포합니다.
6. 실제 방문 1회, 평가 완료 1회, 결과 버튼 반복 클릭, 초기화 후 새 평가, 한국시간 날짜 전환을 확인합니다. 테스트는 별도 DB에서 시행합니다.

## 집계 정의
- 이 평가 페이지만 대상. 방문은 페이지 로드 1회, 고유 사람 수 아님. 새로고침은 새 방문.
- 25문항 유효 채점 후 최초 결과 생성 1회. 수정·재계산은 추가 집계하지 않음. 초기화 후 새 평가만 다시 집계.
- 한국시간 날짜 기준. 연결 이전 수치는 복구 불가. 광고차단/오프라인/통신실패는 누락 가능.
- 전송 허용 필드는 event와 무작위 UUID뿐. 이름·점수·안전신호·문항 응답·리뷰·연락처를 보내거나 DB에 저장하지 않음. 브라우저 저장소와 쿠키 사용 안 함.
- 서버는 임시 이벤트 ID와 날짜/종류, 일별 집계를 저장. 중복 ID 삽입은 원자적으로 무시. 호스팅 사업자는 네트워크 메타데이터를 처리할 수 있음.
- 공개 이벤트 API라 자동화·위조 요청을 완전히 차단하지 못함. 공식 실적/고유 이용자 증빙용으로 사용하지 않음. Origin 제한은 브라우저 접근 통제이지 인증이 아님. 운영 시 Cloudflare 요청 제한·봇 정책 및 사용량 점검 필요.
- 연결 오류는 대시로 표시하거나 마지막 확인값임을 안내하며 평가를 막지 않음. 매 이벤트 후 갱신하며 상시 실시간 접속자 수가 아님.

공식 문서: https://developers.cloudflare.com/d1/worker-api/d1-database/
요금·한도 확인: https://developers.cloudflare.com/workers/platform/pricing/ 및 https://developers.cloudflare.com/d1/platform/pricing/


## 이용자 의견(2026-10-28 추가)
OY-RALS 화면 아래 '의견 보내기'에서 두 가지를 받습니다. 같은 Worker의 `/feedback` 경로를 씁니다.
- 오류·수정 요청: 비공개. 관리 화면(`youth-risk/feedback-admin.html`)에서만 봅니다. 어떤 경우에도 공개로 바꿀 수 없습니다.
- 사용 후기: 들어오면 '승인 대기'. 관리 화면에서 '공개'를 눌러야 OY-RALS 화면 아래 목록에 보입니다.
- 받지 않는 것: 휴대전화 번호, 이메일, 주민등록번호, '학생 이름' 표현, 학교·학년·반(화면과 서버가 같은 규칙으로 막음). 이름·연락처·IP는 저장하지 않습니다. 남용 방지를 위해 하루 단위 익명 키(IP+날짜+비밀값의 해시)와 건수만 두고 다음 날 지웁니다. 같은 키 하루 5건, 전체 하루 300건.
- Worker에 의견 기능이 배포되기 전에는 화면에 '준비 중'으로 보이고 보내기가 막힙니다.

### 처음 한 번 배포(운영자)
1. 이 폴더에서 `npx wrangler login`
2. 표 만들기: `npx wrangler d1 execute osan-youth-usage --remote --file=feedback-schema.sql` (기존 집계 표는 건드리지 않음)
3. 관리 비밀번호 설정: `npx wrangler secret put FEEDBACK_ADMIN_TOKEN` (20자 이상 무작위 문자열, 저장소·사이트에 적지 않음)
4. 익명 키용 비밀값: `npx wrangler secret put FEEDBACK_SALT` (아무 무작위 문자열)
5. `npx wrangler deploy`
6. 확인: OY-RALS 화면 아래 '의견 보내기'에서 '준비 중'이 사라지는지, 관리 화면에서 비밀번호로 불러와지는지.

시험: `node feedback.test.mjs`(API), `node ../../e2e/youth-feedback-flow.cjs`(화면).
