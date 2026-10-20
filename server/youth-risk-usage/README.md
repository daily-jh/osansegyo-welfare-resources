# 이용현황 연결 준비
현재 배포된 사이트는 연결 대기 상태입니다. 과거 방문 수를 알 수 없으며 숫자를 만들거나 브라우저별 값을 전체 누적으로 표시하지 않습니다.

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
