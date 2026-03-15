# Baby App 개발 아키텍처 공식 문서

> 이 문서는 AI(Claude)와 개발자(minsukhong)가 합의한 공식 아키텍처입니다.
> AI는 이 문서를 반드시 따르며, 임의로 구조를 변경하지 않습니다.
> 구조 변경이 필요할 경우 반드시 개발자에게 먼저 설명하고 승인을 받아야 합니다.

---

## 1. 아키텍처 방식: MSA (Microservices Architecture)

각 서비스는 독립된 컨테이너로 분리됩니다.
하나의 서비스 변경이 다른 서비스에 영향을 주지 않습니다.

---

## 2. 컨테이너 구조

```
baby-app/
├── frontend/          ← Next.js 컨테이너 (포트 3000)
├── backend/           ← FastAPI 컨테이너 (포트 8000)
├── db/                ← PostgreSQL 컨테이너 (포트 5432)
└── ai-service/        ← AI Agent 컨테이너 (포트 8001) [추후 추가]
```

### 각 컨테이너 역할

| 컨테이너 | 기술 | 포트 | 역할 |
|---------|------|------|------|
| frontend | Next.js 14 + React + TypeScript + Tailwind | 3000 | 사용자 화면 |
| backend | FastAPI + Python 3.11 | 8000 | API 서버, 비즈니스 로직 |
| db | PostgreSQL 16 | 5432 | 데이터 저장 |
| ai-service | FastAPI + Python + Claude API | 8001 | AI Agent (추후 추가) |

---

## 3. Dev Container 구조

```
.devcontainer/
├── devcontainer.json      ← VSCode Dev Container 설정
└── docker-compose.yml     ← 전체 컨테이너 구성

frontend/
└── Dockerfile             ← Node.js 20 기반

backend/
└── Dockerfile             ← Python 3.11 기반 + 패키지 자동 설치

db/
└── init.sql               ← DB 초기 설정
```

### VSCode 개발 방식
- frontend 작업 시: VSCode → frontend 컨테이너 접속
- backend 작업 시: VSCode → backend 컨테이너 접속
- 전체 실행: docker-compose로 모든 컨테이너 동시 실행

---

## 4. Git 브랜치 전략

```
master          ← 배포용 (완성된 코드만)
develop         ← 개발 통합 브랜치
feature/기능명   ← 새 기능 개발
hotfix/버그명    ← 긴급 버그 수정
```

### 작업 흐름
```
feature/* → develop → master
```

---

## 5. 기술 스택 (확정)

| 분류 | 기술 | 버전 |
|------|------|------|
| Frontend | Next.js | 14 |
| Frontend | React | 18 |
| Frontend | TypeScript | 5 |
| Frontend | Tailwind CSS | 3 |
| Backend | Python | 3.11 |
| Backend | FastAPI | 0.111 |
| Database | PostgreSQL | 16 |
| AI | Claude API (Anthropic) | 추후 확정 |
| 컨테이너 | Docker + Docker Compose | - |
| 배포 | Vercel (frontend) + Railway (backend) | 추후 |

---

## 6. AI가 반드시 지켜야 할 규칙

1. 이 문서에 정의된 구조를 임의로 변경하지 않는다
2. 더 쉬운 방법이 있어도 MSA 구조를 유지한다
3. 구조 변경이 필요하면 반드시 개발자에게 먼저 설명하고 승인받는다
4. 새 서비스 추가 시 기존 서비스 코드를 건드리지 않는다
5. 개발자가 이해하지 못한 상태에서 진행하지 않는다
