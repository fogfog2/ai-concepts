# AI Concepts

AI 기술 문서를 **파이프라인 → 개념 지도 → 본문** 순서로 탐색하는 정적 사이트입니다.

👉 [사이트 보기](https://fogfog2.github.io/ai-concepts/)

현재 문서 85편, 9단계입니다. 첫 화면의 단계 카드를 누르면 두 번째 화면에 해당 단계의 주요 갈래와 연결된 문서가 나타납니다. 아키텍처 단계는 Transformer·CNN·상태 공간 모델 등으로 나뉘며 LLM / Vision / 공통 관점으로 좁혀 볼 수 있습니다. 검색과 태그 필터로 전체 문서를 바로 찾을 수도 있습니다.

## 콘텐츠

- **오늘의 추천:** `data/recommendation.json`의 날짜·문서·선정 이유를 표시합니다.
- **AI 소식:** `data/news.json`에서 마지막 게시일을 명시하고, 원문으로 연결합니다.
- **에이전트 벤치마크:** [benchmarks.html](benchmarks.html)에 Claude Code·Codex·Gemini의 같은 벤치마크 탭에서 공개된 결과를 출처·모델·하네스·effort와 함께 표시합니다. Jev는 평가 목적이 달라 별도로 추적합니다. `data/benchmarks.json`에 확인일과 변경 이력을 보관합니다.
- **기술 문서:** 각 문서에 목차와 이전·다음 탐색 링크가 있습니다.

## 구조

```text
index.html / style.css / ai.js           첫 화면과 개념 지도
benchmarks.html / benchmarks.css / js    에이전트 벤치마크
docs-nav.css / docs-nav.js               문서 공통 탐색
data/artifacts.json                      문서 목록
data/news.json                           최근 소식
data/recommendation.json                 오늘의 추천
data/benchmarks.json                     공개 평가 결과
docs/<slug>.html                         기술 문서 85편
```

데이터 파일과 기술 문서는 [ai-daily-routine](https://github.com/fogfog2/ai-daily-routine)의 카탈로그·생성기·뉴스 아카이브에서 만들어집니다. 다음 동기화에서 덮어써지므로 생성된 JSON이나 HTML은 직접 편집하지 않습니다. UI 파일은 이 저장소에서 관리합니다.

로컬 확인은 이 폴더에서 `python -m http.server 8765`를 실행한 뒤 `http://localhost:8765/`를 열면 됩니다.
