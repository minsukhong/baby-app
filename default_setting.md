# Baby App 기본 개발 환경 세팅
> 버전: 1단계
> 작성일: 2026-03-15
> 목적: 어떤 AI든 이 파일을 참고해 100% 동일한 환경을 재현할 수 있도록 작성

---

## 1. 전제 조건 (사전 설치 필요)

| 도구 | 버전 | 용도 |
|------|------|------|
| Windows 11 | - | OS |
| Docker Desktop | 4.64.0 | 컨테이너 실행 |
| VSCode | 최신 | 코드 편집기 |
| VSCode Dev Containers 확장 | ms-vscode-remote.remote-containers | 컨테이너 접속 |
| GitHub CLI (gh) | 최신 | GitHub 연동 |
| Sourcetree | 최신 | Git GUI |
| Chrome | 최신 | 브라우저 (gh auth 기본 브라우저) |

### GitHub CLI 브라우저 설정
```bash
gh config set browser "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

### GitHub 인증
```bash
gh auth login
# GitHub.com → HTTPS → Login with a web browser 선택
```

---

## 2. 프로젝트 구조

```
baby-app/
├── .devcontainer/
│   ├── devcontainer.json        ← VSCode Dev Container 설정
│   ├── docker-compose.yml       ← 전체 컨테이너 구성
│   └── Dockerfile               ← (현재 미사용, 향후 확장용)
├── frontend/                    ← Next.js 14 코드
│   ├── Dockerfile               ← node:20 기반
│   ├── .dockerignore
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── postcss.config.js
├── backend/                     ← FastAPI 코드
│   ├── Dockerfile               ← python:3.11-slim 기반
│   ├── .dockerignore
│   ├── main.py
│   └── requirements.txt
├── db/
│   └── init.sql                 ← PostgreSQL 초기 설정
├── ARCHITECTURE.md              ← 공식 아키텍처 문서
├── default_setting.md           ← 현재 파일 (환경 세팅 가이드)
├── .gitignore
└── README.md
```

---

## 3. 아키텍처: MSA (Microservices Architecture)

각 서비스는 독립된 컨테이너로 분리. 하나의 변경이 다른 서비스에 영향 없음.

| 컨테이너 | 이미지 | 포트 | 역할 |
|---------|--------|------|------|
| frontend | node:20 | 3000 | Next.js (React + TypeScript + Tailwind) |
| backend | python:3.11-slim | 8000 | FastAPI (Python) |
| db | postgres:16 | 5432 | PostgreSQL |

---

## 4. 핵심 설정 파일 내용

### .devcontainer/devcontainer.json
```json
{
  "name": "baby-app",
  "dockerComposeFile": "docker-compose.yml",
  "service": "frontend",
  "workspaceFolder": "/app",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "ms-azuretools.vscode-docker",
        "ckolkman.vscode-postgres"
      ]
    }
  },
  "forwardPorts": [3000, 8000, 5432],
  "portsAttributes": {
    "3000": { "label": "Frontend (Next.js)" },
    "8000": { "label": "Backend (FastAPI)" },
    "5432": { "label": "Database (PostgreSQL)" }
  }
}
```

### .devcontainer/docker-compose.yml
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ../frontend:/app
      - /app/node_modules
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    command: sh -c "npm run dev -- -H 0.0.0.0 & sleep infinity"

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ../backend:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/babyapp
    depends_on:
      - db
    command: sh -c "cd /app && uvicorn main:app --reload --host 0.0.0.0 --port 8000 & sleep infinity"

  db:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=babyapp
    volumes:
      - ../db/init.sql:/docker-entrypoint-initdb.d/init.sql
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### frontend/Dockerfile
```dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["sleep", "infinity"]
```

### backend/Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["sleep", "infinity"]
```

---

## 5. Git 브랜치 전략

```
master          ← 배포용 (완성된 코드만)
develop         ← 개발 통합 브랜치  ← 현재 작업 브랜치
feature/기능명   ← 새 기능 개발
hotfix/버그명    ← 긴급 버그 수정
```

작업 흐름: `feature/*` → `develop` → `master`

GitHub 저장소: https://github.com/minsukhong/baby-app

---

## 6. 개발 시작 방법 (매번 작업 시)

### 컨테이너 시작
```bash
docker compose -f ".devcontainer/docker-compose.yml" up -d
```

### VSCode에서 frontend 접속
1. VSCode에서 `baby-app` 폴더 열기
2. `Ctrl+Shift+P` → `Dev Containers: Reopen in Container`
3. frontend 컨테이너 자동 접속됨
4. `localhost:3000` 자동으로 뜸

### VSCode에서 backend 접속
1. `Ctrl+Shift+P` → `Dev Containers: Attach to Running Container`
2. `devcontainer-backend-1` 선택
3. `Open Folder` → `/app` 입력
4. `localhost:8000` 자동으로 뜸

### 확인
- `localhost:3000` → 아기 케어 앱 화면
- `localhost:8000` → `{"message": "아기 케어 앱 API 정상 실행 중"}`

---

## 7. 컨테이너 초기화가 필요할 때

```bash
# 모든 컨테이너 중지 및 삭제
docker stop $(docker ps -aq) && docker rm $(docker ps -aq)

# 다시 시작
docker compose -f ".devcontainer/docker-compose.yml" up -d
```

---

## 8. AI에게 명령할 때 주의사항

1. 이 문서의 구조를 그대로 유지할 것
2. MSA 구조 (frontend/backend/db 분리) 절대 변경 금지
3. docker-compose command의 `& sleep infinity` 패턴 유지할 것
4. 구조 변경 필요 시 반드시 개발자 승인 후 진행
5. 새 서비스 추가 시 이 문서 업데이트 필수
