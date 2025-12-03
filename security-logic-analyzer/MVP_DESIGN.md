# MVP (Minimum Viable Product) 설계

## 목표
핵심 개념을 검증할 수 있는 최소한의 동작하는 시스템

## 범위 제한

### 포함 (In Scope)
- ✅ 단일 페이지 또는 소규모 사이트 분석
- ✅ OWASP ZAP 프록시를 통한 트래픽 캡처
- ✅ Playwright를 이용한 기본 브라우저 자동화
- ✅ 간단한 우선순위 기반 정보 분류
- ✅ 2단계 메모리 시스템 (Hot/Cold)
- ✅ LLM을 이용한 기본 로직 추론 (단일 에이전트)
- ✅ 마크다운 리포트 생성

### 제외 (Out of Scope - 추후 버전)
- ❌ 복잡한 크롤링 전략
- ❌ 3단계 메모리 (Warm 계층)
- ❌ Multi-agent LLM 시스템
- ❌ 지식 그래프 데이터베이스
- ❌ 가설 검증 시스템
- ❌ 메타인지 계층
- ❌ 고급 시각화

---

## 시스템 아키텍처 (Simple)

```
┌─────────────────────────────────────────┐
│         Main Orchestrator                │
│    (분석 흐름 제어, 상태 관리)             │
└─────────────────────────────────────────┘
         ↓          ↓           ↓
┌────────────┐ ┌──────────┐ ┌─────────────┐
│  Browser   │ │   ZAP    │ │   Memory    │
│  Driver    │ │  Client  │ │  Manager    │
└────────────┘ └──────────┘ └─────────────┘
         ↓          ↓               ↓
         └──────────┴───────────────┘
                    ↓
         ┌──────────────────────┐
         │   Data Collector     │
         │  (정규화 및 저장)     │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │    Classifier        │
         │  (우선순위 판단)      │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │   LLM Analyzer       │
         │  (로직 추론)          │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │  Report Generator    │
         │  (마크다운 출력)       │
         └──────────────────────┘
```

---

## 데이터 모델

### 1. HTTP Request/Response
```python
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Any, Optional

@dataclass
class HttpTransaction:
    id: str
    timestamp: datetime
    method: str
    url: str
    request_headers: Dict[str, str]
    request_body: Optional[str]
    response_status: int
    response_headers: Dict[str, str]
    response_body: Optional[str]

    # 메타데이터
    priority: str  # 'high', 'medium', 'low'
    category: str  # 'authentication', 'api', 'static', etc.
    analyzed: bool = False
    analysis_result: Optional[Dict[str, Any]] = None
```

### 2. Page Snapshot
```python
@dataclass
class PageSnapshot:
    id: str
    url: str
    timestamp: datetime
    title: str
    html: str  # 전체 HTML (압축 저장)
    screenshot_path: Optional[str]
    forms: List[Dict]  # 폼 정보 추출
    links: List[str]  # 모든 링크
    scripts: List[str]  # 스크립트 URL들

    # 간단한 분석
    has_login_form: bool
    has_payment_form: bool
```

### 3. Analysis Result
```python
@dataclass
class AnalysisResult:
    id: str
    timestamp: datetime
    scope: str  # 'single_request', 'workflow', 'overall'
    subject: str  # 분석 대상 설명

    # LLM 분석 결과
    summary: str
    logic_description: str
    security_observations: List[str]
    questions: List[str]  # 추가 조사 필요한 사항
    confidence: float  # 0.0 ~ 1.0
```

---

## 핵심 모듈 설계

### Module 1: Browser Driver
**책임**: Playwright를 이용한 페이지 탐색 및 상호작용

```python
class BrowserDriver:
    def __init__(self, proxy_url: str):
        """ZAP 프록시 URL 설정"""
        self.proxy_url = proxy_url
        self.browser = None
        self.page = None

    async def start(self):
        """브라우저 시작 (headless mode)"""
        pass

    async def navigate(self, url: str) -> PageSnapshot:
        """페이지로 이동하고 스냅샷 캡처"""
        pass

    async def interact(self, selector: str, action: str):
        """요소와 상호작용 (click, fill, etc.)"""
        pass

    async def extract_forms(self) -> List[Dict]:
        """페이지의 모든 폼 정보 추출"""
        pass

    async def close(self):
        """브라우저 종료"""
        pass
```

### Module 2: ZAP Client
**책임**: OWASP ZAP API와 통신하여 트래픽 데이터 수집

```python
class ZapClient:
    def __init__(self, zap_api_key: str, zap_url: str = 'http://localhost:8080'):
        self.api_key = zap_api_key
        self.zap_url = zap_url

    def get_messages(self, base_url: str) -> List[HttpTransaction]:
        """특정 URL에 대한 모든 HTTP 메시지 가져오기"""
        pass

    def get_alerts(self) -> List[Dict]:
        """ZAP이 발견한 알림 (잠재적 취약점) 가져오기"""
        pass

    def spider(self, url: str):
        """스파이더 실행 (사이트 크롤링)"""
        pass

    def active_scan(self, url: str):
        """액티브 스캔 실행 (MVP에서는 선택적)"""
        pass
```

### Module 3: Memory Manager (Simplified)
**책임**: Hot/Cold 메모리 관리

```python
class MemoryManager:
    def __init__(self, hot_limit: int = 50):
        self.hot_memory: List[HttpTransaction] = []
        self.cold_storage_path = "./data/cold"
        self.hot_limit = hot_limit

    def add(self, transaction: HttpTransaction):
        """새 트랜잭션 추가"""
        if transaction.priority == 'high':
            self._add_to_hot(transaction)
        else:
            self._save_to_cold(transaction)

    def _add_to_hot(self, transaction: HttpTransaction):
        """Hot memory에 추가, 용량 초과 시 LRU 제거"""
        if len(self.hot_memory) >= self.hot_limit:
            # 가장 오래된 low priority 항목 제거
            self._evict_lru()
        self.hot_memory.append(transaction)

    def _save_to_cold(self, transaction: HttpTransaction):
        """Cold storage에 저장 (JSON 파일)"""
        pass

    def get_hot_items(self) -> List[HttpTransaction]:
        """Hot memory의 모든 항목 반환"""
        return self.hot_memory

    def search_cold(self, **filters) -> List[HttpTransaction]:
        """Cold storage 검색"""
        pass

    def promote_to_hot(self, transaction_id: str):
        """Cold에서 Hot으로 승격"""
        pass
```

### Module 4: Classifier
**책임**: Rule-based 우선순위 판단

```python
class Classifier:
    def classify(self, transaction: HttpTransaction) -> tuple[str, str]:
        """
        Returns: (category, priority)
        """
        url = transaction.url
        method = transaction.method
        status = transaction.response_status

        # 인증 관련
        if self._is_auth_related(url, transaction):
            return 'authentication', 'high'

        # API 엔드포인트
        if '/api/' in url:
            if method in ['POST', 'PUT', 'DELETE']:
                return 'api_mutation', 'high'
            else:
                return 'api_query', 'medium'

        # 에러
        if status >= 400:
            return 'error', 'high'

        # 정적 리소스
        if self._is_static_resource(url):
            return 'static', 'low'

        return 'general', 'medium'

    def _is_auth_related(self, url: str, transaction: HttpTransaction) -> bool:
        """인증 관련 판단"""
        auth_keywords = ['login', 'signin', 'auth', 'token', 'session', 'logout']
        if any(kw in url.lower() for kw in auth_keywords):
            return True

        # Response에 토큰이 있는지 확인
        body = transaction.response_body or ''
        if any(kw in body.lower() for kw in ['token', 'jwt', 'session_id']):
            return True

        return False

    def _is_static_resource(self, url: str) -> bool:
        """정적 리소스 판단"""
        static_extensions = ['.css', '.js', '.jpg', '.png', '.gif', '.svg', '.woff', '.ico']
        return any(url.endswith(ext) for ext in static_extensions)
```

### Module 5: LLM Analyzer (Single Agent)
**책임**: LLM을 이용한 로직 분석

```python
class LlmAnalyzer:
    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.api_key = api_key
        self.model = model
        self.client = OpenAI(api_key=api_key)  # or Anthropic

    def analyze_transactions(self, transactions: List[HttpTransaction]) -> AnalysisResult:
        """여러 트랜잭션을 분석하여 로직 추론"""

        # 프롬프트 구성
        prompt = self._build_analysis_prompt(transactions)

        # LLM 호출
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        # 결과 파싱
        result = self._parse_response(response.choices[0].message.content)
        return result

    def _build_analysis_prompt(self, transactions: List[HttpTransaction]) -> str:
        """분석 프롬프트 생성"""
        return f"""
다음 HTTP 트랜잭션들을 분석하여 웹사이트의 로직을 추론해주세요:

{self._format_transactions(transactions)}

다음 형식으로 답변해주세요:
1. **요약**: 이 트랜잭션들이 나타내는 기능을 한 문장으로
2. **로직 설명**: 상세한 동작 방식 (단계별로)
3. **보안 관찰**: 보안과 관련된 특징이나 우려사항
4. **추가 질문**: 더 조사가 필요한 사항

답변은 JSON 형식으로:
{{
  "summary": "...",
  "logic_description": "...",
  "security_observations": ["...", "..."],
  "questions": ["...", "..."],
  "confidence": 0.0-1.0
}}
"""

    def _format_transactions(self, transactions: List[HttpTransaction]) -> str:
        """트랜잭션을 읽기 좋은 형식으로 변환"""
        formatted = []
        for t in transactions:
            formatted.append(f"""
--- Transaction {t.id} ---
{t.method} {t.url}
Status: {t.response_status}
Request Headers: {json.dumps(t.request_headers, indent=2)}
Request Body: {t.request_body[:500] if t.request_body else 'None'}
Response Headers: {json.dumps(t.response_headers, indent=2)}
Response Body: {t.response_body[:500] if t.response_body else 'None'}
""")
        return "\n".join(formatted)
```

**시스템 프롬프트**:
```python
SYSTEM_PROMPT = """
당신은 웹 애플리케이션 보안 전문가입니다.
HTTP 트랜잭션을 분석하여 웹사이트의 비즈니스 로직과 보안 메커니즘을 추론하는 것이 당신의 임무입니다.

분석 시 다음에 주목하세요:
1. 인증 및 권한 관리 메커니즘
2. 상태 관리 (세션, 쿠키, 토큰)
3. 데이터 검증 및 에러 처리
4. API 디자인 패턴
5. 보안 헤더 및 설정
6. 잠재적 취약점

추론은 관찰된 증거에 기반해야 하며, 확실하지 않은 경우 신뢰도를 낮게 평가하고 추가 조사 항목을 제안하세요.
"""
```

### Module 6: Report Generator
**책임**: 분석 결과를 마크다운으로 정리

```python
class ReportGenerator:
    def __init__(self, output_dir: str = "./reports"):
        self.output_dir = output_dir

    def generate(self,
                 site_url: str,
                 page_snapshots: List[PageSnapshot],
                 transactions: List[HttpTransaction],
                 analysis_results: List[AnalysisResult]) -> str:
        """마크다운 리포트 생성"""

        report = []
        report.append(f"# 보안 로직 분석 리포트\n")
        report.append(f"**대상 사이트**: {site_url}\n")
        report.append(f"**분석 일시**: {datetime.now().isoformat()}\n")
        report.append("\n---\n")

        # Executive Summary
        report.append("\n## Executive Summary\n")
        report.append(self._generate_summary(analysis_results))

        # 사이트 구조
        report.append("\n## 사이트 구조\n")
        report.append(self._generate_site_structure(page_snapshots))

        # 트래픽 개요
        report.append("\n## 트래픽 분석\n")
        report.append(self._generate_traffic_overview(transactions))

        # 주요 발견사항
        report.append("\n## 주요 발견사항\n")
        for result in analysis_results:
            report.append(f"\n### {result.subject}\n")
            report.append(f"{result.logic_description}\n")

            if result.security_observations:
                report.append("\n**보안 관찰**:\n")
                for obs in result.security_observations:
                    report.append(f"- {obs}\n")

            if result.questions:
                report.append("\n**추가 조사 필요**:\n")
                for q in result.questions:
                    report.append(f"- {q}\n")

        # Appendix
        report.append("\n## Appendix\n")
        report.append(f"- 총 페이지 수: {len(page_snapshots)}\n")
        report.append(f"- 총 HTTP 트랜잭션: {len(transactions)}\n")
        report.append(f"- High priority 트랜잭션: {sum(1 for t in transactions if t.priority == 'high')}\n")

        report_text = "".join(report)

        # 파일로 저장
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{self.output_dir}/report_{timestamp}.md"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(report_text)

        return filename
```

### Module 7: Main Orchestrator
**책임**: 전체 분석 흐름 조율

```python
class SecurityLogicAnalyzer:
    def __init__(self, config: Dict):
        self.config = config
        self.browser_driver = BrowserDriver(config['zap_proxy_url'])
        self.zap_client = ZapClient(config['zap_api_key'])
        self.memory_manager = MemoryManager()
        self.classifier = Classifier()
        self.llm_analyzer = LlmAnalyzer(config['llm_api_key'])
        self.report_generator = ReportGenerator()

    async def analyze(self, target_url: str) -> str:
        """메인 분석 함수"""

        print(f"[*] 분석 시작: {target_url}")

        # 1. 브라우저 시작 및 페이지 방문
        await self.browser_driver.start()
        print("[*] 페이지 로드 중...")
        page_snapshot = await self.browser_driver.navigate(target_url)

        # 2. ZAP에서 트래픽 수집
        print("[*] 트래픽 수집 중...")
        await asyncio.sleep(2)  # 트래픽이 ZAP에 기록될 시간
        transactions = self.zap_client.get_messages(target_url)

        print(f"[*] {len(transactions)}개 트랜잭션 수집됨")

        # 3. 분류 및 메모리 저장
        print("[*] 트랜잭션 분류 중...")
        for transaction in transactions:
            category, priority = self.classifier.classify(transaction)
            transaction.category = category
            transaction.priority = priority
            self.memory_manager.add(transaction)

        hot_items = self.memory_manager.get_hot_items()
        print(f"[*] Hot memory: {len(hot_items)}개 항목")

        # 4. LLM 분석 (Hot memory 항목들)
        print("[*] LLM 분석 중...")
        analysis_results = []

        # 카테고리별로 그룹화하여 분석
        categories = self._group_by_category(hot_items)
        for category, items in categories.items():
            if items:
                print(f"    - {category} 분석 중...")
                result = self.llm_analyzer.analyze_transactions(items)
                result.subject = category
                analysis_results.append(result)

        # 5. 리포트 생성
        print("[*] 리포트 생성 중...")
        report_path = self.report_generator.generate(
            target_url,
            [page_snapshot],
            transactions,
            analysis_results
        )

        # 6. 정리
        await self.browser_driver.close()

        print(f"[✓] 분석 완료! 리포트: {report_path}")
        return report_path

    def _group_by_category(self, transactions: List[HttpTransaction]) -> Dict[str, List[HttpTransaction]]:
        """카테고리별로 트랜잭션 그룹화"""
        groups = {}
        for t in transactions:
            if t.category not in groups:
                groups[t.category] = []
            groups[t.category].append(t)
        return groups
```

---

## 설정 파일

**config.yaml**:
```yaml
# ZAP 설정
zap:
  url: "http://localhost:8080"
  api_key: "your-zap-api-key"
  proxy_url: "http://localhost:8080"

# LLM 설정
llm:
  provider: "openai"  # or "anthropic"
  api_key: "your-llm-api-key"
  model: "gpt-4"
  temperature: 0.3

# 메모리 설정
memory:
  hot_limit: 50

# 출력 설정
output:
  reports_dir: "./reports"
  data_dir: "./data"

# 브라우저 설정
browser:
  headless: true
  timeout: 30000  # ms
```

---

## 사용 예시

**main.py**:
```python
import asyncio
import yaml

async def main():
    # 설정 로드
    with open('config.yaml', 'r') as f:
        config = yaml.safe_load(f)

    # 분석기 초기화
    analyzer = SecurityLogicAnalyzer(config)

    # 분석 실행
    target_url = "https://example.com"
    report_path = await analyzer.analyze(target_url)

    print(f"\n리포트가 생성되었습니다: {report_path}")

if __name__ == "__main__":
    asyncio.run(main())
```

**실행**:
```bash
# 1. ZAP 실행 (별도 터미널)
zap.sh -daemon -port 8080 -config api.key=your-api-key

# 2. 분석 실행
python main.py
```

**예상 출력**:
```
[*] 분석 시작: https://example.com
[*] 페이지 로드 중...
[*] 트래픽 수집 중...
[*] 45개 트랜잭션 수집됨
[*] 트랜잭션 분류 중...
[*] Hot memory: 12개 항목
[*] LLM 분석 중...
    - authentication 분석 중...
    - api_mutation 분석 중...
[*] 리포트 생성 중...
[✓] 분석 완료! 리포트: ./reports/report_20241203_103045.md
```

---

## 구현 단계

### Week 1: 기본 인프라
- [ ] 프로젝트 구조 생성
- [ ] 의존성 설치 (requirements.txt)
- [ ] 데이터 모델 정의
- [ ] 설정 파일 로딩

### Week 2: 데이터 수집
- [ ] BrowserDriver 구현
- [ ] ZapClient 구현
- [ ] 통합 테스트 (간단한 사이트)

### Week 3: 분석 파이프라인
- [ ] Classifier 구현
- [ ] MemoryManager 구현
- [ ] LlmAnalyzer 구현

### Week 4: 리포팅 및 통합
- [ ] ReportGenerator 구현
- [ ] MainOrchestrator 통합
- [ ] 엔드투엔드 테스트

---

## 테스트 계획

### 테스트 사이트
1. **자체 제작 간단한 사이트**
   - 로그인 기능
   - 간단한 CRUD API
   - 알려진 로직

2. **공개 테스트 사이트**
   - OWASP Juice Shop
   - DVWA (Damn Vulnerable Web Application)

### 성공 기준
- [ ] 인증 메커니즘을 정확히 식별
- [ ] 주요 API 엔드포인트 및 파라미터 파악
- [ ] 보안 관찰 사항이 실제로 의미 있음
- [ ] 리포트가 읽기 쉽고 실용적

---

## 제약 사항 및 알려진 한계

### MVP의 한계
1. **단일 페이지 중심**: 복잡한 네비게이션 처리 안 됨
2. **JavaScript 실행 제한**: 동적으로 생성되는 요청을 모두 캡처하기 어려움
3. **단순 분류**: Rule-based라서 놓칠 수 있음
4. **LLM 비용**: 많은 트랜잭션 → 비용 증가
5. **검증 없음**: LLM의 추론을 검증하지 않음

### 향후 개선
- 복잡한 크롤링 전략
- Warm memory 추가
- Multi-agent 시스템
- 가설 검증 메커니즘
- 대규모 사이트 처리 최적화

---

## 예상 리소스

### 하드웨어
- CPU: 4 cores (브라우저 + ZAP)
- RAM: 8GB (Playwright + ZAP + Python)
- Disk: 10GB (로그 및 데이터)

### 소프트웨어
- Python 3.11+
- OWASP ZAP 2.14+
- Playwright
- LLM API 접근

### 비용 (예상)
- LLM API: $0.1 ~ $1 per site (사이트 크기에 따라)
- 인프라: 로컬 실행 시 무료

---

## 다음 단계

1. **이 MVP 설계 검토**
   - 현실적인가?
   - 핵심 개념을 검증할 수 있는가?
   - 빠진 부분이 있는가?

2. **프로토타입 구현 시작**
   - Week 1부터 순차적으로
   - 각 주마다 동작하는 버전 유지

3. **테스트 및 반복**
   - 실제 사이트로 테스트
   - 피드백 반영
   - 점진적 개선
