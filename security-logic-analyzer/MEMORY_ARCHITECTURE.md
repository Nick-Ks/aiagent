# 기억 및 주의 메커니즘 설계

## 핵심 원칙: "모든 것을 기억하되, 효율적으로"

### 인간 보안 전문가의 정보 처리 방식

```
페이지 로드
    ↓
빠른 스캔 (1-2초) ─────→ 관련성 판단
    ↓                      ↓
    ↓                   [무관함]
    ↓                      ↓
    ↓                  얕은 저장 (cold)
    ↓
[관련 있을 것 같음]
    ↓
상세 검토
    ↓
중요도 평가
    ↓
    ├─→ [매우 중요] → 깊은 분석 및 저장 (hot)
    ├─→ [중간 중요] → 요약 저장 (warm)
    └─→ [참고 사항] → 인덱스만 저장 + 재방문 가능 (cold)
```

---

## 1. Attention Mechanism (주의 메커니즘)

### 1.1 정보 중요도 판단 기준

#### 즉각 주의를 요하는 요소 (High Priority)
- 인증/인가 관련 (로그인, 토큰, 세션)
- 민감 데이터 (개인정보, 결제정보)
- 보안 헤더 및 설정
- 에러 메시지 (정보 노출 가능성)
- API 엔드포인트 및 파라미터
- 상태 변경 작업 (POST, PUT, DELETE)

#### 중간 주의 (Medium Priority)
- 일반 비즈니스 로직
- UI 워크플로우
- 데이터 검증 로직
- 정적 리소스 구조

#### 낮은 주의 (Low Priority)
- 정적 콘텐츠 (이미지, CSS 일부)
- 마케팅 관련 요소
- 분석/트래킹 스크립트 (보안과 무관한 경우)

### 1.2 동적 주의 조정

**컨텍스트 기반 우선순위 변경**:
```python
class AttentionManager:
    def calculate_relevance(self, item, context):
        base_score = self.get_base_priority(item)

        # 현재 분석 중인 주제와의 연관성
        context_bonus = self.context_similarity(item, context.current_focus)

        # 현재까지의 발견과의 연결성
        connection_bonus = self.connection_strength(item, context.knowledge_graph)

        # 불확실성 (모호한 부분일수록 더 주의)
        uncertainty_bonus = context.get_uncertainty(item.domain)

        return base_score + context_bonus + connection_bonus + uncertainty_bonus
```

**예시**:
- 현재 "인증 메커니즘"을 분석 중이라면 → JWT, OAuth 관련 요소의 우선순위 상승
- "결제 프로세스"를 보고 있다면 → 트랜잭션, 검증 로직의 우선순위 상승

---

## 2. Memory Hierarchy (계층적 기억)

### 2.1 3단계 기억 구조

```
┌────────────────────────────────────────┐
│          Hot Memory (작업 기억)          │
│  - 현재 분석 중인 핵심 데이터             │
│  - 완전한 원본 데이터 보존                │
│  - LLM에 직접 제공                       │
│  - 크기: ~50-100 항목                    │
└────────────────────────────────────────┘
            ↕ (승격/강등)
┌────────────────────────────────────────┐
│         Warm Memory (단기 기억)          │
│  - 최근 분석했거나 관련 있는 데이터        │
│  - 요약 또는 구조화된 형태                │
│  - 필요 시 LLM에 제공                    │
│  - 크기: ~500-1000 항목                  │
└────────────────────────────────────────┘
            ↕ (승격/아카이브)
┌────────────────────────────────────────┐
│         Cold Memory (장기 기억)          │
│  - 전체 수집 데이터                       │
│  - 메타데이터 + 인덱스                    │
│  - 검색 가능, 필요시 재로드               │
│  - 크기: 무제한                          │
└────────────────────────────────────────┘
```

### 2.2 각 계층의 상세 설계

#### Hot Memory (작업 기억)
**역할**: 현재 "생각"하고 있는 내용

**저장 형식**: 완전한 원본 + 주석
```json
{
  "id": "req_001",
  "type": "http_request",
  "priority": "high",
  "reason": "authentication endpoint",
  "data": {
    "method": "POST",
    "url": "/api/login",
    "headers": {...},
    "body": {...},
    "response": {...}
  },
  "annotations": {
    "analyzed": true,
    "findings": ["jwt_token_issued", "session_created"],
    "questions": ["token_expiry_time?", "refresh_mechanism?"]
  }
}
```

**관리 정책**:
- LRU (Least Recently Used) 기반 교체
- 중요도가 높아지면 유지 기간 연장
- 분석 완료 후에도 일정 시간 유지 (후속 질문 대비)

#### Warm Memory (단기 기억)
**역할**: 최근 맥락 유지, 빠른 상기

**저장 형식**: 요약 + 키 정보
```json
{
  "id": "req_001",
  "summary": "POST /api/login: credential-based auth, issues JWT",
  "key_fields": ["username", "password", "access_token"],
  "related_ids": ["req_002", "req_015"],
  "timestamp": "2024-12-03T10:30:00Z",
  "full_data_location": "cold://req_001"
}
```

**관리 정책**:
- 시간 기반 강등 (일정 시간 접근 없으면 cold로 이동)
- 연관성 기반 유지 (현재 분석 주제와 관련 있으면 유지)
- 벡터 임베딩 저장 (시맨틱 검색 가능)

#### Cold Memory (장기 기억)
**역할**: 전체 데이터 아카이브, 재방문 가능

**저장 형식**: 압축 + 인덱스
```json
{
  "id": "req_001",
  "indexed_fields": {
    "url": "/api/login",
    "method": "POST",
    "status": 200,
    "content_type": "application/json",
    "timestamp": "2024-12-03T10:30:00Z"
  },
  "tags": ["authentication", "api", "success"],
  "storage_path": "/data/raw/2024-12-03/req_001.json.gz"
}
```

**관리 정책**:
- 모든 raw data 보존 (디스크 저장)
- 다차원 인덱싱 (URL, 타입, 태그, 시간 등)
- 풀텍스트 검색 지원
- 필요시 즉시 로드 가능

### 2.3 메모리 승격/강등 흐름

```python
class MemoryManager:
    def on_new_data(self, item):
        """새 데이터 수집 시"""
        relevance = self.attention_manager.calculate_relevance(item)

        if relevance > THRESHOLD_HOT:
            self.hot_memory.add(item)  # 즉시 분석 대상
        elif relevance > THRESHOLD_WARM:
            self.warm_memory.add(item)  # 요약하여 저장
        else:
            self.cold_memory.add(item)  # 인덱스만 저장

    def on_analysis_request(self, topic):
        """새로운 분석 주제 시작 시"""
        # Warm/Cold에서 관련 항목 찾기
        relevant_items = self.search_memory(topic)

        # Hot으로 승격
        for item in relevant_items:
            self.promote_to_hot(item)

    def on_memory_full(self, memory_type):
        """메모리 용량 초과 시"""
        if memory_type == "hot":
            # 가장 덜 중요한 항목을 warm으로 강등
            items_to_demote = self.hot_memory.get_lru(count=10)
            for item in items_to_demote:
                summary = self.summarize(item)
                self.warm_memory.add(summary)
                self.hot_memory.remove(item)
```

---

## 3. Lazy Evaluation (지연 평가)

### 3.1 개념
"모든 것을 즉시 상세 분석하지 않고, 필요할 때 분석"

### 3.2 구현 전략

#### 1단계: 빠른 분류 (Fast Triage)
```python
def quick_classify(item):
    """수 초 내에 빠르게 분류"""
    # Rule-based 빠른 패턴 매칭
    if '/login' in item.url or '/auth' in item.url:
        return 'authentication', 'high'
    if item.method in ['POST', 'PUT', 'DELETE']:
        return 'state_changing', 'medium'
    if item.status_code >= 400:
        return 'error', 'high'
    # ... 더 많은 휴리스틱
    return 'general', 'low'
```

#### 2단계: 필요시 상세 분석 (Deep Analysis on Demand)
```python
def analyze_deeply(item):
    """실제로 필요할 때만 LLM 호출"""
    if not item.needs_deep_analysis:
        return

    # Cold storage에서 전체 데이터 로드
    full_data = self.cold_memory.load(item.id)

    # LLM에게 상세 분석 요청
    analysis = self.llm.analyze(full_data, context=self.get_context())

    # 결과를 hot memory에 저장
    self.hot_memory.add_analysis(item.id, analysis)
```

### 3.3 언제 Deep Analysis를 트리거하는가?

1. **사용자 질문**: "로그인 로직이 어떻게 되어 있나요?"
   → 해당 부분 즉시 상세 분석

2. **연결 발견**: A를 분석하다가 B를 참조하는 것 발견
   → B를 hot memory로 승격 및 분석

3. **이상 징후**: 예상과 다른 동작
   → 관련 부분 재분석

4. **불확실성 높음**: 신뢰도가 낮은 추론
   → 추가 데이터 수집 및 분석

---

## 4. Summarization Strategies (요약 전략)

### 4.1 계층적 요약

#### Level 1: Ultra-Short Summary (1줄)
```
POST /api/login → JWT auth (200 OK)
```

#### Level 2: Short Summary (3-5줄)
```
Endpoint: POST /api/login
Purpose: User authentication
Input: username, password
Output: access_token (JWT), refresh_token
Security: HTTPS, bcrypt password hashing
```

#### Level 3: Detailed Summary (1단락)
```
This endpoint implements credential-based authentication.
It accepts username and password, validates against database
(passwords stored as bcrypt hashes), and upon success, issues
a JWT access token (30min expiry) and refresh token (7 days).
Rate limiting is applied (5 attempts per IP per minute).
Failed attempts are logged but don't reveal whether username exists.
```

#### Level 4: Full Data
원본 HTTP request/response 전체

### 4.2 요약 레벨 선택

```python
def get_summary(item, detail_level='auto'):
    if detail_level == 'auto':
        # 현재 컨텍스트에서 얼마나 중요한지에 따라
        importance = self.calculate_importance(item, self.context)
        if importance > 0.8:
            return item.full_data
        elif importance > 0.5:
            return item.detailed_summary
        elif importance > 0.2:
            return item.short_summary
        else:
            return item.ultra_short_summary
```

---

## 5. Revisit Mechanism (재방문 메커니즘)

### 5.1 "나중에 다시 보기" 전략

**시나리오**: 처음 봤을 때는 중요하지 않았지만, 나중에 중요해지는 경우

**구현**:

```python
class RevisitManager:
    def mark_for_revisit(self, item_id, reason, trigger_condition):
        """나중에 다시 볼 항목 표시"""
        self.revisit_queue.add({
            'item_id': item_id,
            'reason': reason,
            'trigger': trigger_condition,  # 언제 다시 볼지
            'priority': self.calculate_priority(reason)
        })

    def check_triggers(self, new_finding):
        """새로운 발견이 있을 때 재방문 트리거 체크"""
        for item in self.revisit_queue:
            if item.trigger.is_met(new_finding):
                # Cold/Warm에서 Hot으로 승격
                self.promote_for_reanalysis(item.item_id)
```

**예시**:
1. 처음에 `/api/users` 엔드포인트 발견 → 일반 CRUD로 분류 (warm)
2. 나중에 권한 체크 버그 발견
3. "사용자 관련 모든 엔드포인트 재검토" 트리거
4. `/api/users`를 다시 hot memory로 승격하여 재분석

### 5.2 인덱싱 및 검색

**빠른 재방문을 위한 다차원 인덱스**:

```python
# URL 패턴 인덱스
index.url['/api/*'] → [req_001, req_015, req_033, ...]

# 기능별 인덱스
index.function['authentication'] → [req_001, req_002, ...]
index.function['payment'] → [req_050, req_051, ...]

# 보안 메커니즘 인덱스
index.security['jwt'] → [req_001, req_015, ...]
index.security['csrf'] → [req_020, req_025, ...]

# 시간 인덱스
index.time['2024-12-03T10:*'] → [req_001, req_002, ...]

# 벡터 인덱스 (시맨틱 검색)
index.vector[embedding] → 유사한 항목들
```

**검색 예시**:
```python
# "인증과 관련된 에러를 다시 보고 싶다"
results = index.search(
    function='authentication',
    status_code=range(400, 500)
)
```

---

## 6. Context Window Management (컨텍스트 관리)

### 6.1 문제
LLM의 context window는 제한적 (예: 128K tokens)

### 6.2 해결책: 동적 컨텍스트 구성

```python
def build_llm_context(query):
    """쿼리에 대해 최적의 컨텍스트 구성"""

    # 1. 필수 컨텍스트 (항상 포함)
    context = [
        system_prompt,
        current_goal,
        knowledge_graph_summary  # 전체가 아닌 요약
    ]

    # 2. 쿼리 관련 hot memory 항목들 (높은 우선순위)
    relevant_hot = self.hot_memory.search(query, limit=20)
    context.extend(relevant_hot)

    # 3. 남은 공간에 warm memory에서 관련 항목 추가
    remaining_tokens = MAX_TOKENS - count_tokens(context)
    relevant_warm = self.warm_memory.search(query, limit=remaining_tokens)
    context.extend(relevant_warm)

    return context
```

### 6.3 점진적 컨텍스트 확장

**처음에는 요약만**, 필요하면 상세 내용 추가:

```
User: "로그인 메커니즘을 설명해줘"

Assistant에게 제공되는 컨텍스트:
  [Pass 1] Summary: "JWT-based auth at POST /api/login"

  ↓ (Assistant가 더 자세한 정보 요청)

  [Pass 2] Detailed: {full request/response, headers, validation logic}

  ↓ (Assistant가 관련 엔드포인트 질문)

  [Pass 3] Related: {/api/refresh, /api/logout, ...}
```

---

## 7. 효과 측정

### 7.1 메트릭

**효율성**:
- Context window 사용률 (평균 60-70% 목표)
- 불필요한 LLM 호출 횟수 (최소화)
- 재방문 빈도 (적당히 있어야 정상)

**효과성**:
- 중요 정보 놓침률 (0에 가깝게)
- 추론 정확도 (메모리 관리로 인한 성능 저하 없어야 함)

### 7.2 A/B 테스트

**설정 A**: 모든 데이터를 항상 LLM에 제공 (naive)
**설정 B**: 제안한 계층적 메모리 시스템

비교 지표:
- 분석 품질 (같거나 더 나아야 함)
- 처리 속도 (B가 더 빨라야 함)
- 비용 (B가 더 저렴해야 함)

---

## 8. 구현 우선순위

### Phase 0 (MVP)
- [ ] 간단한 우선순위 분류 (rule-based)
- [ ] 2단계 메모리 (hot/cold)
- [ ] 기본 요약 (3 레벨)

### Phase 1
- [ ] 3단계 메모리 (hot/warm/cold)
- [ ] 동적 attention 계산
- [ ] 벡터 기반 검색

### Phase 2
- [ ] 재방문 메커니즘
- [ ] 메타인지 기반 메모리 관리
- [ ] 최적화 및 튜닝

---

## 9. 예시 시나리오

### 시나리오: 대형 전자상거래 사이트 분석

**초기 크롤링 결과**:
- 500개 페이지
- 2,000개 HTTP 요청
- 50MB raw data

**Naive 접근**:
- 모든 2,000개 요청을 LLM에 입력 → Context window 초과 또는 매우 느림

**우리 접근**:

1. **빠른 분류** (1분)
   - 인증 관련: 15개 → Hot
   - 결제 관련: 30개 → Hot
   - 상품 조회: 200개 → Warm (요약)
   - 정적 리소스: 1,755개 → Cold (인덱스만)

2. **초기 분석** (5분)
   - Hot memory 45개 항목만 LLM에 제공
   - 주요 로직 파악

3. **필요 시 확장** (10분)
   - "장바구니 로직 분석해줘" → 관련 Warm 항목들을 Hot으로 승격
   - Cold에서 추가 데이터 로드

4. **재방문** (5분)
   - "CSRF 보호가 모든 곳에 있나?" → 태그 기반 검색으로 관련 Cold 항목 재분석

**결과**:
- 총 20분 만에 핵심 분석 완료
- Context window 효율적 사용
- 중요 정보 누락 없음

---

## 참고: 인지과학 이론

- **Atkinson-Shiffrin Memory Model**: Sensory → Short-term → Long-term
- **Working Memory (Baddeley)**: 제한된 용량의 작업 기억
- **Attention Theory (Kahneman)**: 주의 자원의 배분
- **Information Foraging Theory**: 정보 탐색의 최적화
