# OY-CIE V3.3.1 해석표본·모델 이견 품질검사

기존 공식 CORE 점수·안전판정은 불변이다.

12만 건 합성 표본 중 약 1,792건을 별도로 선택해 K-CARR과 OY-CIE의 안전 관련 플래그를 비교하고, 일치/이견을 저장한다. 안전 플래그의 의미와 적용 범위가 서로 다르므로 이견은 전문가 검토 대상으로만 분류하며 오류율·정답률로 환산하지 않는다.

GitHub Actions 보관파일에는 metrics.json, representative-interpretations.jsonl (중복 제거 대표 연구형 해석문 1,600건), cross-model-observations.json, seed-contrast-audit.json, exceptions.json을 포함한다.

실제 학생 원자료를 넣지 않으며 외부 AI 자동 전송을 수행하지 않는다. 전문가 평정·실증 타당성은 미실시 상태이다.