# 개인 PC의 Codex·Claude Code 연결 (별도 API 키 불필요)

이음오피스의 AI 사용 방식처럼, 사용자가 설치·로그인한 Codex CLI 또는 Claude Code CLI를 GitHub Pages 평가 홈페이지의 3단계에서 선택적으로 호출합니다.

## Windows 설치·사용
1. https://nodejs.org/ 에서 Node.js 22 이상을 설치합니다.
2. 개인 PC에 Codex CLI 또는 Claude Code CLI를 설치하고 공식 프로그램에서 로그인합니다. PowerShell에서 codex --version 또는 claude --version 으로 확인합니다.
3. GitHub 저장소의 Code → Download ZIP을 눌러 압축을 풀고 server/youth-risk-local/Start-Osan-AI.cmd 파일을 더블클릭합니다. 또는 해당 폴더에서 node local-bridge.mjs 실행.
4. 명령창에 표시되는 48자리 1회 연결 코드를 홈페이지 3단계의 「내 PC AI · Codex/Claude」 영역에 붙여넣습니다. 코드는 공유하지 마세요.
5. PC 연결 확인을 누릅니다. Chrome에서 로컬 네트워크/루프백 접근 요청이 표시되면 접속 사이트를 확인 후 허용합니다.
6. Codex/Claude 중 설치된 것을 선택하고 기관 방침·전송 범위를 확인한 뒤 AI 초안 작성을 실행합니다.
7. 결과는 홈페이지에서 수정·복사·인쇄할 수 있습니다. 명령창을 닫으면 로컬 연결이 해제됩니다.

Mac/Linux: 터미널에서 node server/youth-risk-local/local-bridge.mjs 명령으로 실행합니다.

## 동작 방식과 전송 범위

- GitHub Pages의 3단계 화면 → http://127.0.0.1:8765 (내 PC 루프백) → PC Codex exec 또는 Claude print mode → 사용자가 로그인한 AI 서비스
- 별도의 OpenAI·Claude API 키를 GitHub Pages에 넣지 않습니다.
- 접속용 48자리 토큰은 실행할 때마다 새로 생성됩니다. 브라우저는 입력창에서만 유지하며 영구 저장하지 않습니다.
- PC 프로그램은 127.0.0.1에만 바인딩하며 Host, Origin, 연결 토큰, 입력 형식과 크기, 동시 실행을 검사합니다.
- 이름·주소·연락처·자유기재 상담기록·첨부파일·기관 자원 DB는 전달하지 않습니다.
- 25개 응답(0~4/미상), 현재 안전확인 여부, 계획 집중영역, 교사/사회복지사 관점만 개인 PC에 전달하며, 이 자료는 선택한 Codex/Claude CLI가 해당 AI 서비스로 전송합니다.
- 로컬 연결은 모델이 PC에서 오프라인 실행됨을 뜻하지 않습니다. 실제 AI 처리에는 인터넷과 해당 AI 서비스의 접근권한이 필요합니다.
- 기관 정책·개인정보 처리·국외 이전·AI 서비스 데이터 보관 조건 등을 실제 청소년 데이터 사용 전에 확인해야 합니다.
- 서버 코드는 평가 내용·생성 텍스트를 디스크·DB에 기록하지 않습니다. CLI와 AI 제공업체의 자체 로깅·기록 정책은 별도 확인해야 합니다.
- 기존 규칙 기반 평가·사정·판정·계획과 기존 「AI 요청문·평가자료 복사」는 그대로 유지됩니다.
- 최신 Chrome/Edge의 루프백 접근 권한이 필요할 수 있고, 조직 보안정책에 의해 차단될 수 있습니다.

## 로컬 CLI 호출

Codex: codex exec --ephemeral --sandbox read-only --skip-git-repo-check --ignore-user-config -
Claude: claude -p --output-format text --max-turns 1 --tools "" --disallowedTools "mcp__*"

양쪽 모두 프롬프트를 표준입력으로 전달하며 명령어 문자열은 고정됩니다. CLI는 새 임시 작업 디렉터리에서 동작합니다. 사용자의 실행 환경과 CLI 버전에 따라 일부 플래그가 다를 수 있습니다. 파일 수정·셸 실행을 목적으로 설계하지 않았지만 사용자 PC의 CLI 설정·후크·MCP 확장을 완전히 통제하지는 못합니다.

## 문제 해결

- 연결 실패: PC 연결 프로그램 실행 여부, 48자리 연결 코드, 브라우저의 로컬 네트워크/루프백 접근 허용을 점검하세요.
- 설치 인식 실패: Windows에서 where codex / where claude, Mac/Linux에서 which codex / which claude로 확인하세요. 설치 후 터미널을 다시 엽니다.
- AI 실행 실패: CLI 자체에서 로그인·사용한도·버전을 확인하세요. codex exec --help 또는 claude -p "테스트"로 시험할 수 있습니다.
- 연결 코드는 한 번 프로그램을 종료한 뒤 재시작하면 바뀝니다. 전송할 때마다 브라우저에서 다시 연결 확인을 눌러 주세요.
- PC 연결 없이도 기존 사례보고서·서비스계획서·AI 요청문 복사 기능은 작동합니다.

## 보안 참고

PC에서 로그인한 사용자의 권한으로 AI CLI가 실행됩니다. 내부 기관 PC에서는 관리자 승인 및 개인정보 처리 확인이 선행되어야 합니다. 루프백 접근 제어는 동일 PC의 악의적인 프로그램까지 모두 차단하지 않으므로 연결 코드를 공유하지 않고 사용 후 창을 닫으세요.
