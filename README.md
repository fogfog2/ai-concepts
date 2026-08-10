# AI Concepts

매일의 AI 소식과, **모델이 만들어져 서비스되기까지의 순서**로 정리한 기술 문서 모음입니다.

👉 **[사이트 보기](https://fogfog2.github.io/ai-concepts/)**

**49편 · 9단계** · 한국어 · 라이트/다크 지원 · 외부 폰트·CDN 없음

## 페이지 구성

| 위치 | 내용 | 성격 |
|---|---|---|
| **위** | 오늘의 소식 — 최근 24시간 AI 뉴스와 원문 링크 | 날짜가 붙어 흘러가는 것 |
| **아래** | 기술 문서 49편 — 파이프라인 단계별 | 순서가 있어 쌓이는 것 |

두 구역은 성격이 다르므로 시각적으로도 다르게 처리했습니다.
소식은 **읽는 단락**으로, 문서는 **괘선으로 나뉜 목록**으로 보입니다.

지난 날짜는 소식 아래 버튼으로 넘겨볼 수 있습니다 (최근 14일).

---

## 분류 — 왜 파이프라인 단계인가

주제별(언어/비전/생성)로 묶으면 겹침이 심합니다.
Transformer·MoE·Normalization 은 도메인과 무관하고, ViT 는 비전이자 아키텍처입니다.
난이도별로 묶으면 주관적이고 문서가 늘 때마다 재조정해야 합니다.

**파이프라인 단계**로 묶으면 한 문서가 정확히 한 단계에 속해 겹침이 없고,
**순서 자체가 읽는 순서**가 됩니다. 위에서부터 읽으면 하나의 흐름이 되고,
필요한 단계만 골라 봐도 됩니다.

| 단계 | 편 | 문서 |
|---|---|---|
| **01 기초**<br>모든 모델의 밑바닥 부품 | 4 | Tokenization · Normalization · Embeddings & Positional Encoding · Backpropagation & Optimizers |
| **02 아키텍처**<br>무엇을 쌓을 것인가 | 7 | Transformer · Vision Transformer · Mixture of Experts · RNN & LSTM · Mamba & SSM · Autoencoders & VAE · Graph Neural Networks |
| **03 학습**<br>어떤 과제로 가르칠 것인가 | 7 | BERT & Masked LM · Diffusion Models · CLIP · Scaling Laws · Self-Supervised Learning · GAN · 데이터 품질과 커리큘럼 |
| **04 적응·정렬**<br>학습된 모델을 길들이기 | 6 | LoRA · RLHF · Instruction Tuning · DPO · PEFT · Constitutional AI |
| **05 추론 최적화**<br>같은 모델을 싸고 빠르게 | 6 | FlashAttention · KV Cache & PagedAttention · Speculative Decoding · Quantization · Knowledge Distillation · Pruning & Sparsity |
| **06 학습 인프라**<br>어떻게 굴리는가 | 3 | 분산 학습(DP·TP·PP) · Mixed Precision · Gradient Checkpointing |
| **07 응용·시스템**<br>실제로 쓰이는 형태 | 6 | RAG · Model Context Protocol · In-Context Learning · Chain-of-Thought · AI Agents & Tool Use · LLM 서빙 |
| **08 평가·안전**<br>잘 됐는지 어떻게 아는가 | 4 | 평가와 벤치마크 · 환각 · Prompt Injection · 해석가능성 |
| **09 특집 — 객체 검출**<br>손으로 정하던 것을 학습으로 | 6 | Object Detection 계보 · YOLO 계보 · DETR 계보 · RF-DETR · YOLOv5 · YOLOX |

---

## 문서의 형태

각 편은 아래를 갖춥니다.

- **번호 붙은 절** — 문제 제기에서 시작해 원리, 한계, 현재 위치 순으로
- **수식 블록** — 핵심 식만. 유도 과정보다 *왜 그 형태인지*에 무게를 둡니다
- **손으로 짠 SVG 도식** — 이미지 파일이 아니라 인라인 SVG. 테마를 따라가고 확대해도 깨지지 않습니다
- **arXiv 인용** — 원 논문으로 바로 갈 수 있게
- **편별 팔레트** — 문서마다 다른 색. 라이트/다크 양쪽 정의

수치는 가능한 한 계산해 확인한 것만 싣고, **출처가 서로 어긋나면 그 사실을 적습니다.**

---

## 구조

```
index.html      목록 페이지
style.css       공통 스타일
ai.js           목록 렌더링
data/
  artifacts.json   문서 목록 (자동 생성 — 직접 편집하지 마세요)
docs/
  <slug>.html      문서 본문 49편
```

`data/artifacts.json` 과 각 문서의 상단 네비게이션은 **자동 생성**됩니다.
직접 고치면 다음 배포 때 덮어써집니다.

---

## 갱신 방법

이 저장소는 **결과물만** 담습니다.
문서를 만드는 생성기와 갱신 루틴은 별도 저장소에 있습니다.

> **[fogfog2/ai-daily-routine](https://github.com/fogfog2/ai-daily-routine)**

수정하려면 그쪽의 `scripts/docs/gen_<주제>.py` 를 고치고 `./scripts/ship-docs.sh` 를 돌립니다.
검증(태그 균형 · 테마 정의 · SVG 접근성 · 상호링크 · 유출 스캔)을 통과해야 배포됩니다.

**이 저장소의 HTML 을 직접 편집하지 마세요.** 다음 배포에 덮어써집니다.
