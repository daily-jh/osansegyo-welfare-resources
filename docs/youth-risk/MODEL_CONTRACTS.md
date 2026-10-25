# OY-RALS 운영 모델 연결표 (2026-10-26)

> 실제 메인 페이지에서 읽는 파일과 연구 작업실에만 존재하는 모델을 구분합니다. 이 문서는 연구·개발 기록이며 임상 검증 또는 전문가 합의를 뜻하지 않습니다.

## 실행 경로

1. 공식 평가 및 안전판정: criteria.js / weight-model.js / support-model.js. 유일한 공식 원점수는 25문항 0~4점 합계이며, unknown을 0으로 대체하지 않습니다.
2. 문항·교차 의미 해석(ICSI 기능): cie-semantic-layer-v2.js의 interpret/formulate/interpretItemScore/evidenceAssessment. 별도 검증된 절단점이 아닙니다.
3. 서술형 정보 구조화(NCB 기능): case-context-core.js의 reconcile/infer. 입력 문장은 사실 확정이 아닙니다.
4. 자체 맥락 추론(OY-CIE 운영 계층): cie-semantic-layer-v2.js → journey-model-v88.js. OY-CIE V3.2 연구 작업실 엔진과 동일한 실행 경로가 아닙니다.
5. 독립 한국어 사례분석(K-CARR V8.1): k-carr-narrative-v81.js의 assess. 서술형 입력이 있을 때 model-gateway-v90.js가 병렬 호출합니다. 점수·안전판정 수정 권한은 없습니다.
6. 통합사례관리(ICMS 기능): planning-model.js의 analyze 및 journey-model-v88.js의 analyze/text가 사정·협의·계획을 실행합니다. 독립 ICMS 모델 파일/버전이 이 메인 페이지에 연결되었다고 주장하지 않습니다.
7. 관계도: relations-v88.js.
8. 지역자원 추천: support-model.js, support.html, 실제 자원 DB. 접수 가능·이용 승인 여부는 별도 확인합니다.
9. 상태·화면: flow.js → 이벤트 oy-journey-view → journey-v88.js. Unified CaseState의 전체 영속적 저장은 별도 구현 검증 대상입니다.
10. 일관성 관문: model-gateway-v90.js. 입력 불변, 원점수, 미상, 사정 섹션, 계획 근거를 검사합니다.

## 연구 작업실과 운영 페이지의 차이

- 별도 연구 작업실 cie-lab-v32/는 OYCIE30 V3.1 코어, OYCIE32 V3.2 대화 계층, 300개 교차 가설 자료, 600개 응답 DB 및 라우팅 인덱스를 사용하도록 구성됩니다.
- 연구 작업실의 지식베이스 연결 상태는 별도 점검해야 하며, 운영 페이지에 대용량 모델 전체가 직접 로드된 것으로 표현하지 않습니다.
- K-CARR의 독립 서술형 분석은 메인 페이지에 연결되지만, 의료 진단·사건 확인·신고 판단·실제 서비스 실행을 대신하지 않습니다.

## 안전·개인정보 계약

- CORE의 answers, official decision, followups는 하위 해석 모델이 덮어쓰지 않습니다.
- 미상만 존재하는 영역과 하위 문항은 실행 서비스계획으로 자동 승격하지 않습니다. 별도 확인 과제로 유지합니다.
- 서술형 가설은 학생·가족 상황을 확정하지 않으며, 부정·과거·제3자 발화를 구분합니다.
- PDF/ZIP/TXT에 서술·직접 메모를 넣는 동작은 기본적으로 꺼져 있어야 하며 이용자가 선택한 경우에만 포함합니다.
- 총점과 별개로 현재 안전 신호를 확인합니다. 실무자 확인과 신고·보호 절차를 대체하지 않습니다.
- 모델 버전 표시는 코드 내부 VERSION을 사용하고, 독립 검증되지 않은 모듈을 별도 AI 학습모델이라고 주장하지 않습니다.

## 자동검증

- .github/workflows/oy-rals-model-contract.yml
- tests/oy-model-contract.test.cjs: 1,200개 결정론적 가상 사례, 원점수, 미상, 안전문항, 분야별 계획, 입력 불변, 독립 K-CARR 연계 검사.
- 기존 youth-risk 및 복지자원 회귀 테스트도 함께 통과해야 배포합니다.

## 구조도

~~~mermaid
flowchart TD
 A[CORE 25문항] --> B[ICSI 문항·점수 해석]
 A --> C[NCB 서술형 정보]
 B --> D[OY-CIE 통합맥락 계층]
 C --> D
 C --> E[K-CARR V8.1 독립 서술형 해석]
 D --> F[지원연계 지도]
 D --> G[ICMS 사정·협의·계획 기능]
 E --> G
 F --> G
 G --> H[PDF·ZIP·기록]
 I[Model Gateway 계약 검사] -. 검증 .-> D
 I -. 검증 .-> G
 J[Unified CaseState 실행상태] -. 단계 공유 .-> H
~~~

## 남은 구조 고도화 과제

- 실증 타당도 연구(전문가 평정/준거 타당도/일치도): 미완료.
- OY-CIE V3.2 연구 작업실의 근거 자료를 운영 맥락으로 안전하게 공급할 인터페이스: 추후 통합 필요.
- ICMS 별도 개발 아카이브·다중 사례관리 기법의 최신판을 실제 런타임과 비교: 추후 확인 필요.
- 개인 AI와 직접 연결 기능: 현재 요청문 복사/외부 서비스 열기와 별도 구분.
- 실제 브라우저 E2E 검증(가계도·생태도, 모바일, PDF): 개발환경 브라우저 자동화 별도 필요.
