# Security Logic Analyzer - 설계 문서

## 1. 문제 공간 분석

### 1.1 핵심 문제
**"웹사이트의 비즈니스 로직과 보안 메커니즘을 자동으로 이해하고 문서화하는 것"**

이것이 어려운 이유:
- 로직이 클라이언트(JavaScript), 서버(Backend), 데이터베이스에 분산되어 있음
- 표면적 HTTP 요청/응답만으로는 내부 로직을 완전히 파악하기 어려움
- 상태 의존적 동작 (인증, 세션, 권한)
- 암묵적 비즈니스 규칙 (입력 검증, 워크플로우, 트랜잭션)
- 동적으로 생성되는 UI와 비동기 통신

### 1.2 기존 도구의 한계
- **OWASP ZAP**: 취약점 스캔에 강하지만, "왜 이런 로직인가?"를 설명하지 못함
- **브라우저 자동화**: 동작은 재현하지만 의도를 이해하지 못함
- **수동 분석**: 시간이 오래 걸리고 일관성 부족

### 1.3 우리의 접근
**인지적 보안 분석 시스템**: 인간 보안 전문가의 분석 과정을 모델링

---

## 2. 인지학적 모델 - 인간은 어떻게 사이트를 이해하는가?

### 2.1 인간 보안 전문가의 분석 프로세스

#### Phase 1: 초기 탐색 (Reconnaissance)
- 사이트 구조 파악 (사이트맵, 네비게이션)
- 주요 기능 식별 (로그인, 결제, 데이터 조회 등)
- 기술 스택 추론 (프레임워크, 라이브러리)

**인지 프로세스**: Bottom-up 정보 수집, 패턴 인식

#### Phase 2: 인터랙션 관찰 (Observation)
- 각 기능을 실제로 사용해봄
- 네트워크 트래픽 관찰
- UI 변화와 서버 응답 상관관계 파악
- 정상/비정상 시나리오 비교

**인지 프로세스**: 액티브 러닝, 가설 생성

#### Phase 3: 추론 및 모델링 (Inference)
- 관찰된 데이터로부터 내부 로직 추론
  - "이 API는 권한 체크를 하는 것 같다"
  - "토큰이 만료되면 401을 반환한다"
  - "결제는 3단계 프로세스를 따른다"
- 상태 머신 구성
- 데이터 흐름 다이어그램 생성

**인지 프로세스**: Top-down 추론, 멘탈 모델 구축

#### Phase 4: 검증 (Verification)
- 가설을 테스트로 검증
- 엣지 케이스 탐색
- 보안 취약점 확인

**인지 프로세스**: 실험적 검증, 반례 찾기

#### Phase 5: 통합 및 문서화 (Integration)
- 부분적 이해를 전체 시스템 관점으로 통합
- 계층적 구조로 정리
- 보안 시사점 도출

**인지 프로세스**: 지식 통합, 추상화

### 2.2 인지적 요소들

1. **주의 (Attention)**
   - 어디를 먼저 볼 것인가?
   - 우선순위: 인증 > 권한 > 민감 데이터 처리 > 비즈니스 로직

2. **작업 기억 (Working Memory)**
   - 현재 분석 중인 컨텍스트 유지
   - 최근 관찰 결과 저장

3. **장기 기억 (Long-term Memory)**
   - 과거 경험에서 나온 패턴 지식
   - "JWT 토큰은 보통 Authorization 헤더에 있다"
   - "REST API는 일반적으로 CRUD 패턴을 따른다"

4. **추론 (Reasoning)**
   - 귀납적: 여러 사례로부터 일반 규칙 도출
   - 연역적: 알려진 규칙으로부터 특정 케이스 예측
   - 유비: 비슷한 시스템과 비교

5. **메타인지 (Metacognition)**
   - "내가 정말 이해한 것인가?"
   - "더 확인이 필요한가?"
   - "놓친 부분이 있는가?"

---

## 3. 시스템 아키텍처

### 3.1 전체 구조 - 다층 인지 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  Meta-Cognitive Layer                    │
│         (분석 진행 상황 모니터링 및 전략 조정)             │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│              Reasoning & Integration Layer               │
│    (LLM 기반 추론, 로직 통합, 지식 그래프 구축)           │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                 Observation Layer                        │
│        (데이터 수집, 정규화, 초기 패턴 인식)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Browser  │  │ ZAP API  │  │ Traffic  │             │
│  │ Crawler  │  │ Scanner  │  │ Analyzer │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│     (관찰 데이터, 중간 표현, 지식 베이스)                  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 레이어별 상세 설계

#### Layer 1: Observation Layer (관찰 계층)

**역할**: 원시 데이터 수집 및 정규화

**구성 요소**:

1. **Browser Crawler** (Playwright 기반)
   - 페이지 탐색 및 상호작용
   - DOM 구조 캡처
   - JavaScript 이벤트 모니터링
   - 스크린샷 및 동작 녹화

2. **ZAP Integration**
   - 프록시를 통한 모든 HTTP/HTTPS 트래픽 캡처
   - 패시브 스캔 결과 수집
   - 스파이더 결과 통합

3. **Traffic Analyzer**
   - HTTP 요청/응답 파싱
   - API 엔드포인트 추출
   - 파라미터 및 헤더 분석
   - 응답 패턴 분석 (JSON 스키마, 에러 메시지)

**출력**: 구조화된 관찰 데이터 (JSON)

#### Layer 2: Reasoning & Integration Layer (추론 계층)

**역할**: 관찰 데이터로부터 고수준 로직 추론

**구성 요소**:

1. **Pattern Recognizer**
   - 인증/인가 패턴 인식
   - API 디자인 패턴 식별 (REST, GraphQL, RPC)
   - 상태 관리 패턴 파악

2. **Logic Inferencer** (LLM 기반)
   - 프롬프트 엔지니어링을 통한 로직 추론
   - 다중 관점 분석 (클라이언트 관점, 서버 관점, 데이터 관점)
   - 체인 오브 씽킹 (Chain of Thought) 적용

3. **Knowledge Graph Builder**
   - 엔티티 및 관계 추출
   - 그래프 데이터베이스 구축
   - 로직 플로우 다이어그램 생성

4. **Hypothesis Manager**
   - 가설 생성, 저장, 검증
   - 신뢰도 점수 관리
   - 검증 전략 계획

**출력**: 중간 표현 (IR) - 반구조화된 로직 모델

#### Layer 3: Meta-Cognitive Layer (메타인지 계층)

**역할**: 분석 과정 자체를 모니터링하고 최적화

**구성 요소**:

1. **Coverage Tracker**
   - 어느 부분이 충분히 분석되었는가?
   - 미탐색 영역 식별

2. **Confidence Evaluator**
   - 추론 결과의 신뢰도 평가
   - 불확실성이 높은 부분 식별

3. **Strategy Selector**
   - 다음에 무엇을 분석할지 결정
   - 탐색 vs 활용 균형 (Exploration-Exploitation)

4. **Progress Monitor**
   - 분석 진행 상황 시각화
   - 사용자에게 중간 리포트 제공

---

## 4. 지식 표현 방법

### 4.1 다층 표현 구조

#### Level 0: Raw Data
```json
{
  "type": "http_request",
  "timestamp": "2024-12-03T10:30:00Z",
  "method": "POST",
  "url": "/api/login",
  "headers": {...},
  "body": {...},
  "response": {...}
}
```

#### Level 1: Semantic Events
```json
{
  "type": "authentication_attempt",
  "endpoint": "/api/login",
  "method": "credential_based",
  "parameters": ["username", "password"],
  "success": true,
  "token_issued": "jwt",
  "session_created": true
}
```

#### Level 2: Logic Components
```json
{
  "component": "authentication_system",
  "type": "security_mechanism",
  "subcomponents": [
    {
      "name": "credential_validator",
      "inputs": ["username", "password"],
      "process": "hash_comparison",
      "outputs": ["validation_result"]
    },
    {
      "name": "token_issuer",
      "inputs": ["user_id"],
      "process": "jwt_generation",
      "outputs": ["access_token", "refresh_token"]
    }
  ],
  "flow": "sequential",
  "error_handling": [...]
}
```

#### Level 3: Business Logic Model
```json
{
  "domain": "user_management",
  "workflows": [
    {
      "name": "user_authentication",
      "description": "사용자 인증 및 세션 생성 프로세스",
      "steps": [...],
      "preconditions": [...],
      "postconditions": [...],
      "security_properties": [
        "password_hashed",
        "rate_limiting_applied",
        "session_timeout_configured"
      ]
    }
  ],
  "state_machine": {...},
  "invariants": [...]
}
```

### 4.2 지식 그래프 스키마

**노드 타입**:
- Page (페이지)
- Endpoint (API 엔드포인트)
- Parameter (파라미터)
- Entity (비즈니스 엔티티)
- Function (기능)
- SecurityMechanism (보안 메커니즘)
- Workflow (워크플로우)

**관계 타입**:
- LINKS_TO (페이지 간 네비게이션)
- CALLS (페이지가 API 호출)
- REQUIRES (인증/권한 요구)
- VALIDATES (검증 로직)
- TRANSFORMS (데이터 변환)
- DEPENDS_ON (의존성)
- IMPLEMENTS (구현 관계)

---

## 5. LLM 활용 전략

### 5.1 Multi-Agent LLM 시스템

**Agent 1: Explorer**
- 역할: 관찰 데이터 요약 및 주목할 패턴 식별
- 입력: Raw data + Context
- 출력: Key findings, Patterns, Questions

**Agent 2: Analyst**
- 역할: 깊이 있는 로직 분석
- 입력: Explorer의 findings + Domain knowledge
- 출력: Logic models, Hypotheses

**Agent 3: Critic**
- 역할: 분석 결과 검증 및 대안 제시
- 입력: Analyst의 결과
- 출력: Validation results, Alternative interpretations

**Agent 4: Synthesizer**
- 역할: 여러 분석 통합 및 일관성 있는 문서 생성
- 입력: All agents' outputs
- 출력: Unified report

### 5.2 프롬프트 엔지니어링 전략

**기법 1: Few-Shot Learning**
- 유사한 사이트의 분석 예시 제공
- 패턴 라이브러리 구축

**기법 2: Chain of Thought**
```
1. 관찰된 현상: "POST /api/users에 토큰 없이 요청하면 401 반환"
2. 가능한 해석: "이 엔드포인트는 인증이 필요함"
3. 검증 방법: "유효한 토큰으로 재시도"
4. 추가 질문: "토큰은 어디서 얻는가?"
```

**기법 3: Self-Consistency**
- 같은 질문을 여러 번, 다른 방식으로 물어봄
- 답변의 일관성 체크

**기법 4: Retrieval-Augmented Generation (RAG)**
- 보안 지식 베이스 (OWASP, CWE, CVE)
- 과거 분석 결과
- 도메인 특화 지식

### 5.3 LLM의 한계 및 보완

**한계**:
- Hallucination: 근거 없는 추론
- Context window: 긴 데이터 처리 어려움
- 비결정성: 같은 입력에 다른 출력

**보완책**:
- 구조화된 출력 강제 (JSON schema validation)
- 핵심 데이터만 선택적으로 제공
- 앙상블 방법 (여러 모델의 결과 통합)
- Rule-based validation

---

## 6. 점진적 학습 메커니즘

### 6.1 Active Learning Cycle

```
1. 초기 탐색 (Broad scan)
   → 전체 사이트맵 생성

2. 흥미로운 지점 식별 (Interest point detection)
   → 인증 메커니즘, 민감 데이터 처리 등

3. 깊이 탐색 (Deep dive)
   → 선택된 기능에 대한 상세 분석

4. 가설 검증 (Hypothesis testing)
   → 추론된 로직 테스트

5. 지식 통합 (Knowledge integration)
   → 새로운 발견을 기존 모델에 통합

6. 다음 목표 선정 (Next target selection)
   → 메타인지 계층에서 결정

→ 2번으로 돌아가 반복
```

### 6.2 Uncertainty-Driven Exploration

- 신뢰도가 낮은 부분 우선 탐색
- 모순되는 증거가 있는 경우 추가 조사
- Coverage gap 메우기

### 6.3 Incremental Knowledge Base

- 분석 중에도 계속 지식 그래프 업데이트
- 새로운 발견이 기존 이해를 수정할 수 있음
- 버전 관리 (지식의 진화 과정 추적)

---

## 7. 데이터 수집 및 처리 파이프라인

### 7.1 파이프라인 구조

```
[Seed URLs]
    ↓
[Browser Crawler + ZAP Proxy]
    ↓
[Traffic Capture & Storage]
    ↓
[Normalization & Enrichment]
    ↓
[Feature Extraction]
    ↓
[Pattern Recognition]
    ↓
[LLM Reasoning]
    ↓
[Knowledge Graph]
    ↓
[Report Generation]
```

### 7.2 병렬 처리 전략

- 여러 페이지 동시 크롤링
- LLM 추론 배치 처리
- 비동기 I/O 활용

### 7.3 데이터 저장

**시계열 데이터**:
- InfluxDB or TimescaleDB
- HTTP 트래픽, 성능 메트릭

**그래프 데이터**:
- Neo4j
- 로직 그래프, 의존성

**문서 데이터**:
- MongoDB or PostgreSQL (JSONB)
- 관찰 데이터, 분석 결과

**벡터 데이터**:
- Pinecone or Weaviate
- 임베딩 저장, 시맨틱 검색

---

## 8. 출력 및 리포팅

### 8.1 리포트 구조

```markdown
# 사이트 보안 로직 분석 리포트

## Executive Summary
- 사이트 개요
- 주요 발견 사항
- 보안 권장 사항

## 1. 사이트 구조
- 사이트맵 (시각화)
- 기술 스택
- 주요 기능 목록

## 2. 인증 및 권한 관리
- 인증 메커니즘 상세 분석
- 세션 관리
- 권한 체계
- 발견된 이슈

## 3. 비즈니스 로직
- 주요 워크플로우 다이어그램
- 상태 머신
- 데이터 흐름
- 검증 로직

## 4. API 분석
- 엔드포인트 목록 및 기능
- 파라미터 및 스키마
- 에러 처리
- Rate limiting

## 5. 보안 메커니즘
- CSRF 보호
- XSS 방지
- SQL Injection 방지
- 기타 보안 헤더

## 6. 발견된 취약점
- 심각도별 분류
- 재현 방법
- 영향도
- 수정 권장 사항

## 7. 로직 그래프
- 상호작용 다이어그램
- 의존성 그래프

## Appendix
- Raw data summary
- 분석 메타데이터
```

### 8.2 시각화

- **사이트맵**: D3.js 기반 인터랙티브 트리
- **로직 플로우**: Mermaid 다이어그램
- **지식 그래프**: Cytoscape.js 기반 네트워크 그래프
- **시계열 분석**: Plotly 차트

---

## 9. 기술 스택 (잠정)

### Core
- **Language**: Python 3.11+
- **Async Framework**: asyncio, aiohttp

### Data Collection
- **Browser Automation**: Playwright
- **Security Scanner**: OWASP ZAP Python API
- **HTTP Client**: httpx

### Data Processing
- **Data Analysis**: pandas, numpy
- **Pattern Recognition**: scikit-learn (clustering, classification)

### LLM & AI
- **LLM API**: OpenAI API / Anthropic Claude API / Local LLM (Ollama)
- **Embeddings**: sentence-transformers
- **Vector DB**: ChromaDB (embedded)

### Knowledge Storage
- **Graph DB**: Neo4j (or networkx for lightweight)
- **Document DB**: SQLite + JSON (초기) → PostgreSQL (확장)
- **Vector DB**: ChromaDB

### Visualization & Reporting
- **Report Generation**: Jinja2 templates → Markdown → HTML/PDF
- **Visualization**: Plotly, Mermaid.js
- **Graph Viz**: Cytoscape.js

### Orchestration
- **Workflow**: Custom async pipeline
- **Logging**: structlog
- **Config**: pydantic settings

---

## 10. 구현 단계 (Phased Approach)

### Phase 0: MVP (Minimum Viable Product)
**목표**: 기본적인 파이프라인 구축 및 검증

- [ ] 단일 페이지 크롤링 + ZAP 연동
- [ ] HTTP 트래픽 파싱 및 저장
- [ ] 단순 패턴 인식 (정규표현식 기반)
- [ ] LLM을 이용한 단순 분석 (단일 프롬프트)
- [ ] 텍스트 기반 리포트 생성

**예상 출력**: "이 사이트는 JWT 기반 인증을 사용하며, /api/login 엔드포인트가 있습니다"

### Phase 1: 다층 추상화 구현
- [ ] Observation Layer 완성
- [ ] Semantic event 추출
- [ ] 기본 지식 표현 구조
- [ ] Multi-turn LLM conversation

### Phase 2: 추론 및 검증
- [ ] Hypothesis management
- [ ] Active testing (가설 기반 테스트 생성)
- [ ] Knowledge graph 구축
- [ ] 신뢰도 평가

### Phase 3: 메타인지 및 최적화
- [ ] Meta-cognitive layer
- [ ] Adaptive exploration
- [ ] 성능 최적화

### Phase 4: 고도화
- [ ] Multi-agent LLM system
- [ ] 도메인 특화 지식 베이스
- [ ] 자동 취약점 검증
- [ ] 대규모 사이트 처리

---

## 11. 평가 방법

### 11.1 정성적 평가

**기준**:
1. **완전성**: 주요 로직을 얼마나 커버했는가?
2. **정확성**: 추론된 로직이 실제와 일치하는가?
3. **유용성**: 보안 전문가가 리포트를 보고 실제로 도움을 받을 수 있는가?
4. **효율성**: 수동 분석 대비 시간 절약

**방법**:
- 실제 사이트 테스트 (허가받은 환경)
- 보안 전문가 리뷰

### 11.2 정량적 평가

**메트릭**:
- Coverage: 발견된 엔드포인트 수 / 전체 엔드포인트 수
- Precision/Recall: 식별된 보안 메커니즘의 정확도
- Processing time: 페이지당 분석 시간

---

## 12. 윤리적 고려사항

### 12.1 사용 시나리오 제한
- **허용**: 자신의 사이트, 허가받은 펜테스팅, 교육 목적
- **금지**: 무단 스캔, 악의적 목적

### 12.2 안전 장치
- Rate limiting (과도한 요청 방지)
- 민감 데이터 자동 마스킹
- 로컬 저장 (외부 전송 최소화)

### 12.3 책임 있는 공개
- 취약점 발견 시 responsible disclosure
- 자동화된 공격 방지

---

## 13. 다음 단계

1. **이 설계 문서 검토 및 피드백**
   - 빠진 부분이 있는가?
   - 비현실적인 부분이 있는가?
   - 우선순위 조정이 필요한가?

2. **Phase 0 MVP 상세 설계**
   - 구체적인 모듈 인터페이스
   - 데이터 스키마
   - 테스트 계획

3. **프로토타입 구현 시작**

---

## 참고 문헌 및 영감

- **Cognitive Architectures**: ACT-R, SOAR
- **Active Learning**: Uncertainty sampling, Query by committee
- **Program Analysis**: Static analysis, Dynamic analysis, Symbolic execution
- **Security Testing**: OWASP Testing Guide, PTES
- **Knowledge Representation**: Ontologies, Semantic networks
- **LLM Applications**: ReAct, Reflexion, AutoGPT patterns
